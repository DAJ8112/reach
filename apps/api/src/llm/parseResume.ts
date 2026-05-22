import { z } from 'zod';
import { anthropic, MODEL } from './anthropic.js';
import { ResumeJsonSchema } from '@reach/shared';

const ParsedSchema = z.object({
  name: z.string().default(''),
  headline: z.string().default(''),
  email: z.string().default(''),
  phone: z.string().default(''),
  location: z.string().default(''),
  skills: z.array(z.string()).default([]),
  resumeJson: ResumeJsonSchema,
});
export type ParsedResume = z.infer<typeof ParsedSchema>;

const TOOL_NAME = 'record_resume';

// JSON Schema describing the parser output.
const TOOL_INPUT_SCHEMA = {
  type: 'object' as const,
  properties: {
    name: { type: 'string', description: "Candidate's full name." },
    headline: {
      type: 'string',
      description: "One-line professional headline (e.g. 'Senior Product Engineer · Full-stack').",
    },
    email: { type: 'string' },
    phone: { type: 'string' },
    location: { type: 'string', description: 'City, region, country.' },
    skills: {
      type: 'array',
      items: { type: 'string' },
      description: 'Curated list of technical and professional skills.',
    },
    resumeJson: {
      type: 'object',
      properties: {
        experience: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              company: { type: 'string' },
              from: { type: 'string', description: "Start year or 'Mon YYYY'." },
              to: { type: 'string', description: "End year, 'Mon YYYY', or 'Present'." },
              bullets: {
                type: 'array',
                items: { type: 'string' },
                description: 'Achievement / responsibility bullets, one sentence each.',
              },
            },
            required: ['role', 'company', 'from', 'to', 'bullets'],
          },
        },
        education: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              school: { type: 'string' },
              degree: { type: 'string' },
              years: { type: 'string' },
            },
            required: ['school', 'degree', 'years'],
          },
        },
        projects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              desc: { type: 'string' },
            },
            required: ['name', 'desc'],
          },
        },
        certifications: { type: 'array', items: { type: 'string' } },
        languages: { type: 'array', items: { type: 'string' } },
      },
      required: ['experience', 'education', 'projects', 'certifications', 'languages'],
    },
  },
  required: ['name', 'headline', 'email', 'phone', 'location', 'skills', 'resumeJson'],
};

export async function parseResume(resumeText: string): Promise<ParsedResume> {
  const trimmed = resumeText.slice(0, 60_000);

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system:
      "You parse resumes into structured JSON. Extract only what's present in the resume — do not invent or embellish. " +
      'For dates, preserve the original formatting. ' +
      'For bullets, use the exact wording from the resume; do not paraphrase. ' +
      'If a field is missing, return an empty string or empty array. ' +
      'Always call the record_resume tool — never reply in plain text.',
    tools: [
      {
        name: TOOL_NAME,
        description: 'Record the structured resume data.',
        input_schema: TOOL_INPUT_SCHEMA,
      },
    ],
    tool_choice: { type: 'tool', name: TOOL_NAME },
    messages: [
      {
        role: 'user',
        content: `Parse this resume:\n\n<resume>\n${trimmed}\n</resume>`,
      },
    ],
  });

  const toolUse = msg.content.find((c) => c.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('parser_no_tool_use');
  }
  const parsed = ParsedSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error('parser_invalid_output: ' + parsed.error.message);
  }
  return parsed.data;
}
