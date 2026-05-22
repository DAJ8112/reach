import { Mark } from '../../components/Wordmark.js';
import { Btn } from './primitives.js';

export function StepWelcome({ name, onStart }: { name: string; onStart: () => void }) {
  const first = (name || 'friend').split(' ')[0];
  return (
    <div className="step-content welcome-stage">
      <div className="welcome-mark">
        <Mark size={64} />
      </div>
      <div className="welcome-eyebrow">YOU'RE SET</div>
      <h1 className="welcome-title">Welcome, {first}.</h1>
      <p className="welcome-sub">
        Reach now knows your background. Every email you draft will sound like you — grounded in real
        experience, not generic filler.
      </p>
      <div className="welcome-summary-spacer" />
      <Btn tone="primary" onClick={onStart} className="welcome-cta">
        Write your first email →
      </Btn>
      <div className="welcome-hint">⌘K to open Reach from anywhere</div>
    </div>
  );
}
