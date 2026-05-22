import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { env } from './lib/env.js';
import { profileRouter } from './routes/profile.js';
import { jdRouter } from './routes/jd.js';
import { generateRouter } from './routes/generate.js';

const app = express();
app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'reach-api', ts: new Date().toISOString() });
});

app.use('/api/profile', profileRouter);
app.use('/api/jd', jdRouter);
app.use('/api/generate', generateRouter);

app.listen(env.PORT, () => {
  console.log(`[reach-api] listening on http://localhost:${env.PORT}`);
});
