// Reach — cold email generator
// Sequential input flow with springy stack-up animation.

const { useState, useEffect, useRef, useLayoutEffect, useCallback } = React;

// ---------- Tweak defaults (persisted via Tweaks host) ----------
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "stackedLayout": "topbar"
}/*EDITMODE-END*/;

// ---------- Step config ----------
const STEPS = [
  {
    key: "url",
    label: "01",
    title: "Job URL",
    placeholder: "https://company.com/jobs/senior-engineer",
    helper: "Paste the job posting you're applying to.",
    multiline: false,
    short: (v) => {
      try {
        const u = new URL(v);
        return u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, "");
      } catch {
        return v;
      }
    },
  },
  {
    key: "role",
    label: "02",
    title: "Recipient role",
    placeholder: "e.g. Engineering Manager, Recruiter, Founder",
    helper: "Who are you reaching out to?",
    multiline: false,
    short: (v) => v,
  },
  {
    key: "context",
    label: "03",
    title: "Context",
    placeholder: "Anything you know about the company or this person — recent launches, mutual connections, posts they wrote…",
    helper: "Optional but recommended. The more you know, the better the email.",
    multiline: true,
    short: (v) => (v.length > 60 ? v.slice(0, 60) + "…" : v),
  },
  {
    key: "ask",
    label: "04",
    title: "Your ask",
    placeholder: "A 15-min chat about the role? A referral? Feedback on your portfolio?",
    helper: "What outcome do you want from this email?",
    multiline: true,
    short: (v) => (v.length > 60 ? v.slice(0, 60) + "…" : v),
  },
];

// ---------- Brand mark ----------
function Mark({ size = 44 }) {
  // Pixel-art "R" — 8x8 grid, mint
  const grid = [
    "11111100",
    "11000110",
    "11000110",
    "11111100",
    "11011000",
    "11001100",
    "11000110",
    "11000011",
  ];
  const px = size / 8;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block", flex: "none" }}
      aria-hidden="true"
    >
      {grid.flatMap((row, y) =>
        row.split("").map((cell, x) =>
          cell === "1" ? (
            <rect
              key={`${x}-${y}`}
              x={x * px}
              y={y * px}
              width={px}
              height={px}
              fill="currentColor"
              opacity={0.85 + ((x + y) % 3) * 0.05}
            />
          ) : null
        )
      )}
    </svg>
  );
}

function Wordmark({ size = "lg" }) {
  const fontSize = size === "lg" ? 56 : size === "md" ? 28 : 18;
  const markSize = size === "lg" ? 56 : size === "md" ? 28 : 18;
  return (
    <div className="wordmark" style={{ alignItems: "center" }}>
      <div className="wordmark-glyph" style={{ color: "var(--accent)" }}>
        <Mark size={markSize} />
      </div>
      <span
        className="wordmark-text"
        style={{ fontSize, lineHeight: 1, letterSpacing: "-0.02em" }}
      >
        reach
      </span>
    </div>
  );
}

