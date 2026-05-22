import { useState, type ReactNode } from 'react';
import type { Profile } from '@reach/shared';
import { TextField, TextArea } from './primitives.js';

const SUGGESTED_SKILLS = [
  'Postgres',
  'GraphQL',
  'Next.js',
  'Vite',
  'Linear',
  'Notion',
  'DDD',
  'tRPC',
  'Vercel',
];

function Section({
  title,
  count,
  children,
  defaultOpen = true,
  action,
}: {
  title: string;
  count?: number;
  children: ReactNode;
  defaultOpen?: boolean;
  action?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`ob-section ${open ? 'is-open' : ''}`}>
      <button type="button" className="ob-section-head" onClick={() => setOpen(!open)}>
        <span className="ob-section-chevron">{open ? '▾' : '▸'}</span>
        <span className="ob-section-title">{title}</span>
        {typeof count === 'number' && <span className="ob-section-count">{count}</span>}
        <span className="ob-section-spacer" />
        {action}
      </button>
      {open && <div className="ob-section-body">{children}</div>}
    </div>
  );
}

type ReviewState = Pick<
  Profile,
  'name' | 'headline' | 'email' | 'phone' | 'location' | 'skills' | 'resumeJson'
>;

export function StepReview({
  data,
  onChange,
}: {
  data: ReviewState;
  onChange: (patch: Partial<ReviewState>) => void;
}) {
  const resume = data.resumeJson ?? {
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
  };
  const setResume = (patch: Partial<typeof resume>) =>
    onChange({ resumeJson: { ...resume, ...patch } });

  const updateExp = (i: number, patch: Partial<(typeof resume.experience)[number]>) => {
    const next = resume.experience.map((e, idx) => (idx === i ? { ...e, ...patch } : e));
    setResume({ experience: next });
  };
  const removeExp = (i: number) => setResume({ experience: resume.experience.filter((_, idx) => idx !== i) });
  const addExp = () =>
    setResume({
      experience: [...resume.experience, { role: '', company: '', from: '', to: '', bullets: [''] }],
    });

  const updateEdu = (i: number, patch: Partial<(typeof resume.education)[number]>) =>
    setResume({ education: resume.education.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) });
  const removeEdu = (i: number) =>
    setResume({ education: resume.education.filter((_, idx) => idx !== i) });
  const addEdu = () =>
    setResume({ education: [...resume.education, { school: '', degree: '', years: '' }] });

  const updateProj = (i: number, patch: Partial<(typeof resume.projects)[number]>) =>
    setResume({ projects: resume.projects.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) });
  const removeProj = (i: number) =>
    setResume({ projects: resume.projects.filter((_, idx) => idx !== i) });
  const addProj = () => setResume({ projects: [...resume.projects, { name: '', desc: '' }] });

  const skills = data.skills ?? [];
  const toggleSkill = (s: string) => {
    const set = new Set(skills);
    if (set.has(s)) set.delete(s);
    else set.add(s);
    onChange({ skills: Array.from(set) });
  };
  const addSkill = (val: string) => {
    const v = val.trim();
    if (!v || skills.includes(v)) return;
    onChange({ skills: [...skills, v] });
  };
  const [skillDraft, setSkillDraft] = useState('');

  return (
    <div className="step-content step-content-wide">
      <div className="step-header">
        <div className="step-eyebrow">STEP 02</div>
        <h1 className="step-title">Review what we extracted</h1>
        <p className="step-sub">
          Fix anything that looks off. This becomes the source of truth for every email.
        </p>
      </div>

      <Section title="Basics" defaultOpen>
        <div className="ob-grid-2">
          <TextField label="Name" value={data.name} onChange={(v) => onChange({ name: v })} />
          <TextField
            label="Headline"
            value={data.headline}
            onChange={(v) => onChange({ headline: v })}
            placeholder="Senior Engineer · Full-stack"
          />
          <TextField
            label="Email"
            value={data.email}
            onChange={(v) => onChange({ email: v })}
            type="email"
          />
          <TextField label="Phone" value={data.phone} onChange={(v) => onChange({ phone: v })} />
          <TextField label="Location" value={data.location} onChange={(v) => onChange({ location: v })} />
        </div>
      </Section>

      <Section
        title="Experience"
        count={resume.experience.length}
        action={
          <button
            type="button"
            className="ob-add-link"
            onClick={(e) => {
              e.stopPropagation();
              addExp();
            }}
          >
            + Add
          </button>
        }
      >
        <div className="ob-list">
          {resume.experience.map((e, i) => (
            <div key={i} className="ob-card">
              <div className="ob-card-head">
                <div className="ob-grid-2">
                  <TextField label="Role" value={e.role} onChange={(v) => updateExp(i, { role: v })} />
                  <TextField
                    label="Company"
                    value={e.company}
                    onChange={(v) => updateExp(i, { company: v })}
                  />
                  <TextField
                    label="From"
                    value={e.from}
                    onChange={(v) => updateExp(i, { from: v })}
                    placeholder="2022"
                  />
                  <TextField
                    label="To"
                    value={e.to}
                    onChange={(v) => updateExp(i, { to: v })}
                    placeholder="Present"
                  />
                </div>
                <button className="ob-card-remove" onClick={() => removeExp(i)} aria-label="Remove">
                  ×
                </button>
              </div>
              <div className="ob-bullets">
                {e.bullets.map((b, bi) => (
                  <div key={bi} className="ob-bullet">
                    <span className="ob-bullet-dot">—</span>
                    <TextArea
                      value={b}
                      onChange={(v) => {
                        const nb = e.bullets.map((x, xi) => (xi === bi ? v : x));
                        updateExp(i, { bullets: nb });
                      }}
                      rows={1}
                      placeholder="What did you do here?"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="ob-add-link inline"
                  onClick={() => updateExp(i, { bullets: [...e.bullets, ''] })}
                >
                  + Add bullet
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Education"
        count={resume.education.length}
        action={
          <button
            type="button"
            className="ob-add-link"
            onClick={(e) => {
              e.stopPropagation();
              addEdu();
            }}
          >
            + Add
          </button>
        }
      >
        <div className="ob-list">
          {resume.education.map((e, i) => (
            <div key={i} className="ob-card">
              <div className="ob-card-head">
                <div className="ob-grid-2">
                  <TextField label="School" value={e.school} onChange={(v) => updateEdu(i, { school: v })} />
                  <TextField label="Degree" value={e.degree} onChange={(v) => updateEdu(i, { degree: v })} />
                  <TextField
                    label="Years"
                    value={e.years}
                    onChange={(v) => updateEdu(i, { years: v })}
                    placeholder="2016 — 2020"
                  />
                </div>
                <button className="ob-card-remove" onClick={() => removeEdu(i)}>
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Projects"
        count={resume.projects.length}
        defaultOpen={false}
        action={
          <button
            type="button"
            className="ob-add-link"
            onClick={(e) => {
              e.stopPropagation();
              addProj();
            }}
          >
            + Add
          </button>
        }
      >
        <div className="ob-list">
          {resume.projects.map((p, i) => (
            <div key={i} className="ob-card">
              <div className="ob-card-head">
                <div className="ob-grid-1">
                  <TextField label="Name" value={p.name} onChange={(v) => updateProj(i, { name: v })} />
                  <TextArea
                    label="Description"
                    value={p.desc}
                    onChange={(v) => updateProj(i, { desc: v })}
                    rows={2}
                  />
                </div>
                <button className="ob-card-remove" onClick={() => removeProj(i)}>
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Skills" count={skills.length}>
        <div className="ob-tags">
          {skills.map((s) => (
            <button key={s} type="button" className="tag is-on" onClick={() => toggleSkill(s)}>
              {s} <span className="tag-x">×</span>
            </button>
          ))}
          <input
            className="tag-input"
            value={skillDraft}
            placeholder="Add a skill…"
            onChange={(e) => setSkillDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addSkill(skillDraft);
                setSkillDraft('');
              }
            }}
          />
        </div>
        <div className="ob-suggestions">
          <span className="ob-suggestions-label">Suggested:</span>
          {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).map((s) => (
            <button key={s} type="button" className="tag is-suggest" onClick={() => addSkill(s)}>
              + {s}
            </button>
          ))}
        </div>
      </Section>

      <Section
        title="Certifications"
        count={resume.certifications.length}
        defaultOpen={false}
        action={
          <button
            type="button"
            className="ob-add-link"
            onClick={(e) => {
              e.stopPropagation();
              setResume({ certifications: [...resume.certifications, ''] });
            }}
          >
            + Add
          </button>
        }
      >
        <div className="ob-list">
          {resume.certifications.map((c, i) => (
            <div key={i} className="ob-row-input">
              <input
                className="ob-input"
                value={c}
                onChange={(e) =>
                  setResume({
                    certifications: resume.certifications.map((x, xi) => (xi === i ? e.target.value : x)),
                  })
                }
              />
              <button
                className="ob-card-remove"
                onClick={() =>
                  setResume({ certifications: resume.certifications.filter((_, xi) => xi !== i) })
                }
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Languages"
        count={resume.languages.length}
        defaultOpen={false}
        action={
          <button
            type="button"
            className="ob-add-link"
            onClick={(e) => {
              e.stopPropagation();
              setResume({ languages: [...resume.languages, ''] });
            }}
          >
            + Add
          </button>
        }
      >
        <div className="ob-list">
          {resume.languages.map((c, i) => (
            <div key={i} className="ob-row-input">
              <input
                className="ob-input"
                value={c}
                onChange={(e) =>
                  setResume({
                    languages: resume.languages.map((x, xi) => (xi === i ? e.target.value : x)),
                  })
                }
              />
              <button
                className="ob-card-remove"
                onClick={() => setResume({ languages: resume.languages.filter((_, xi) => xi !== i) })}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
