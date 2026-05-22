import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { extractJd, JdExtractError } from '../lib/jdExtract.js';
import { generateEmail } from '../llm/generateEmail.js';
import { ProfileSchema, type Profile } from '@reach/shared';
import { MODEL } from '../llm/anthropic.js';

export const generateRouter = Router();
generateRouter.use(requireAuth);

const Body = z
  .object({
    jobUrl: z.string().url().optional(),
    jobTextOverride: z.string().min(20).optional(),
    jobTitle: z.string().optional(),
    jobCompany: z.string().optional(),
    recipientRole: z.string().min(1).max(200),
    recipientContext: z.string().max(2000).optional(),
    ask: z.string().min(1).max(500),
  })
  .refine((b) => b.jobUrl || b.jobTextOverride, {
    message: 'jobUrl_or_jobTextOverride_required',
  });

type ProfileRow = Record<string, unknown>;

function rowToProfile(r: ProfileRow): Profile {
  return ProfileSchema.parse({
    userId: r.user_id,
    name: r.name ?? '',
    headline: r.headline ?? '',
    email: r.email ?? '',
    phone: r.phone ?? '',
    location: r.location ?? '',
    resumeText: r.resume_text ?? '',
    resumeJson: r.resume_json ?? null,
    skills: r.skills ?? [],
    achievements: r.achievements ?? [],
    links: r.links ?? { linkedin: '', github: '', site: '', twitter: '', custom: [] },
    onboardedAt: r.onboarded_at ?? null,
    updatedAt: r.updated_at ?? new Date().toISOString(),
  });
}

generateRouter.post('/', async (req, res) => {
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_body', issues: parsed.error.issues });
    return;
  }
  const b = parsed.data;

  // Load profile.
  const { data: profileRow, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('user_id', req.userId!)
    .maybeSingle();
  if (profileError) {
    res.status(500).json({ error: 'db_error', detail: profileError.message });
    return;
  }
  if (!profileRow) {
    res.status(404).json({ error: 'profile_missing' });
    return;
  }
  const profile = rowToProfile(profileRow as ProfileRow);

  // Resolve JD.
  let jobText = b.jobTextOverride ?? '';
  let jobTitle = b.jobTitle;
  let jobCompany = b.jobCompany;
  if (!jobText && b.jobUrl) {
    try {
      const ext = await extractJd(b.jobUrl);
      jobText = ext.content;
      jobTitle = jobTitle ?? ext.title;
      jobCompany = jobCompany ?? ext.company;
    } catch (e) {
      const code = e instanceof JdExtractError ? e.code : 'jd_unknown';
      res.status(422).json({ error: code, needs_manual: true });
      return;
    }
  }
  if (!jobText) {
    res.status(400).json({ error: 'no_job_content' });
    return;
  }

  // Generate.
  let draft;
  try {
    draft = await generateEmail({
      profile,
      job: { url: b.jobUrl, title: jobTitle, company: jobCompany, content: jobText },
      recipient: { role: b.recipientRole, context: b.recipientContext },
      ask: b.ask,
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : 'generation_failed';
    res.status(502).json({ error: 'generation_failed', detail });
    return;
  }

  // Persist (best effort — do not block return on a write failure).
  const { error: insertError } = await supabaseAdmin.from('generations').insert({
    user_id: req.userId!,
    job_url: b.jobUrl ?? null,
    job_text: jobText,
    recipient_role: b.recipientRole,
    recipient_context: b.recipientContext ?? null,
    ask: b.ask,
    subject: draft.subject,
    body: draft.body,
    model: MODEL,
  });
  if (insertError) {
    console.warn('[generate] insert failed:', insertError.message);
  }

  res.json({ subject: draft.subject, body: draft.body });
});
