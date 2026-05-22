import Anthropic from '@anthropic-ai/sdk';
import { env } from '../lib/env.js';

if (!env.ANTHROPIC_API_KEY) {
  console.warn('[reach-api] ANTHROPIC_API_KEY missing — LLM calls will fail');
}

export const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY ?? 'missing',
});

export const MODEL = env.ANTHROPIC_MODEL;
