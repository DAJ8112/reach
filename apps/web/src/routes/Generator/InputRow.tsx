import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { StepDef } from './steps.js';

type Variant = 'active' | 'editing' | 'stacked-pending' | 'stacked-done';

type ActiveProps = {
  step: StepDef;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  variant: 'active' | 'editing';
  autoFocus?: boolean;
  /** Optional slot under the helper line (e.g. paste-JD toggle on URL step) */
  extra?: React.ReactNode;
};

export function ActiveInput({ step, value, onChange, onSubmit, variant, autoFocus, extra }: ActiveProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!autoFocus) return;
    const el = step.multiline ? taRef.current : inputRef.current;
    if (!el) return;
    el.focus();
    try {
      el.setSelectionRange(el.value.length, el.value.length);
    } catch {
      // Element might not support selection
    }
  }, [autoFocus, step.key, step.multiline]);

  const autosize = useCallback(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = Math.min(el.scrollHeight, 240) + 'px';
  }, []);

  useLayoutEffect(() => {
    if (step.multiline) autosize();
  }, [value, autosize, step.multiline]);

  function handleKey(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (e.key !== 'Enter') return;
    if (step.multiline && e.shiftKey) return;
    e.preventDefault();
    if (value.trim()) onSubmit();
  }

  return (
    <div className={`input-card ${variant === 'editing' ? 'is-editing' : 'is-active'}`}>
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
          type="button"
        >
          <span className="submit-key">↵</span>
        </button>
      </div>
      <div className="input-helper">{step.helper}</div>
      {extra}
    </div>
  );
}

type StackedProps = {
  step: StepDef;
  value: string;
  variant: Extract<Variant, 'stacked-pending' | 'stacked-done'>;
  onClickEdit: () => void;
};

export function StackedInput({ step, value, variant, onClickEdit }: StackedProps) {
  return (
    <button
      type="button"
      className={`top-row ${variant === 'stacked-pending' ? 'top-pending' : ''}`}
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
