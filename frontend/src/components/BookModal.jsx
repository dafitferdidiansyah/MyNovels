import React, { useState } from 'react';
import { getDownloadUrl } from '../api';
import CoverImage from './CoverImage';
import { getReadingLength } from './BookCard';

export default function BookModal({ book, onClose, onDownloadClick }) {
  if (!book) return null;

  const [activeTab, setActiveTab] = useState('info');

  const coverUrl = book.cover || '';
  const genres = Array.isArray(book.genres) ? book.genres : [];
  const rawStatus = (book.status || 'Completed').toUpperCase();
  const lengthInfo = getReadingLength(book.total_chapters);

  const handleDownload = () => {
    if (onDownloadClick) {
      onDownloadClick(book);
    }
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
        style={{ maxWidth: '580px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden" style={{ backgroundColor: 'var(--card-bg)' }}>
          {/* Header */}
          <div className="modal-header border-bottom px-3 py-2">
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

          {/* Nav Tabs */}
          <ul className="nav nav-tabs px-3 pt-2 border-bottom" style={{ fontSize: '12px' }}>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'info' ? 'active fw-bold' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                Info
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'synopsis' ? 'active fw-bold' : ''}`}
                onClick={() => setActiveTab('synopsis')}
              >
                Synopsis
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'download' ? 'active fw-bold' : ''}`}
                onClick={() => setActiveTab('download')}
              >
                Download ({book.file_size_mb} MB)
              </button>
            </li>
          </ul>

          <div className="modal-body p-3">
            {activeTab === 'info' && (
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
                    <div className="d-flex align-items-center gap-1 mb-1 flex-wrap">
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
                      <span className={`badge ${lengthInfo.className}`} style={{ fontSize: '9.5px' }}>
                        {lengthInfo.label}
                      </span>
                      <span className="text-muted" style={{ fontSize: '11px' }}>
                        &bull; {book.total_chapters} Chapters
                      </span>
                    </div>

                    <h6 className="fw-bold mb-1" style={{ fontSize: '14.5px', lineHeight: '1.3' }}>
                      {book.title}
                    </h6>

                    {book.original_title && (
                      <p className="text-muted small fst-italic mb-1 text-truncate" style={{ fontSize: '11px' }} title={book.original_title}>
                        {book.original_title}
                      </p>
                    )}

                    <p className="text-secondary mb-2" style={{ fontSize: '11.5px' }}>
                      Author: <span className="fw-semibold">{book.author || 'Anonymous'}</span>
                    </p>

                    {/* Raw Source Link */}
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
                      {genres.map((g, idx) => (
                        <span key={idx} className="badge bg-light text-secondary border fw-normal" style={{ fontSize: '9.5px' }}>
                          {typeof g === 'object' ? g.name : g}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-muted small" style={{ fontSize: '11px' }}>
                    Size: <b>{book.file_size_mb} MB</b> &bull; Chars: <b>{book.chars_display || '-'}</b>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'synopsis' && (
              <div>
                <span className="text-muted small fw-bold text-uppercase d-block mb-2" style={{ fontSize: '10.5px' }}>
                  Complete Synopsis
                </span>
                <div
                  className="p-3 bg-light rounded text-secondary"
                  style={{
                    maxHeight: '260px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-line',
                    fontSize: '12px',
                    lineHeight: '1.55',
                  }}
                >
                  {book.description || 'No synopsis embedded in this ePub.'}
                </div>
              </div>
            )}

            {activeTab === 'download' && (
              <div className="text-center py-3">
                <div className="mb-3">
                  <span className="badge bg-dark rounded-pill px-3 py-2 fs-6">
                    {book.file_size_mb} MB EPUB Archive
                  </span>
                </div>
                <p className="text-secondary small mb-3">
                  Optimized for Moon+ Reader, Kindle, Apple Books, and e-readers. Total downloads: <b>{book.download_count}x</b>
                </p>
                <button
                  type="button"
                  className="btn btn-dark btn-lg rounded-pill px-5 fw-medium shadow-sm"
                  style={{ fontSize: '13px' }}
                  onClick={handleDownload}
                >
                  Download EPUB Now
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="modal-footer px-3 py-2 d-flex align-items-center justify-content-between">
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
                Download EPUB
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
