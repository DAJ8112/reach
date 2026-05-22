import { z } from 'zod';
import { anthropic, MODEL } from './anthropic.js';
import { SYSTEM_PROMPT, buildUserMessage, type GenerationInput } from './promptBuilder.js';

const TOOL_NAME = 'write_email';

const TOOL_INPUT_SCHEMA = {
  type: 'object' as const,
  properties: {
    subject: { type: 'string', description: 'One short subject line, no surrounding quotes.' },
    body: {
      type: 'string',
      description:
        'The email body as plain prose. Paragraphs separated by blank lines. End with a sign-off.',
    },
  },
  required: ['subject', 'body'],
};

const OutSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
});
export type EmailDraftOutput = z.infer<typeof OutSchema>;

export async function generateEmail(input: GenerationInput): Promise<EmailDraftOutput> {
  const userMessage = buildUserMessage(input);

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: TOOL_NAME,
        description: 'Submit the final cold email draft.',
        input_schema: TOOL_INPUT_SCHEMA,
      },
    ],
    tool_choice: { type: 'tool', name: TOOL_NAME },
    messages: [{ role: 'user', content: userMessage }],
  });

  const toolUse = msg.content.find((c) => c.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('generator_no_tool_use');
  }
  const parsed = OutSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error('generator_invalid_output: ' + parsed.error.message);
  }
  return parsed.data;
}
