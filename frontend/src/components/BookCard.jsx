import React from 'react';
import { getDownloadUrl, downloadBookFile, translateTag } from '../api';
import CoverImage from './CoverImage';

export function getReadingLength(chapters) {
  const ch = Number(chapters) || 0;
  if (ch <= 10) return { label: 'Short', className: 'badge-length-short' };
  if (ch <= 50) return { label: 'Medium', className: 'badge-length-medium' };
  if (ch <= 150) return { label: 'Long', className: 'badge-length-long' };
  return { label: 'Epic', className: 'badge-length-epic' };
}

export default function BookCard({ book, onOpenDetail, onDownloadClick }) {
  const coverUrl = book.cover || '';
  const genres = Array.isArray(book.genres) ? book.genres : [];
  const primaryGenre = translateTag(genres[0]) || 'Web Novel';
  const rawStatus = (book.status || 'Completed').toUpperCase();
  const lengthInfo = getReadingLength(book.total_chapters);

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (onDownloadClick) {
      onDownloadClick(book);
    }
    await downloadBookFile(book.id, book.title);
  };

  return (
    <div className="col-12 col-md-6 mb-3 fade-in-card">
      <div
        className="card card-clean-novel h-100"
        onClick={() => onOpenDetail(book)}
      >
        <div className="row g-0 h-100">
          {/* Cover container */}
          <div className="col-4 col-sm-3 p-2 d-flex flex-column justify-content-between">
            <div className="ratio-cover-container">
              <CoverImage
                src={coverUrl}
                className="img-fluid rounded shadow-xs novel-cover-img"
                alt={book.title}
                title={book.title}
                author={book.author}
                loading="lazy"
              />
            </div>
            <div className="mt-2 text-center">
              <span className="badge bg-light text-muted border text-uppercase" style={{ fontSize: '10px' }}>
                {book.language || 'WEB NOVEL'}
              </span>
            </div>
          </div>

          {/* Content info in English */}
          <div className="col-8 col-sm-9 d-flex flex-column">
            <div className="card-body p-3 d-flex flex-column justify-content-between h-100">
              <div>
                <div className="d-flex align-items-center gap-1 mb-1 flex-wrap">
                  <span
                    className={`badge ${
                      rawStatus === 'COMPLETED'
                        ? 'bg-success-subtle text-success border border-success-subtle'
                        : 'bg-info-subtle text-info-emphasis border border-info-subtle'
                    }`}
                    style={{ fontSize: '10px' }}
                  >
                    {rawStatus}
                  </span>
                  <span className={`badge ${lengthInfo.className}`} style={{ fontSize: '10px' }}>
                    {lengthInfo.label}
                  </span>
                  <span className="badge bg-light text-secondary border" style={{ fontSize: '10px' }}>
                    {primaryGenre}
                  </span>
                </div>

                <h6
                  className="card-title fw-bold mb-1"
                  title={book.title}
                  style={{
                    fontSize: '14px',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    wordBreak: 'break-word',
                  }}
                >
                  {book.title}
                </h6>

                {book.original_title && (
                  <p className="text-muted small fst-italic text-truncate mb-1" style={{ fontSize: '11px' }}>
                    {book.original_title}
                  </p>
                )}

                <div className="d-flex align-items-center justify-content-between mb-2">
                  <p className="text-muted mb-0 text-truncate" style={{ fontSize: '11px', maxWidth: '70%' }}>
                    Author: <span className="fw-medium">{book.author || 'Anonymous'}</span>
                  </p>
                  {book.source_url && (
                    <a
                      href={book.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="badge bg-light text-secondary border text-decoration-none rounded-pill px-2 py-0"
                      style={{ fontSize: '9px' }}
                      title="Open Web Source"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Web ↗
                    </a>
                  )}
                </div>

                <p
                  className="card-text text-secondary mb-2"
                  style={{
                    fontSize: '12px',
                    lineHeight: '1.45',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {book.description || 'Digital web novel archive ready for direct download.'}
                </p>
              </div>

              {/* Card footer details & action */}
              <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                <span className="text-muted" style={{ fontSize: '11px' }}>
                  <b>{book.total_chapters}</b> Ch &bull; <b>{book.file_size_mb}</b> MB
                </span>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="btn btn-dark btn-sm rounded-pill px-3 py-1 fw-medium"
                  style={{ fontSize: '11px' }}
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
