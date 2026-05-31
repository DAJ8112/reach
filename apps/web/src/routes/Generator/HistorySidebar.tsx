import { useEffect, useState } from 'react';
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

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6h12Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
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
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setConfirmingId(null);
  }, [open]);

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
                className={`history-item ${g.id === selectedId ? 'selected' : ''} ${confirmingId === g.id ? 'confirming' : ''}`}
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
                    setConfirmingId(g.id);
                  }}
                >
                  <TrashIcon />
                </button>
                {confirmingId === g.id && (
                  <div
                    className="history-confirm"
                    role="dialog"
                    aria-label="Confirm delete"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="history-confirm-label">Delete?</span>
                    <div className="history-confirm-actions">
                      <button
                        type="button"
                        className="history-confirm-cancel"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmingId(null);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="history-confirm-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(g.id);
                          setConfirmingId(null);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </aside>
    </>
  );
}
