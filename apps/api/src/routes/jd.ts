import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { extractJd, JdExtractError } from '../lib/jdExtract.js';

export const jdRouter = Router();
jdRouter.use(requireAuth);

const ExtractBody = z.object({ url: z.string().url() });

jdRouter.post('/extract', async (req, res) => {
  const parsed = ExtractBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_body', issues: parsed.error.issues });
    return;
  }
  try {
    const out = await extractJd(parsed.data.url);
    res.json(out);
  } catch (e) {
    if (e instanceof JdExtractError) {
      res.status(422).json({ error: e.code, needs_manual: true, httpStatus: e.httpStatus });
      return;
    }
    res.status(500).json({ error: 'unknown' });
  }
});
