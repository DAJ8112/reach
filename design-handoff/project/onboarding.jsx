// Onboarding — Reach
// Stepper-based flow with optional single-page Tweak

const { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "structure": "stepper"
}/*EDITMODE-END*/;

// ---------- Brand mark (reused, smaller) ----------
function Mark({ size = 24 }) {
  const grid = [
    "11111100","11000110","11000110","11111100",
    "11011000","11001100","11000110","11000011",
  ];
  const px = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block", flex: "none" }} aria-hidden="true">
      {grid.flatMap((row, y) =>
        row.split("").map((c, x) =>
          c === "1" ? (
            <rect key={`${x}-${y}`} x={x*px} y={y*px} width={px} height={px}
              fill="currentColor" opacity={0.85 + ((x+y)%3)*0.05} />
          ) : null
        )
      )}
    </svg>
  );
}

function Wordmark({ size = "sm" }) {
  const fs = size === "lg" ? 32 : size === "md" ? 22 : 18;
  const ms = size === "lg" ? 32 : size === "md" ? 22 : 18;
  return (
    <div className="wordmark">
      <div className="wordmark-glyph" style={{ color: "var(--accent)" }}>
        <Mark size={ms} />
      </div>
      <span className="wordmark-text" style={{ fontSize: fs, lineHeight: 1, letterSpacing: "-0.02em" }}>reach</span>
    </div>
  );
}

// ---------- Mock parsed resume data ----------
const MOCK_RESUME = {
  name: "Aarav Mehta",
  email: "aarav.mehta@gmail.com",
  phone: "+1 (415) 555-0142",
  location: "San Francisco, CA",
  headline: "Senior Product Engineer · Full-stack",
  experience: [
    {
      role: "Senior Product Engineer",
      company: "Linear",
      from: "2023",
      to: "Present",
      bullets: [
        "Led the rebuild of the keyboard-driven command palette, cutting median action latency by 40%.",
        "Shipped real-time collaborative cursors using CRDTs across web + desktop.",
      ],
    },
    {
      role: "Product Engineer",
      company: "Notion",
      from: "2020",
      to: "2023",
      bullets: [
        "Owned the table block end-to-end — from rendering to schema migrations affecting 12M users.",
        "Drove a 3× improvement in mobile editor performance through virtualization.",
      ],
    },
  ],
  education: [
    { school: "Carnegie Mellon University", degree: "B.S. Computer Science", years: "2016 — 2020" },
  ],
  projects: [
    { name: "tinyGPT", desc: "A 90-line toy transformer in pure NumPy. 4.2k GitHub stars." },
    { name: "shipd.dev", desc: "A weekly newsletter on shipping fast — 8k subscribers." },
  ],
  skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "Rust", "WebGL", "Figma", "Tailwind", "Python", "Go", "Redis", "Docker"],
  certifications: ["AWS Certified Solutions Architect — Associate (2022)"],
  languages: ["English (Native)", "Hindi (Fluent)", "Spanish (Conversational)"],
};

const SUGGESTED_SKILLS = ["Postgres", "GraphQL", "Next.js", "Vite", "Linear", "Notion", "DDD", "tRPC", "Vercel"];

