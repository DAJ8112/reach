import type { Generation } from '@reach/shared';

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.round(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function HistorySidebar({
  open,
  items,
  selectedId,
  onClose,
  onSelect,
  onDelete,
}: {
  open: boolean;
  items: Generation[];
  selectedId: string | null;
  onClose: () => void;
  onSelect: (g: Generation) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      {open && <div className="history-backdrop" onClick={onClose} aria-hidden />}
      <aside className={`history-drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="history-head">
          <span className="history-title">History</span>
          <button className="history-close" onClick={onClose} aria-label="Close history">
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <div className="history-empty">No emails yet. Generate one to see it here.</div>
        ) : (
          <ul className="history-list">
            {items.map((g) => (
              <li
                key={g.id}
                className={`history-item ${g.id === selectedId ? 'selected' : ''}`}
                onClick={() => onSelect(g)}
              >
                <div className="history-item-main">
                  <span className="history-item-role">{g.recipientRole}</span>
                  <span className="history-item-subject">{g.subject || '(no subject)'}</span>
                  <span className="history-item-time">{relativeTime(g.createdAt)}</span>
                </div>
                <button
                  className="history-delete"
                  aria-label="Delete email"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(g.id);
                  }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </>
  );
}
