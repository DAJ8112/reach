import type { Links } from '@reach/shared';

const LINK_PRESETS = [
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/yourname', icon: 'in' },
  { key: 'github', label: 'GitHub', placeholder: 'github.com/yourname', icon: '</>' },
  { key: 'site', label: 'Portfolio', placeholder: 'yourname.com', icon: '↗' },
  { key: 'twitter', label: 'Twitter / X', placeholder: 'x.com/yourname', icon: '𝕏' },
] as const;

type PresetKey = (typeof LINK_PRESETS)[number]['key'];

export function StepLinks({
  links,
  onChange,
}: {
  links: Links;
  onChange: (next: Links) => void;
}) {
  const update = (key: PresetKey, value: string) => onChange({ ...links, [key]: value });
  const updateCustom = (i: number, patch: Partial<{ label: string; url: string }>) => {
    const next = links.custom.map((c, idx) => (idx === i ? { ...c, ...patch } : c));
    onChange({ ...links, custom: next });
  };
  const removeCustom = (i: number) =>
    onChange({ ...links, custom: links.custom.filter((_, idx) => idx !== i) });
  const addCustom = () => onChange({ ...links, custom: [...links.custom, { label: '', url: '' }] });

  return (
    <div className="step-content">
      <div className="step-header">
        <div className="step-eyebrow">STEP 04</div>
        <h1 className="step-title">Add your links</h1>
        <p className="step-sub">
          Anywhere a recipient might want to learn more about you. We'll include the relevant ones in your emails.
        </p>
      </div>

      <div className="links-list">
        {LINK_PRESETS.map((p) => (
          <div key={p.key} className="link-row">
            <div className="link-icon">{p.icon}</div>
            <div className="link-meta">
              <div className="link-label">{p.label}</div>
              <input
                className="link-input"
                value={links[p.key]}
                onChange={(e) => update(p.key, e.target.value)}
                placeholder={p.placeholder}
                spellCheck={false}
              />
            </div>
          </div>
        ))}

        {links.custom.map((c, i) => (
          <div key={i} className="link-row link-custom">
            <div className="link-icon">+</div>
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
            <button className="ob-card-remove" onClick={() => removeCustom(i)}>
              ×
            </button>
          </div>
        ))}
      </div>

      <button type="button" className="ob-add-card" onClick={addCustom}>
        <span>+</span> Add a custom link
      </button>
    </div>
  );
}
