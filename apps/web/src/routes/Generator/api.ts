import { api, ApiError } from '../../lib/api.js';
import type { EmailDraft, Generation } from '@reach/shared';

export type GenerateInput = {
  jobUrl?: string;
  jobTextOverride?: string;
  recipientRole: string;
  recipientContext?: string;
  ask: string;
};

export type GenerateResponse = EmailDraft & { generation: Generation | null };

export type GenerateError =
  | { kind: 'needs_manual'; code: string }
  | { kind: 'failed'; code: string };

export async function generateDraft(input: GenerateInput): Promise<GenerateResponse> {
  try {
    return await api<GenerateResponse>('/api/generate', { method: 'POST', body: input });
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) {
      const detail = e.detail as { needs_manual?: boolean; error?: string } | null;
      if (detail?.needs_manual) {
        const err: GenerateError = { kind: 'needs_manual', code: detail.error ?? 'needs_manual' };
        throw err;
      }
    }
    const code = e instanceof ApiError ? e.message : 'unknown';
    const err: GenerateError = { kind: 'failed', code };
    throw err;
  }
}

export function listGenerations(): Promise<Generation[]> {
  return api<Generation[]>('/api/generations');
}

export async function deleteGeneration(id: string): Promise<void> {
  await api<{ ok: true }>(`/api/generations/${id}`, { method: 'DELETE' });
}
