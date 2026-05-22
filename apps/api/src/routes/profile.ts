import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { extractText } from '../lib/extractText.js';
import { parseResume } from '../llm/parseResume.js';
import { LinksSchema, AchievementSchema, ResumeJsonSchema } from '@reach/shared';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const profileRouter = Router();

profileRouter.use(requireAuth);

// camelCase API ↔ snake_case DB. Centralize mapping here.
type ProfileRow = {
  user_id: string;
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  resume_text: string;
  resume_json: unknown;
  skills: string[];
  achievements: unknown;
  links: unknown;
  onboarded_at: string | null;
  updated_at: string;
};

function rowToApi(r: ProfileRow) {
  return {
    userId: r.user_id,
    name: r.name,
    headline: r.headline,
    email: r.email,
    phone: r.phone,
    location: r.location,
    resumeText: r.resume_text,
    resumeJson: r.resume_json,
    skills: r.skills,
    achievements: r.achievements,
    links: r.links,
    onboardedAt: r.onboarded_at,
    updatedAt: r.updated_at,
  };
}

profileRouter.get('/', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('user_id', req.userId!)
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: 'db_error', detail: error.message });
    return;
  }
  if (!data) {
    res.status(404).json({ error: 'profile_missing' });
    return;
  }
  res.json(rowToApi(data as ProfileRow));
});

profileRouter.post('/resume', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'missing_file' });
    return;
  }
  let text: string;
  try {
    text = await extractText(file.buffer, file.mimetype, file.originalname);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'extract_failed';
    res.status(415).json({ error: msg });
    return;
  }
  if (!text.trim()) {
    res.status(422).json({ error: 'empty_extract' });
    return;
  }

  let parsed;
  try {
    parsed = await parseResume(text);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'parse_failed';
    res.status(502).json({ error: 'parse_failed', detail: msg });
    return;
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      name: parsed.name,
      headline: parsed.headline,
      email: parsed.email || req.userEmail || '',
      phone: parsed.phone,
      location: parsed.location,
      resume_text: text,
      resume_json: parsed.resumeJson,
      skills: parsed.skills,
    })
    .eq('user_id', req.userId!);

  if (error) {
    res.status(500).json({ error: 'db_error', detail: error.message });
    return;
  }

  res.json({
    name: parsed.name,
    headline: parsed.headline,
    email: parsed.email,
    phone: parsed.phone,
    location: parsed.location,
    resumeJson: parsed.resumeJson,
    skills: parsed.skills,
    resumeText: text,
  });
});

const PatchSchema = z
  .object({
    name: z.string().max(200),
    headline: z.string().max(300),
    email: z.string().max(200),
    phone: z.string().max(60),
    location: z.string().max(200),
    resumeText: z.string().max(200_000),
    resumeJson: ResumeJsonSchema.nullable(),
    skills: z.array(z.string().max(80)).max(200),
    achievements: z.array(AchievementSchema).max(5),
    links: LinksSchema,
    onboardedAt: z.string().datetime().nullable(),
  })
  .partial();

profileRouter.patch('/', async (req, res) => {
  const parsed = PatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_body', issues: parsed.error.issues });
    return;
  }
  const p = parsed.data;
  const update: Record<string, unknown> = {};
  if (p.name !== undefined) update.name = p.name;
  if (p.headline !== undefined) update.headline = p.headline;
  if (p.email !== undefined) update.email = p.email;
  if (p.phone !== undefined) update.phone = p.phone;
  if (p.location !== undefined) update.location = p.location;
  if (p.resumeText !== undefined) update.resume_text = p.resumeText;
  if (p.resumeJson !== undefined) update.resume_json = p.resumeJson;
  if (p.skills !== undefined) update.skills = p.skills;
  if (p.achievements !== undefined) update.achievements = p.achievements;
  if (p.links !== undefined) update.links = p.links;
  if (p.onboardedAt !== undefined) update.onboarded_at = p.onboardedAt;

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(update)
    .eq('user_id', req.userId!)
    .select('*')
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: 'db_error', detail: error.message });
    return;
  }
  if (!data) {
    res.status(404).json({ error: 'profile_missing' });
    return;
  }
  res.json(rowToApi(data as ProfileRow));
});
