import { z } from 'zod';

export const GenerateRequestSchema = z.object({
  jobUrl: z.string().url().optional(),
  jobTextOverride: z.string().optional(),
  recipientRole: z.string().min(1),
  recipientContext: z.string().optional(),
  ask: z.string().min(1),
});
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

export const EmailDraftSchema = z.object({
  subject: z.string(),
  body: z.string(),
});
export type EmailDraft = z.infer<typeof EmailDraftSchema>;

export const JdExtractResponseSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  content: z.string(),
});
export type JdExtractResponse = z.infer<typeof JdExtractResponseSchema>;
