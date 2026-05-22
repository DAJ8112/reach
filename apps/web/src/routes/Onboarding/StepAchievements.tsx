import type { Achievement } from '@reach/shared';
import { TextArea } from './primitives.js';

export function StepAchievements({
  achievements,
  onChange,
}: {
  achievements: Achievement[];
  onChange: (next: Achievement[]) => void;
}) {
  const update = (i: number, patch: Partial<Achievement>) =>
    onChange(achievements.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  const remove = (i: number) => onChange(achievements.filter((_, idx) => idx !== i));
  const add = () => achievements.length < 5 && onChange([...achievements, { title: '', detail: '' }]);

  return (
    <div className="step-content">
      <div className="step-header">
        <div className="step-eyebrow">STEP 03</div>
        <h1 className="step-title">Highlight 3–5 achievements</h1>
        <p className="step-sub">
          The proudest things you've shipped or done. We'll lean on these when an email needs proof of impact.
        </p>
      </div>

      <div className="ach-list">
        {achievements.map((a, i) => (
          <div key={i} className="ach-card">
            <div className="ach-num">{String(i + 1).padStart(2, '0')}</div>
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
            <button className="ach-remove" onClick={() => remove(i)} aria-label="Remove">
              ×
            </button>
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
