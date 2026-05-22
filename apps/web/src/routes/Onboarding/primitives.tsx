import { useLayoutEffect, useRef, type ReactNode } from 'react';

export function FieldLabel({ children, optional }: { children: ReactNode; optional?: boolean }) {
  return (
    <label className="ob-label">
      {children}
      {optional && <span className="ob-optional">optional</span>}
    </label>
  );
}

type TextFieldProps = {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
  type?: string;
};

export function TextField({ label, value, onChange, placeholder, optional, type = 'text' }: TextFieldProps) {
  return (
    <div className="ob-field">
      {label && <FieldLabel optional={optional}>{label}</FieldLabel>}
      <input
        className="ob-input"
        type={type}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
}

type TextAreaProps = {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
  rows?: number;
};

export function TextArea({ label, value, onChange, placeholder, optional, rows = 3 }: TextAreaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = el.scrollHeight + 'px';
  }, [value]);
  return (
    <div className="ob-field">
      {label && <FieldLabel optional={optional}>{label}</FieldLabel>}
      <textarea
        ref={ref}
        className="ob-input ob-textarea"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        spellCheck={false}
      />
    </div>
  );
}

type BtnTone = 'primary' | 'ghost' | 'text';
export function Btn({
  children,
  onClick,
  disabled,
  tone = 'primary',
  className = '',
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: BtnTone;
  className?: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      className={`btn btn-${tone} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
