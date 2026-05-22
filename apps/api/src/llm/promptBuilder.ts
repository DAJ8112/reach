import type { Profile } from '@reach/shared';
import { FEW_SHOTS } from './fewshots.js';

export const SYSTEM_PROMPT = `You write cold emails for job seekers reaching out about a specific role.

STYLE
- Target around 120 words. Natural and direct register, like a smart human writing quickly.
- Always produce a subject line.
- Pick ONE OR TWO of the most relevant items from the sender's profile to reference. Do not list everything.
- Specifics over adjectives. Numbers, project names, exact technologies.
- Vary structure across emails — do not produce a fixed template.

ANTI-PATTERNS (forbidden)
- Never open with "I hope this email finds you well" or any equivalent ("Hope you're doing well", "Trust this finds you", etc.).
- Never flatter the company or recipient ("amazing work", "huge fan", "love what you're doing").
- Never lead with the sender's credentials before establishing relevance to the role.
- Never list every qualification — pick what matters for THIS role.
- Avoid phrasing that pattern-matches to AI-generated cold outreach: "I came across", "I'd love to learn more about", "exciting opportunity", "passionate about", "reaching out to express interest", etc. If a phrase feels like it could appear in any cold email, cut it.
- No bullet lists. No headers in the body. Plain prose.

OUTPUT
- You must call the write_email tool. Do not respond in plain text.
- subject is one short line, no quotes around it.
- body is ready-to-send prose, paragraphs separated by blank lines. End with a sign-off and "[Your name]" if the sender's name is missing.

Below are examples of the kind of emails you should produce. Average over their structures — do not copy any one of them.

${FEW_SHOTS}`;

export type GenerationInput = {
  profile: Profile;
  job: { url?: string; title?: string; company?: string; content: string };
  recipient: { role: string; context?: string };
  ask: string;
};

function bullet(label: string, value: string | undefined | null) {
  if (!value) return '';
  return `- ${label}: ${value.trim()}\n`;
}

function profileBlock(p: Profile): string {
  const lines: string[] = [];
  lines.push('<sender_profile>');
  lines.push(bullet('Name', p.name).trimEnd());
  if (p.headline) lines.push(`- Headline: ${p.headline}`);
  if (p.location) lines.push(`- Location: ${p.location}`);
  if (p.skills.length) lines.push(`- Curated skills: ${p.skills.join(', ')}`);

  if (p.resumeJson?.experience.length) {
    lines.push('- Experience:');
    for (const e of p.resumeJson.experience.slice(0, 6)) {
      lines.push(`  • ${e.role} @ ${e.company} (${e.from}–${e.to})`);
      for (const b of e.bullets.slice(0, 4)) {
        lines.push(`    – ${b}`);
      }
    }
  }
  if (p.resumeJson?.projects.length) {
    lines.push('- Projects:');
    for (const pr of p.resumeJson.projects.slice(0, 5)) {
      lines.push(`  • ${pr.name}: ${pr.desc}`);
    }
  }
  if (p.resumeJson?.education.length) {
    lines.push('- Education:');
    for (const e of p.resumeJson.education.slice(0, 3)) {
      lines.push(`  • ${e.degree}, ${e.school} (${e.years})`);
    }
  }
  if (p.achievements.length) {
    lines.push('- Highlight achievements (sender-curated):');
    for (const a of p.achievements) {
      if (!a.title.trim()) continue;
      lines.push(`  • ${a.title}${a.detail ? ` — ${a.detail}` : ''}`);
    }
  }

  // Links — keep compact.
  const linkParts: string[] = [];
  if (p.links.linkedin) linkParts.push(`LinkedIn: ${p.links.linkedin}`);
  if (p.links.github) linkParts.push(`GitHub: ${p.links.github}`);
  if (p.links.site) linkParts.push(`Site: ${p.links.site}`);
  if (p.links.twitter) linkParts.push(`Twitter: ${p.links.twitter}`);
  for (const c of p.links.custom) {
    if (c.url) linkParts.push(`${c.label || 'Link'}: ${c.url}`);
  }
  if (linkParts.length) lines.push(`- Links: ${linkParts.join(' · ')}`);

  lines.push('</sender_profile>');
  return lines.join('\n');
}

export function buildUserMessage(input: GenerationInput): string {
  const { profile, job, recipient, ask } = input;
  const jobMeta: string[] = [];
  if (job.title) jobMeta.push(`Title: ${job.title}`);
  if (job.company) jobMeta.push(`Company: ${job.company}`);
  if (job.url) jobMeta.push(`URL: ${job.url}`);

  return [
    profileBlock(profile),
    '',
    '<job_description>',
    jobMeta.join('\n'),
    jobMeta.length ? '' : '',
    job.content,
    '</job_description>',
    '',
    '<recipient>',
    `Role: ${recipient.role}`,
    recipient.context ? `Context: ${recipient.context}` : '',
    '</recipient>',
    '',
    `<ask>${ask}</ask>`,
    '',
    "Now write the cold email. Pick the 1–2 most relevant items from <sender_profile> for THIS role and ground the email in them. Call the write_email tool.",
  ]
    .filter(Boolean)
    .join('\n');
}
