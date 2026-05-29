import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';
import type { Generation } from '@reach/shared';

export const generationsRouter = Router();
generationsRouter.use(requireAuth);

export type GenerationRow = {
  id: string;
  job_url: string | null;
  job_text: string;
  recipient_role: string;
  recipient_context: string | null;
  ask: string;
  subject: string;
  body: string;
  model: string | null;
  created_at: string;
};

export function rowToGeneration(r: GenerationRow): Generation {
  return {
    id: r.id,
    jobUrl: r.job_url,
    jobText: r.job_text,
    recipientRole: r.recipient_role,
    recipientContext: r.recipient_context,
    ask: r.ask,
    subject: r.subject,
    body: r.body,
    model: r.model,
    createdAt: r.created_at,
  };
}

generationsRouter.get('/', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('generations')
    .select('*')
    .eq('user_id', req.userId!)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) {
    res.status(500).json({ error: 'db_error', detail: error.message });
    return;
  }
  res.json((data as GenerationRow[]).map(rowToGeneration));
});

generationsRouter.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin
    .from('generations')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.userId!);
  if (error) {
    res.status(500).json({ error: 'db_error', detail: error.message });
    return;
  }
  res.json({ ok: true });
});
