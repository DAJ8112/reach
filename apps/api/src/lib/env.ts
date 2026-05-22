import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.coerce.number().default(8787),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-6'),
});

export const env = EnvSchema.parse(process.env);
