import React from 'react';
import { getDownloadUrl } from '../api';
import CoverImage from './CoverImage';

export default function BookModal({ book, onClose }) {
  if (!book) return null;

  const coverUrl = book.cover || '';
  const genres = Array.isArray(book.genres) ? book.genres : [];
  const rawStatus = (book.status || 'Completed').toUpperCase();

  const handleDownload = () => {
    window.location.href = getDownloadUrl(book.id);
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{ maxWidth: '560px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden bg-white">
          {/* Header */}
          <div className="modal-header border-bottom px-3 py-2 bg-light">
            <span className="badge bg-dark rounded-pill px-2 py-1" style={{ fontSize: '10px' }}>
              Archive Details
            </span>
            <button
              type="button"
              className="btn-close ms-auto"
              style={{ fontSize: '12px' }}
              aria-label="Close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body p-3">
            <div className="row g-3">
              {/* Compact Cover */}
              <div className="col-4 text-center">
                <div className="ratio-cover-container shadow-xs">
                  <CoverImage
                    src={coverUrl}
                    className="novel-cover-img"
                    alt={book.title}
                  />
                </div>
                <div className="mt-2">
                  <span className="badge bg-light text-muted border text-uppercase" style={{ fontSize: '9px' }}>
                    {book.language || 'RAW/MTL'}
                  </span>
                </div>
              </div>

              {/* Novel Information */}
              <div className="col-8 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center gap-1 mb-1">
                    <span
                      className={`badge ${
                        rawStatus === 'COMPLETED'
                          ? 'bg-success-subtle text-success border border-success-subtle'
                          : 'bg-primary-subtle text-primary border border-primary-subtle'
                      }`}
                      style={{ fontSize: '9.5px' }}
                    >
                      {rawStatus}
                    </span>
                    <span className="text-muted" style={{ fontSize: '11px' }}>
                      &bull; {book.total_chapters} Chapters
                    </span>
                  </div>

                  <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '14.5px', lineHeight: '1.3' }}>
                    {book.title}
                  </h6>

                  {book.original_title && (
                    <p className="text-muted small fst-italic mb-1 text-truncate" style={{ fontSize: '11px' }} title={book.original_title}>
                      {book.original_title}
                    </p>
                  )}

                  <p className="text-secondary mb-2" style={{ fontSize: '11.5px' }}>
                    Author: <span className="fw-semibold text-dark">{book.author || 'Anonymous'}</span>
                  </p>

                  {/* Raw Source / Original Web Novel Link */}
                  {book.source_url ? (
                    <div className="mb-2">
                      <a
                        href={book.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-primary btn-sm rounded-pill px-2 py-0 d-inline-flex align-items-center gap-1 text-decoration-none"
                        style={{ fontSize: '10.5px' }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        Raw Source Web
                      </a>
                    </div>
                  ) : (
                    <div className="text-muted mb-2" style={{ fontSize: '10.5px' }}>
                      Raw Source: <i>Offline Archive</i>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="d-flex flex-wrap gap-1 mb-2">
                    {genres.slice(0, 4).map((g, idx) => (
                      <span key={idx} className="badge bg-light text-secondary border fw-normal" style={{ fontSize: '9.5px' }}>
                        {typeof g === 'object' ? g.name : g}
                      </span>
                    ))}
                    {genres.length > 4 && (
                      <span className="text-muted" style={{ fontSize: '9px' }}>
                        +{genres.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-muted small" style={{ fontSize: '11px' }}>
                  Size: <b>{book.file_size_mb} MB</b> &bull; Chars: <b>{book.chars_display || '-'}</b>
                </div>
              </div>
            </div>

            {/* Synopsis / Description */}
            <div className="mt-3 pt-2 border-top">
              <span className="text-muted small fw-bold text-uppercase d-block mb-1" style={{ fontSize: '10.5px' }}>
                Synopsis
              </span>
              <div
                className="p-2 bg-light rounded text-secondary"
                style={{
                  maxHeight: '130px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-line',
                  fontSize: '11.5px',
                  lineHeight: '1.45',
                }}
              >
                {book.description || 'No synopsis embedded in this ePub.'}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer bg-light px-3 py-2 d-flex align-items-center justify-content-between">
            <span className="text-muted" style={{ fontSize: '10.5px' }}>
              Downloads: <b>{book.download_count}x</b>
            </span>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1"
                style={{ fontSize: '11px' }}
                onClick={onClose}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-dark btn-sm rounded-pill px-3 py-1 fw-medium"
                style={{ fontSize: '11px' }}
                onClick={handleDownload}
              >
                Download EPUB ({book.file_size_mb} MB)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
