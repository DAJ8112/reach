import { useRef, useState } from 'react';
import type { ResumeJson } from '@reach/shared';
import { apiUpload, ApiError } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { ERROR_MESSAGES } from '../../lib/errorMessages.js';

export type ParsedResume = {
  basics: { name: string; headline: string; email: string; phone: string; location: string };
  resumeJson: ResumeJson;
  skills: string[];
};

type ServerParsed = {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  resumeJson: ResumeJson;
  skills: string[];
  resumeText: string;
};

type UploadState = 'idle' | 'parsing' | 'done' | 'error';

export function StepUpload({ onParsed }: { onParsed: (p: ParsedResume) => void }) {
  const [state, setState] = useState<UploadState>('idle');
  const [filename, setFilename] = useState('');
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const tickerRef = useRef<number | null>(null);

  function startTicker() {
    setProgress(0);
    let p = 0;
    const tick = () => {
      // Asymptote ~92% — leave the last 8% for the actual response.
      p += (92 - p) * 0.06 + 0.5;
      if (p >= 92) p = 92;
      setProgress(p);
      tickerRef.current = window.setTimeout(tick, 180 + Math.random() * 140);
    };
    tick();
  }
  function stopTicker() {
    if (tickerRef.current) {
      clearTimeout(tickerRef.current);
      tickerRef.current = null;
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setFilename(file.name);
    setState('parsing');
    startTicker();
    try {
      const res = await apiUpload<ServerParsed>('/api/profile/resume', file);
      stopTicker();
      setProgress(100);
      setTimeout(() => {
        setState('done');
        onParsed({
          basics: {
            name: res.name,
            headline: res.headline,
            email: res.email,
            phone: res.phone,
            location: res.location,
          },
          resumeJson: res.resumeJson,
          skills: res.skills,
        });
      }, 380);
    } catch (e) {
      stopTicker();
      setState('error');
      const code = e instanceof ApiError ? e.message : 'unknown';
      toast.error(ERROR_MESSAGES[code] ?? `Upload failed: ${code}`);
    }
  }

  function reset() {
    setState('idle');
    setProgress(0);
    setFilename('');
  }

  return (
    <div className="step-content">
      <div className="step-header">
        <div className="step-eyebrow">STEP 01</div>
        <h1 className="step-title">Upload your resume</h1>
        <p className="step-sub">
          We'll parse it once so every email you write is grounded in your real experience.
        </p>
      </div>

      {(state === 'idle' || state === 'done' || state === 'error') && (
        <div
          className={`dropzone ${dragOver ? 'is-over' : ''} ${state === 'done' ? 'is-done' : ''}`}
          onClick={() => state === 'idle' && inputRef.current?.click()}
          onDragOver={(e) => {
            if (state !== 'idle') return;
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            if (state !== 'idle') return;
            e.preventDefault();
            setDragOver(false);
            void handleFile(e.dataTransfer.files?.[0]);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            style={{ display: 'none' }}
            onChange={(e) => void handleFile(e.target.files?.[0] ?? undefined)}
          />
          <div className="dropzone-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect x="9" y="6" width="22" height="28" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M14 14h12M14 19h12M14 24h7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="dropzone-title">{state === 'done' ? 'Parsed ✓' : 'Drag & drop your resume'}</div>
          <div className="dropzone-sub">
            {state === 'done' ? (
              filename
            ) : (
              <>
                or <span className="link">click to browse</span> · PDF, DOCX up to 10MB
              </>
            )}
          </div>
          {state === 'error' && (
            <div className="dropzone-sub" style={{ color: 'var(--accent)' }}>
              Upload failed —{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  reset();
                }}
                style={{ background: 'transparent', border: 0, color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}
              >
                try again
              </button>
            </div>
          )}
        </div>
      )}

      {state === 'parsing' && (
        <div className="parsing-card">
          <div className="parsing-row">
            <div className="parsing-name">{filename}</div>
            <div className="parsing-pct">{Math.floor(progress)}%</div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: progress + '%' }} />
          </div>
          <div className="parsing-status">
            {progress < 30
              ? 'Reading file…'
              : progress < 60
                ? 'Extracting structure…'
                : progress < 90
                  ? 'Identifying skills & experience…'
                  : 'Almost done…'}
          </div>
        </div>
      )}
    </div>
  );
}