// ---------- Input row (used both centered and stacked) ----------
function InputRow({
  step,
  value,
  onChange,
  onSubmit,
  variant, // 'active' | 'stacked-pending' | 'stacked-done' | 'editing'
  onClickEdit,
  autoFocus,
  layout, // 'topbar' | 'sidebar' | 'pills'
}) {
  const inputRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    if (autoFocus) {
      const el = step.multiline ? taRef.current : inputRef.current;
      if (el) {
        el.focus();
        // place cursor at end
        const v = el.value;
        try {
          el.setSelectionRange(v.length, v.length);
        } catch {}
      }
    }
  }, [autoFocus, step.key]);

  const autosize = useCallback(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
  }, []);

  useLayoutEffect(() => {
    if (step.multiline) autosize();
  }, [value, autosize, step.multiline]);

  const handleKey = (e) => {
    if (step.multiline) {
      // Cmd/Ctrl+Enter or just Enter (without Shift) submits
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (value.trim()) onSubmit();
      }
    } else {
      if (e.key === "Enter") {
        e.preventDefault();
        if (value.trim()) onSubmit();
      }
    }
  };

  if (variant === "active" || variant === "editing") {
    return (
      <div
        className={`input-card ${variant === "editing" ? "is-editing" : "is-active"}`}
      >
        <div className="input-meta">
          <span className="input-label">{step.label}</span>
          <span className="input-title">{step.title}</span>
        </div>
        <div className="input-field-wrap">
          {step.multiline ? (
            <textarea
              ref={taRef}
              className="input-field input-field-ta"
              value={value}
              placeholder={step.placeholder}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              spellCheck={false}
            />
          ) : (
            <input
              ref={inputRef}
              className="input-field"
              type="text"
              value={value}
              placeholder={step.placeholder}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKey}
              spellCheck={false}
            />
          )}
          <button
            className="submit-btn"
            disabled={!value.trim()}
            onClick={onSubmit}
            aria-label="Submit"
          >
            <span className="submit-key">↵</span>
          </button>
        </div>
        <div className="input-helper">{step.helper}</div>
      </div>
    );
  }

  // Stacked variants
  if (layout === "pyramid") {
    return (
      <button
        type="button"
        className={`pyramid-row ${variant === "stacked-pending" ? "pyramid-pending" : ""}`}
        onClick={onClickEdit}
        title={`Edit ${step.title}`}
      >
        <span className="pyramid-label">{step.label}</span>
        <span className="pyramid-title">{step.title}</span>
        <span className="pyramid-divider" aria-hidden="true">·</span>
        <span className="pyramid-value">
          {value ? step.short(value) : <em className="pyramid-empty">— pending —</em>}
        </span>
      </button>
    );
  }

  if (layout === "pills") {
    return (
      <button
        type="button"
        className={`pill ${variant === "stacked-pending" ? "pill-pending" : ""}`}
        onClick={onClickEdit}
        title={`Edit ${step.title}`}
      >
        <span className="pill-label">{step.label}</span>
        <span className="pill-value">
          {value ? step.short(value) : <em className="pill-empty">— pending —</em>}
        </span>
      </button>
    );
  }

  if (layout === "sidebar") {
    return (
      <button
        type="button"
        className={`side-row ${variant === "stacked-pending" ? "side-pending" : ""}`}
        onClick={onClickEdit}
      >
        <div className="side-meta">
          <span className="side-label">{step.label}</span>
          <span className="side-title">{step.title}</span>
        </div>
        <div className="side-value">
          {value ? step.short(value) : <em className="side-empty">— pending —</em>}
        </div>
      </button>
    );
  }

  // topbar (default)
  return (
    <button
      type="button"
      className={`top-row ${variant === "stacked-pending" ? "top-pending" : ""}`}
      onClick={onClickEdit}
    >
      <span className="top-label">{step.label}</span>
      <span className="top-title">{step.title}</span>
      <span className="top-divider" aria-hidden="true">·</span>
      <span className="top-value">
        {value ? step.short(value) : <em className="top-empty">— pending —</em>}
      </span>
    </button>
  );
}

