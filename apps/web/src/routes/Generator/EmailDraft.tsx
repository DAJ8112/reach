import { useEffect, useLayoutEffect, useRef } from 'react';
import { toast } from '../../lib/toast.js';

type Props = {
  subject: string;
  body: string;
  onChangeSubject: (v: string) => void;
  onChangeBody: (v: string) => void;
  onRegenerate: () => void;
  regenerating: boolean;
};

export function EmailDraft({
  subject,
  body,
  onChangeSubject,
  onChangeBody,
  onRegenerate,
  regenerating,
}: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = el.scrollHeight + 'px';
  }, [body]);

  function copy() {
    const text = `Subject: ${subject}\n\n${body}`;
    void navigator.clipboard?.writeText(text);
    toast.success('Copied');
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        copy();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, body]);

  return (
    <div className="email-card">
      <div className="email-toolbar">
        <div className="email-toolbar-left">
          <span className="email-tag">Draft</span>
          <span className="email-meta">Editable · ⌘↵ to copy</span>
        </div>
        <div className="email-toolbar-right">
          <button className="ghost-btn" onClick={onRegenerate} disabled={regenerating} type="button">
            {regenerating ? 'Regenerating…' : '↻ Regenerate'}
          </button>
          <button className="primary-btn" onClick={copy} type="button">
            Copy
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
