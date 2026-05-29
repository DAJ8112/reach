import { useEffect, useState } from 'react';
import type { Generation, Profile } from '@reach/shared';
import { Wordmark } from '../../components/Wordmark.js';
import { navigate } from '../../lib/route.js';
import { STEPS } from './steps.js';
import { ActiveInput, StackedInput } from './InputRow.js';
import { Loading } from './Loading.js';
import { EmailDraft } from './EmailDraft.js';
import { HistorySidebar } from './HistorySidebar.js';
import { generateDraft, listGenerations, deleteGeneration, type GenerateError } from './api.js';
import { toast } from '../../lib/toast.js';
import { friendlyError } from '../../lib/errorMessages.js';
import { useTheme } from '../../lib/theme.js';
import './generator.css';

type Phase = 'input' | 'loading' | 'email';

type Values = { url: string; role: string; context: string; ask: string };

export function Generator({ profile: _profile, onReset: _onReset }: { profile: Profile; onReset: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const [values, setValues] = useState<Values>({ url: '', role: '', context: '', ask: '' });
  const [pasteMode, setPasteMode] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('input');
  const [draft, setDraft] = useState({ subject: '', body: '' });
  const [regenerating, setRegenerating] = useState(false);
  const [history, setHistory] = useState<Generation[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isStackedPhase = stepIndex >= STEPS.length;
  const brandSmall = isStackedPhase || stepIndex > 0;

  useEffect(() => {
    listGenerations()
      .then(setHistory)
      .catch(() => {});
  }, []);

  function submitStep() {
    if (editingKey) {
      setEditingKey(null);
      return;
    }
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setStepIndex(STEPS.length);
      setTimeout(() => void generate(), 600);
    }
  }

  async function generate() {
    setPhase('loading');
    setRegenerating(true);
    try {
      const out = await generateDraft({
        ...(pasteMode ? { jobTextOverride: values.url } : { jobUrl: values.url }),
        recipientRole: values.role,
        recipientContext: values.context || undefined,
        ask: values.ask,
      });
      setDraft({ subject: out.subject, body: out.body });
      if (out.generation) {
        setHistory((prev) => [out.generation!, ...prev]);
        setSelectedId(out.generation.id);
      }
      setPhase('email');
      toast.success('Draft ready');
    } catch (e) {
      const err = e as GenerateError;
      if (err.kind === 'needs_manual') {
        setPasteMode(true);
        setStepIndex(0);
        setEditingKey(null);
        setPhase('input');
        setValues({ ...values, url: '' });
        toast.info("Couldn't read URL — paste the JD text instead");
      } else {
        setPhase(stepIndex >= STEPS.length ? 'email' : 'input');
        toast.error(`Generation failed: ${friendlyError(err.code)}`);
      }
    } finally {
      setRegenerating(false);
    }
  }

  function restartFlow() {
    setValues({ url: '', role: '', context: '', ask: '' });
    setStepIndex(0);
    setPhase('input');
    setDraft({ subject: '', body: '' });
    setEditingKey(null);
    setPasteMode(false);
    setSelectedId(null);
  }

  function selectGeneration(g: Generation) {
    setValues({
      url: g.jobUrl ?? g.jobText,
      role: g.recipientRole,
      context: g.recipientContext ?? '',
      ask: g.ask,
    });
    setPasteMode(g.jobUrl == null);
    setDraft({ subject: g.subject, body: g.body });
    setEditingKey(null);
    setStepIndex(STEPS.length);
    setPhase('email');
    setSelectedId(g.id);
    setHistoryOpen(false);
  }

  async function removeGeneration(id: string) {
    const prev = history;
    setHistory((h) => h.filter((g) => g.id !== id));
    if (selectedId === id) setSelectedId(null);
    try {
      await deleteGeneration(id);
    } catch {
      setHistory(prev);
      toast.error('Could not delete email');
    }
  }

  return (
    <div className={`gen-app ${isStackedPhase ? 'phase-stacked' : 'phase-input'} font-sans`}>
      <header className={`brand-bar ${brandSmall ? 'brand-small' : 'brand-large'}`}>
        <span className="text-accent">
          <Wordmark size={brandSmall ? 'sm' : 'lg'} />
        </span>
      </header>

      <div className="gen-menu">
        <button onClick={restartFlow}>New email</button>
        <button onClick={() => navigate('/settings')}>Settings</button>
        <button onClick={toggleTheme}>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</button>
      </div>

      <button
        className={`history-toggle ${historyOpen ? 'hidden' : ''}`}
        onClick={() => setHistoryOpen(true)}
        aria-label="Open history"
      >
        <span className="history-toggle-icon" aria-hidden>
          <span />
          <span />
          <span />
        </span>
      </button>

      <HistorySidebar
        open={historyOpen}
        items={history}
        selectedId={selectedId}
        onClose={() => setHistoryOpen(false)}
        onSelect={selectGeneration}
        onDelete={removeGeneration}
      />

      {!isStackedPhase ? (
        <main className="center-stage">
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
            {(() => {
              const step = STEPS[stepIndex]!;
              const isUrlStep = step.key === 'url';
              const effectiveStep =
                isUrlStep && pasteMode
                  ? {
                      ...step,
                      multiline: true,
                      placeholder: 'Paste the full job description here…',
                      helper: 'Pasted JD will be used directly.',
                    }
                  : step;
              return (
                <ActiveInput
                  step={effectiveStep}
                  value={values[step.key]}
                  onChange={(v) => setValues({ ...values, [step.key]: v })}
                  onSubmit={submitStep}
                  variant="active"
                  autoFocus
                  extra={
                    isUrlStep ? (
                      <button
                        type="button"
                        className="jd-paste-toggle"
                        onClick={() => {
                          setValues({ ...values, url: '' });
                          setPasteMode(!pasteMode);
                        }}
                      >
                        {pasteMode ? '↶ Use a URL instead' : '→ Paste JD text instead'}
                      </button>
                    ) : null
                  }
                />
              );
            })()}
          </div>

          <div className="step-progress">
            {STEPS.map((s, i) => (
              <span
                key={s.key}
                className={`step-dot ${i < stepIndex ? 'done' : ''} ${i === stepIndex ? 'current' : ''}`}
              />
            ))}
          </div>
        </main>
      ) : (
        <main className="stacked-stage">
          <div className="stacked-rail">
            {STEPS.map((s) => {
              if (editingKey === s.key) {
                const isUrlStep = s.key === 'url';
                const effectiveStep =
                  isUrlStep && pasteMode
                    ? {
                        ...s,
                        multiline: true,
                        placeholder: 'Paste the full job description here…',
                        helper: 'Pasted JD will be used directly.',
                      }
                    : s;
                return (
                  <div key={s.key} className="active-input-wrap inline-edit">
                    <ActiveInput
                      step={effectiveStep}
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
                <StackedInput
                  key={s.key}
                  step={s}
                  value={values[s.key]}
                  variant={values[s.key].trim() ? 'stacked-done' : 'stacked-pending'}
                  onClickEdit={() => setEditingKey(s.key)}
                />
              );
            })}
          </div>

          <div className="result-stage">
            {phase === 'loading' && <Loading />}
            {phase === 'email' && (
              <EmailDraft
                subject={draft.subject}
                body={draft.body}
                onChangeSubject={(v) => setDraft({ ...draft, subject: v })}
                onChangeBody={(v) => setDraft({ ...draft, body: v })}
                onRegenerate={() => void generate()}
                regenerating={regenerating}
              />
            )}
          </div>
        </main>
      )}
    </div>
  );
}