// ---------- Generic UI primitives ----------
function PrimaryBtn({ children, onClick, disabled, tone = "primary", className = "" }) {
  return (
    <button
      type="button"
      className={`btn btn-${tone} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children, optional }) {
  return (
    <label className="ob-label">
      {children}
      {optional && <span className="ob-optional">optional</span>}
    </label>
  );
}

function TextField({ label, value, onChange, placeholder, optional, type = "text" }) {
  return (
    <div className="ob-field">
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <input
        className="ob-input"
        type={type}
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, optional, rows = 3 }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = el.scrollHeight + "px";
  }, [value]);
  return (
    <div className="ob-field">
      {label && <FieldLabel optional={optional}>{label}</FieldLabel>}
      <textarea
        ref={ref}
        className="ob-input ob-textarea"
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        spellCheck={false}
      />
    </div>
  );
}

// ---------- STEP 1: Upload ----------
function StepUpload({ onParsed }) {
  const [state, setState] = useState("idle"); // idle | parsing | done
  const [filename, setFilename] = useState("");
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const startParsing = (name) => {
    setFilename(name);
    setState("parsing");
    setProgress(0);
    let p = 0;
    const tick = () => {
      p += 6 + Math.random() * 14;
      if (p >= 100) {
        setProgress(100);
        setTimeout(() => {
          setState("done");
          onParsed(MOCK_RESUME);
        }, 380);
      } else {
        setProgress(p);
        setTimeout(tick, 140 + Math.random() * 160);
      }
    };
    tick();
  };

  const onFile = (file) => {
    if (!file) return;
    startParsing(file.name);
  };

  return (
    <div className="step-content">
      <div className="step-header">
        <div className="step-eyebrow">STEP 01</div>
        <h1 className="step-title">Upload your resume</h1>
        <p className="step-sub">We'll parse it once so every email you write is grounded in your real experience.</p>
      </div>

      {state !== "parsing" && (
        <div
          className={`dropzone ${dragOver ? "is-over" : ""} ${state === "done" ? "is-done" : ""}`}
          onClick={() => state === "idle" && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false);
            onFile(e.dataTransfer.files?.[0]);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.doc"
            style={{ display: "none" }}
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <div className="dropzone-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect x="9" y="6" width="22" height="28" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M14 14h12M14 19h12M14 24h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="dropzone-title">
            {state === "done" ? "Parsed ✓" : "Drag & drop your resume"}
          </div>
          <div className="dropzone-sub">
            {state === "done" ? filename : <>or <span className="link">click to browse</span> · PDF, DOCX up to 10MB</>}
          </div>
        </div>
      )}

      {state === "parsing" && (
        <div className="parsing-card">
          <div className="parsing-row">
            <div className="parsing-name">{filename}</div>
            <div className="parsing-pct">{Math.floor(progress)}%</div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: progress + "%" }} />
          </div>
          <div className="parsing-status">
            {progress < 30 ? "Reading file…" :
             progress < 60 ? "Extracting structure…" :
             progress < 90 ? "Identifying skills & experience…" :
             "Almost done…"}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- STEP 2: Review parsed resume ----------
function Section({ title, count, children, defaultOpen = true, action }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`ob-section ${open ? "is-open" : ""}`}>
      <button type="button" className="ob-section-head" onClick={() => setOpen(!open)}>
        <span className="ob-section-chevron">{open ? "▾" : "▸"}</span>
        <span className="ob-section-title">{title}</span>
        {typeof count === "number" && <span className="ob-section-count">{count}</span>}
        <span className="ob-section-spacer" />
        {action}
      </button>
      {open && <div className="ob-section-body">{children}</div>}
    </div>
  );
}

function StepReview({ data, onChange }) {
  const update = (patch) => onChange({ ...data, ...patch });
  const updateExp = (i, patch) => {
    const next = data.experience.map((e, idx) => idx === i ? { ...e, ...patch } : e);
    update({ experience: next });
  };
  const removeExp = (i) => update({ experience: data.experience.filter((_, idx) => idx !== i) });
  const addExp = () => update({ experience: [...data.experience, { role: "", company: "", from: "", to: "", bullets: [""] }] });

  const updateEdu = (i, patch) => update({ education: data.education.map((e, idx) => idx === i ? { ...e, ...patch } : e) });
  const removeEdu = (i) => update({ education: data.education.filter((_, idx) => idx !== i) });
  const addEdu = () => update({ education: [...data.education, { school: "", degree: "", years: "" }] });

  const updateProj = (i, patch) => update({ projects: data.projects.map((e, idx) => idx === i ? { ...e, ...patch } : e) });
  const removeProj = (i) => update({ projects: data.projects.filter((_, idx) => idx !== i) });
  const addProj = () => update({ projects: [...data.projects, { name: "", desc: "" }] });

  const toggleSkill = (s) => {
    const set = new Set(data.skills);
    if (set.has(s)) set.delete(s); else set.add(s);
    update({ skills: Array.from(set) });
  };
  const addSkill = (val) => {
    const v = val.trim();
    if (!v || data.skills.includes(v)) return;
    update({ skills: [...data.skills, v] });
  };

  const [skillDraft, setSkillDraft] = useState("");

  return (
    <div className="step-content step-content-wide">
      <div className="step-header">
        <div className="step-eyebrow">STEP 02</div>
        <h1 className="step-title">Review what we extracted</h1>
        <p className="step-sub">Fix anything that looks off. This becomes the source of truth for every email.</p>
      </div>

      <Section title="Basics" defaultOpen>
        <div className="ob-grid-2">
          <TextField label="Name" value={data.name} onChange={(v) => update({ name: v })} />
          <TextField label="Headline" value={data.headline} onChange={(v) => update({ headline: v })} placeholder="Senior Engineer · Full-stack" />
          <TextField label="Email" value={data.email} onChange={(v) => update({ email: v })} type="email" />
          <TextField label="Phone" value={data.phone} onChange={(v) => update({ phone: v })} />
          <TextField label="Location" value={data.location} onChange={(v) => update({ location: v })} />
        </div>
      </Section>

      <Section title="Experience" count={data.experience.length}
        action={<span className="ob-add-link" onClick={(e) => { e.stopPropagation(); addExp(); }}>+ Add</span>}>
        <div className="ob-list">
          {data.experience.map((e, i) => (
            <div key={i} className="ob-card">
              <div className="ob-card-head">
                <div className="ob-grid-2">
                  <TextField label="Role" value={e.role} onChange={(v) => updateExp(i, { role: v })} />
                  <TextField label="Company" value={e.company} onChange={(v) => updateExp(i, { company: v })} />
                  <TextField label="From" value={e.from} onChange={(v) => updateExp(i, { from: v })} placeholder="2022" />
                  <TextField label="To" value={e.to} onChange={(v) => updateExp(i, { to: v })} placeholder="Present" />
                </div>
                <button className="ob-card-remove" onClick={() => removeExp(i)} aria-label="Remove">×</button>
              </div>
              <div className="ob-bullets">
                {e.bullets.map((b, bi) => (
                  <div key={bi} className="ob-bullet">
                    <span className="ob-bullet-dot">—</span>
                    <TextArea
                      value={b}
                      onChange={(v) => {
                        const nb = e.bullets.map((x, xi) => xi === bi ? v : x);
                        updateExp(i, { bullets: nb });
                      }}
                      rows={1}
                      placeholder="What did you do here?"
                    />
                  </div>
                ))}
                <span className="ob-add-link inline"
                  onClick={() => updateExp(i, { bullets: [...e.bullets, ""] })}>+ Add bullet</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Education" count={data.education.length}
        action={<span className="ob-add-link" onClick={(e) => { e.stopPropagation(); addEdu(); }}>+ Add</span>}>
        <div className="ob-list">
          {data.education.map((e, i) => (
            <div key={i} className="ob-card">
              <div className="ob-card-head">
                <div className="ob-grid-2">
                  <TextField label="School" value={e.school} onChange={(v) => updateEdu(i, { school: v })} />
                  <TextField label="Degree" value={e.degree} onChange={(v) => updateEdu(i, { degree: v })} />
                  <TextField label="Years" value={e.years} onChange={(v) => updateEdu(i, { years: v })} placeholder="2016 — 2020" />
                </div>
                <button className="ob-card-remove" onClick={() => removeEdu(i)}>×</button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Projects" count={data.projects.length} defaultOpen={false}
        action={<span className="ob-add-link" onClick={(e) => { e.stopPropagation(); addProj(); }}>+ Add</span>}>
        <div className="ob-list">
          {data.projects.map((p, i) => (
            <div key={i} className="ob-card">
              <div className="ob-card-head">
                <div className="ob-grid-1">
                  <TextField label="Name" value={p.name} onChange={(v) => updateProj(i, { name: v })} />
                  <TextArea label="Description" value={p.desc} onChange={(v) => updateProj(i, { desc: v })} rows={2} />
                </div>
                <button className="ob-card-remove" onClick={() => removeProj(i)}>×</button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Skills" count={data.skills.length}>
        <div className="ob-tags">
          {data.skills.map((s) => (
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
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addSkill(skillDraft);
                setSkillDraft("");
              }
            }}
          />
        </div>
        <div className="ob-suggestions">
          <span className="ob-suggestions-label">Suggested:</span>
          {SUGGESTED_SKILLS.filter((s) => !data.skills.includes(s)).map((s) => (
            <button key={s} type="button" className="tag is-suggest" onClick={() => addSkill(s)}>+ {s}</button>
          ))}
        </div>
      </Section>

      <Section title="Certifications" count={data.certifications.length} defaultOpen={false}
        action={<span className="ob-add-link" onClick={(e) => { e.stopPropagation(); update({ certifications: [...data.certifications, ""] }); }}>+ Add</span>}>
        <div className="ob-list">
          {data.certifications.map((c, i) => (
            <div key={i} className="ob-row-input">
              <input className="ob-input" value={c}
                onChange={(e) => update({ certifications: data.certifications.map((x, xi) => xi === i ? e.target.value : x) })} />
              <button className="ob-card-remove" onClick={() => update({ certifications: data.certifications.filter((_, xi) => xi !== i) })}>×</button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Languages" count={data.languages.length} defaultOpen={false}
        action={<span className="ob-add-link" onClick={(e) => { e.stopPropagation(); update({ languages: [...data.languages, ""] }); }}>+ Add</span>}>
        <div className="ob-list">
          {data.languages.map((c, i) => (
            <div key={i} className="ob-row-input">
              <input className="ob-input" value={c}
                onChange={(e) => update({ languages: data.languages.map((x, xi) => xi === i ? e.target.value : x) })} />
              <button className="ob-card-remove" onClick={() => update({ languages: data.languages.filter((_, xi) => xi !== i) })}>×</button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ---------- STEP 3: Achievements ----------
function StepAchievements({ achievements, onChange }) {
  const update = (i, patch) => onChange(achievements.map((a, idx) => idx === i ? { ...a, ...patch } : a));
  const remove = (i) => onChange(achievements.filter((_, idx) => idx !== i));
  const add = () => achievements.length < 5 && onChange([...achievements, { title: "", detail: "" }]);

  return (
    <div className="step-content">
      <div className="step-header">
        <div className="step-eyebrow">STEP 03</div>
        <h1 className="step-title">Highlight 3–5 achievements</h1>
        <p className="step-sub">The proudest things you've shipped or done. We'll lean on these when an email needs proof of impact.</p>
      </div>

      <div className="ach-list">
        {achievements.map((a, i) => (
          <div key={i} className="ach-card">
            <div className="ach-num">{String(i + 1).padStart(2, "0")}</div>
            <div className="ach-fields">
              <input
                className="ach-title-input"
                value={a.title}
                onChange={(e) => update(i, { title: e.target.value })}
                placeholder="One-line headline of the win"
              />
              <TextArea
                value={a.detail}
                onChange={(v) => update(i, { detail: v })}
                placeholder="Optional context — numbers, scope, what made it hard, what you learned…"
                rows={2}
              />
            </div>
            <button className="ach-remove" onClick={() => remove(i)} aria-label="Remove">×</button>
          </div>
        ))}
      </div>

      {achievements.length < 5 && (
        <button type="button" className="ob-add-card" onClick={add}>
          <span>+</span> Add another achievement
          <span className="ob-add-card-meta">{achievements.length}/5</span>
        </button>
      )}
    </div>
  );
}

// ---------- STEP 4: Links ----------
const LINK_PRESETS = [
  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/yourname", icon: "in" },
  { key: "github",   label: "GitHub",   placeholder: "github.com/yourname",     icon: "</>"},
  { key: "site",     label: "Portfolio",placeholder: "yourname.com",             icon: "↗" },
  { key: "twitter",  label: "Twitter / X", placeholder: "x.com/yourname",        icon: "𝕏" },
];

function StepLinks({ links, onChange }) {
  const update = (key, value) => onChange({ ...links, [key]: value });
  const updateCustom = (i, patch) => {
    const next = (links.custom || []).map((c, idx) => idx === i ? { ...c, ...patch } : c);
    onChange({ ...links, custom: next });
  };
  const removeCustom = (i) => onChange({ ...links, custom: (links.custom || []).filter((_, idx) => idx !== i) });
  const addCustom = () => onChange({ ...links, custom: [...(links.custom || []), { label: "", url: "" }] });

  return (
    <div className="step-content">
      <div className="step-header">
        <div className="step-eyebrow">STEP 04</div>
        <h1 className="step-title">Add your links</h1>
        <p className="step-sub">Anywhere a recipient might want to learn more about you. We'll include the relevant ones in your emails.</p>
      </div>

      <div className="links-list">
        {LINK_PRESETS.map((p) => (
          <div key={p.key} className="link-row">
            <div className="link-icon">{p.icon}</div>
            <div className="link-meta">
              <div className="link-label">{p.label}</div>
              <input
                className="link-input"
                value={links[p.key] || ""}
                onChange={(e) => update(p.key, e.target.value)}
                placeholder={p.placeholder}
                spellCheck={false}
              />
            </div>
          </div>
        ))}

        {(links.custom || []).map((c, i) => (
          <div key={i} className="link-row link-custom">
            <div className="link-icon link-icon-custom">+</div>
            <div className="link-meta link-meta-custom">
              <input
                className="link-custom-label"
                value={c.label}
                onChange={(e) => updateCustom(i, { label: e.target.value })}
                placeholder="Label (e.g. Substack)"
              />
              <input
                className="link-input"
                value={c.url}
                onChange={(e) => updateCustom(i, { url: e.target.value })}
                placeholder="https://…"
              />
            </div>
            <button className="ob-card-remove" onClick={() => removeCustom(i)}>×</button>
          </div>
        ))}
      </div>

      <button type="button" className="ob-add-card" onClick={addCustom}>
        <span>+</span> Add a custom link
      </button>
    </div>
  );
}

// ---------- STEP 5: Welcome ----------
function StepWelcome({ data, onStart }) {
  return (
    <div className="step-content welcome-stage">
      <div className="welcome-mark">
        <Mark size={64} />
      </div>
      <div className="welcome-eyebrow">YOU'RE SET</div>
      <h1 className="welcome-title">
        Welcome, {(data.name || "friend").split(" ")[0]}.
      </h1>
      <p className="welcome-sub">
        Reach now knows your background. Every email you draft will sound like you — grounded in real experience, not generic filler.
      </p>

      <div className="welcome-summary-spacer" />

      <PrimaryBtn tone="primary" onClick={onStart} className="welcome-cta">
        Write your first email →
      </PrimaryBtn>
      <div className="welcome-hint">⌘K to open Reach from anywhere</div>
    </div>
  );
}

// ---------- Stepper shell ----------
const STEP_LABELS = ["Resume", "Review", "Achievements", "Links", "Done"];

function App() {
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const { theme, structure } = tweaks;

  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  const [step, setStep] = useState(0); // 0..4
  const [resumeReady, setResumeReady] = useState(false);
  const [data, setData] = useState({
    ...MOCK_RESUME,
    achievements: [
      { title: "", detail: "" },
      { title: "", detail: "" },
      { title: "", detail: "" },
    ],
    links: { linkedin: "", github: "", site: "", twitter: "", custom: [] },
  });

  // For the single-page variant, render all in sequence
  const single = structure === "single";

  const next = () => setStep(Math.min(step + 1, 4));
  const back = () => setStep(Math.max(step - 1, 0));

  // Reset
  const reset = () => {
    setStep(0);
    setResumeReady(false);
    setData({
      ...MOCK_RESUME,
      achievements: [
        { title: "", detail: "" },
        { title: "", detail: "" },
        { title: "", detail: "" },
      ],
      links: { linkedin: "", github: "", site: "", twitter: "", custom: [] },
    });
  };

  // After step-1 parse completes, auto-advance after a beat
  const onParsed = (resume) => {
    setData((d) => ({ ...d, ...resume }));
    setResumeReady(true);
    setTimeout(() => setStep(1), 900);
  };

  const renderStep = (i) => {
    if (i === 0) return <StepUpload key="0" onParsed={onParsed} />;
    if (i === 1) return <StepReview key="1" data={data} onChange={(d) => setData((prev) => ({ ...prev, ...d }))} />;
    if (i === 2) return <StepAchievements key="2" achievements={data.achievements} onChange={(a) => setData({ ...data, achievements: a })} />;
    if (i === 3) return <StepLinks key="3" links={data.links} onChange={(l) => setData({ ...data, links: l })} />;
    if (i === 4) return <StepWelcome key="4" data={data} onStart={reset} />;
  };

  // ---- STEPPER VIEW ----
  if (!single) {
    return (
      <div className="ob-app" data-theme={theme}>
        <header className="ob-topbar">
          <Wordmark size="sm" />
          {step > 0 && step < 4 && (
            <div className="ob-progress" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={5}>
              {STEP_LABELS.slice(0, 4).map((label, i) => (
                <div key={label}
                  className={`ob-progress-seg ${i < step ? "done" : ""} ${i === step ? "current" : ""}`}>
                  <span className="ob-progress-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="ob-progress-label">{label}</span>
                </div>
              ))}
            </div>
          )}
          <div className="ob-topbar-right">
            {step > 0 && step < 4 && (
              <span className="ob-step-count">Step {step + 1} of 4</span>
            )}
          </div>
        </header>

        <main className="ob-main">
          <div className="ob-stage" key={step}>
            {renderStep(step)}
          </div>
        </main>

        {step > 0 && step < 4 && (
          <footer className="ob-footer">
            <button className="btn btn-ghost" onClick={back}>← Back</button>
            <div className="ob-footer-right">
              <button className="btn btn-text" onClick={next}>Skip</button>
              <PrimaryBtn onClick={next}>
                {step === 3 ? "Finish" : "Continue"} →
              </PrimaryBtn>
            </div>
          </footer>
        )}

        {step === 0 && resumeReady && (
          <footer className="ob-footer">
            <span />
            <PrimaryBtn onClick={next}>Continue →</PrimaryBtn>
          </footer>
        )}

        {/* Tweaks */}
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection title="Theme">
            <window.TweakRadio
              label="Mode" value={theme} onChange={(v) => setTweak("theme", v)}
              options={[{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }]}
            />
          </window.TweakSection>
          <window.TweakSection title="Structure">
            <window.TweakRadio
              label="Layout" value={structure} onChange={(v) => setTweak("structure", v)}
              options={[
                { value: "stepper", label: "Stepper" },
                { value: "single", label: "Single-page" },
              ]}
            />
          </window.TweakSection>
          <window.TweakSection title="Reset">
            <window.TweakButton label="Restart onboarding" onClick={reset} />
          </window.TweakSection>
        </window.TweaksPanel>
      </div>
    );
  }

  // ---- SINGLE-PAGE VIEW ----
  return (
    <div className="ob-app ob-single" data-theme={theme}>
      <header className="ob-topbar">
        <Wordmark size="sm" />
        <div className="ob-step-count">Onboarding</div>
      </header>

      <main className="ob-main">
        <div className="ob-stage ob-stage-single">
          <StepUpload onParsed={onParsed} />
          <div className="ob-divider" />
          <StepReview data={data} onChange={(d) => setData((p) => ({ ...p, ...d }))} />
          <div className="ob-divider" />
          <StepAchievements achievements={data.achievements} onChange={(a) => setData({ ...data, achievements: a })} />
          <div className="ob-divider" />
          <StepLinks links={data.links} onChange={(l) => setData({ ...data, links: l })} />
          <div className="ob-divider" />
          <div className="single-finish">
            <PrimaryBtn onClick={reset} className="welcome-cta">Finish & write your first email →</PrimaryBtn>
          </div>
        </div>
      </main>

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection title="Theme">
          <window.TweakRadio label="Mode" value={theme} onChange={(v) => setTweak("theme", v)}
            options={[{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }]} />
        </window.TweakSection>
        <window.TweakSection title="Structure">
          <window.TweakRadio label="Layout" value={structure} onChange={(v) => setTweak("structure", v)}
            options={[{ value: "stepper", label: "Stepper" }, { value: "single", label: "Single-page" }]} />
        </window.TweakSection>
      </window.TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
