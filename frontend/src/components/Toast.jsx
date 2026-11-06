import React from 'react';

export default function Toast({ toasts, onRemove }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1080 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast show align-items-center text-white bg-dark border-0 shadow-lg mb-2 rounded-3 animate-fade-in"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          style={{ minWidth: '240px', fontSize: '12.5px' }}
        >
          <div className="d-flex p-2 align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <span>📥</span>
              <span>{t.message}</span>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white ms-2"
              aria-label="Close"
              style={{ fontSize: '11px' }}
              onClick={() => onRemove(t.id)}
            ></button>
          </div>
        </div>
      ))}
    </div>
  );
}
