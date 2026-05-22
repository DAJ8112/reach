export type StepKey = 'url' | 'role' | 'context' | 'ask';

export type StepDef = {
  key: StepKey;
  label: string;
  title: string;
  placeholder: string;
  helper: string;
  multiline: boolean;
  short: (v: string) => string;
};

export const STEPS: StepDef[] = [
  {
    key: 'url',
    label: '01',
    title: 'Job URL',
    placeholder: 'https://company.com/jobs/senior-engineer',
    helper: "Paste the job posting you're applying to.",
    multiline: false,
    short: (v) => {
      try {
        const u = new URL(v);
        return u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/$/, '');
      } catch {
        return v;
      }
    },
  },
  {
    key: 'role',
    label: '02',
    title: 'Recipient role',
    placeholder: 'e.g. Engineering Manager, Recruiter, Founder',
    helper: 'Who are you reaching out to?',
    multiline: false,
    short: (v) => v,
  },
  {
    key: 'context',
    label: '03',
    title: 'Context',
    placeholder:
      'Anything you know about the company or this person — recent launches, mutual connections, posts they wrote…',
    helper: 'Optional but recommended. The more you know, the better the email.',
    multiline: true,
    short: (v) => (v.length > 60 ? v.slice(0, 60) + '…' : v),
  },
  {
    key: 'ask',
    label: '04',
    title: 'Your ask',
    placeholder: 'A 15-min chat about the role? A referral? Feedback on your portfolio?',
    helper: 'What outcome do you want from this email?',
    multiline: true,
    short: (v) => (v.length > 60 ? v.slice(0, 60) + '…' : v),
  },
];