// ---------- Loading shimmer ----------
function Loading() {
  return (
    <div className="loading-card">
      <div className="loading-head">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
        <span className="loading-text">Drafting your email…</span>
      </div>
      <div className="shimmer-lines">
        {[92, 78, 100, 64, 88, 70, 40].map((w, i) => (
          <div
            key={i}
            className="shimmer-line"
            style={{ width: w + "%", animationDelay: i * 0.08 + "s" }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------- Generated email view ----------
function EmailDraft({ subject, body, onChangeSubject, onChangeBody, onRegenerate, regenerating }) {
  const taRef = useRef(null);
  useLayoutEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = el.scrollHeight + "px";
  }, [body]);

  const [copied, setCopied] = useState(false);
  const copy = () => {
    const text = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="email-card">
      <div className="email-toolbar">
        <div className="email-toolbar-left">
          <span className="email-tag">Draft</span>
          <span className="email-meta">Editable · ⌘↵ to copy</span>
        </div>
        <div className="email-toolbar-right">
          <button className="ghost-btn" onClick={onRegenerate} disabled={regenerating}>
            {regenerating ? "Regenerating…" : "↻ Regenerate"}
          </button>
          <button className="primary-btn" onClick={copy}>
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>
      <div className="email-field">
        <label className="email-label">Subject</label>
        <input
          className="email-subject"
          value={subject}
          onChange={(e) => onChangeSubject(e.target.value)}
          spellCheck={false}
        />
      </div>
      <div className="email-field">
        <label className="email-label">Body</label>
        <textarea
          ref={taRef}
          className="email-body"
          value={body}
          onChange={(e) => onChangeBody(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  );
}

// ---------- Main App ----------
function App() {
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const { theme, stackedLayout } = tweaks;

  const [values, setValues] = useState({ url: "", role: "", context: "", ask: "" });
  const [stepIndex, setStepIndex] = useState(0); // 0..3 active step; 4 = stacked + email
  const [editingKey, setEditingKey] = useState(null); // when re-editing a stacked field
  const [phase, setPhase] = useState("input"); // 'input' | 'loading' | 'email'
  const [draft, setDraft] = useState({ subject: "", body: "" });
  const [regenerating, setRegenerating] = useState(false);

  // Apply theme to root
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const allComplete = STEPS.every((s) => values[s.key].trim());

  // Submit current step
  const submitStep = () => {
    if (editingKey) {
      setEditingKey(null);
      // if stacked phase finished and an edit happened, re-trigger generation? user can hit regenerate
      return;
    }
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      // last step submitted -> stack & generate
      setStepIndex(STEPS.length);
      setTimeout(() => generate(), 600); // wait for stack animation
    }
  };

  const generate = async () => {
    setPhase("loading");
    setRegenerating(true);
    // Mock delay; in real app this would call window.claude.complete
    await new Promise((r) => setTimeout(r, 1800 + Math.random() * 800));
    const role = values.role || "there";
    const ctx = values.context || "";
    const ask = values.ask || "a quick chat";
    let url = values.url;
    let company = "your team";
    try {
      const u = new URL(values.url);
      company = u.hostname.replace(/^www\./, "").split(".")[0];
      company = company.charAt(0).toUpperCase() + company.slice(1);
    } catch {}

    const subject = `Re: the ${url ? "role at " + company : "open role"} — quick note`;
    const body = `Hi ${role.split(" ")[0] || "there"},

I came across the posting and wanted to reach out directly. ${ctx ? "I noticed " + ctx.split(/[.\n]/)[0].toLowerCase() + ", which really resonated — " : ""}the work your team is doing is exactly the kind of problem I want to be close to.

A bit about me: I've spent the last few years shipping product where the line between engineering and design is intentionally blurry. I tend to do my best work when I can own a problem end-to-end and ship something measurable.

${ask.endsWith("?") ? ask.slice(0, -1) + "?" : "Would you be open to " + ask.toLowerCase().replace(/^(a |an )/, "") + "?"} I'd be happy to send a short loom or a few writing samples beforehand if that's useful.

Thanks for your time,
[Your name]`;
    setDraft({ subject, body });
    setPhase("email");
    setRegenerating(false);
  };

  const onClickEdit = (key) => {
    setEditingKey(key);
  };

  // Layout class
  const stackedLayoutClass = `layout-${stackedLayout}`;
  const isStackedPhase = stepIndex >= STEPS.length;
  // Logo goes to corner as soon as the user advances past the first input
  const brandSmall = isStackedPhase || stepIndex > 0;

  return (
    <div
      className={`app ${isStackedPhase ? "phase-stacked" : "phase-input"} ${stackedLayoutClass}`}
      data-theme={theme}
    >
      {/* Logo: morphs from large center to small top-left */}
      <header className={`brand-bar ${brandSmall ? "brand-small" : "brand-large"}`}>
        <Wordmark size={brandSmall ? "sm" : "lg"} />
      </header>

      {!isStackedPhase ? (
        <main className="center-stage">
          {/* Stack of completed inputs above the active one */}
          <div className="completed-stack">
            {STEPS.slice(0, stepIndex).map((s) => (
              <div key={s.key} className="completed-line">
                <span className="completed-label">{s.label}</span>
                <span className="completed-title">{s.title}</span>
                <span className="completed-divider">·</span>
                <span className="completed-value">{s.short(values[s.key])}</span>
              </div>
            ))}
          </div>

          <div className="active-input-wrap" key={stepIndex}>
            <InputRow
              step={STEPS[stepIndex]}
              value={values[STEPS[stepIndex].key]}
              onChange={(v) =>
                setValues({ ...values, [STEPS[stepIndex].key]: v })
              }
              onSubmit={submitStep}
              variant="active"
              autoFocus
            />
          </div>

          <div className="step-progress">
            {STEPS.map((s, i) => (
              <span
                key={s.key}
                className={`step-dot ${i < stepIndex ? "done" : ""} ${i === stepIndex ? "current" : ""}`}
              />
            ))}
          </div>
        </main>
      ) : (
        <main className="stacked-stage">
          <div className={`stacked-rail ${stackedLayoutClass}`}>
            {STEPS.map((s) => {
              if (editingKey === s.key) {
                return (
                  <div key={s.key} className="active-input-wrap inline-edit">
                    <InputRow
                      step={s}
                      value={values[s.key]}
                      onChange={(v) => setValues({ ...values, [s.key]: v })}
                      onSubmit={submitStep}
                      variant="editing"
                      autoFocus
                    />
                  </div>
                );
              }
              return (
                <InputRow
                  key={s.key}
                  step={s}
                  value={values[s.key]}
                  variant={values[s.key].trim() ? "stacked-done" : "stacked-pending"}
                  onClickEdit={() => onClickEdit(s.key)}
                  layout={stackedLayout}
                />
              );
            })}
          </div>

          <div className="result-stage">
            {phase === "loading" && <Loading />}
            {phase === "email" && (
              <EmailDraft
                subject={draft.subject}
                body={draft.body}
                onChangeSubject={(v) => setDraft({ ...draft, subject: v })}
                onChangeBody={(v) => setDraft({ ...draft, body: v })}
                onRegenerate={generate}
                regenerating={regenerating}
              />
            )}
          </div>
        </main>
      )}

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection title="Theme">
          <window.TweakRadio
            label="Mode"
            value={theme}
            onChange={(v) => setTweak("theme", v)}
            options={[
              { value: "dark", label: "Dark" },
              { value: "light", label: "Light" },
            ]}
          />
        </window.TweakSection>
        <window.TweakSection title="Stacked layout" subtitle="How completed inputs sit when the email is being drafted">
          <window.TweakRadio
            label="Layout"
            value={stackedLayout}
            onChange={(v) => setTweak("stackedLayout", v)}
            options={[
              { value: "topbar", label: "Top bar" },
              { value: "sidebar", label: "Sidebar" },
              { value: "pills", label: "Pills" },
              { value: "pyramid", label: "Pyramid" },
            ]}
          />
        </window.TweakSection>
        <window.TweakSection title="Reset">
          <window.TweakButton
            label="Restart flow"
            onClick={() => {
              setValues({ url: "", role: "", context: "", ask: "" });
              setStepIndex(0);
              setPhase("input");
              setDraft({ subject: "", body: "" });
              setEditingKey(null);
            }}
          />
        </window.TweakSection>
      </window.TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
