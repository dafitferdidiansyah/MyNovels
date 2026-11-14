import React, { useState } from 'react';
import { getDownloadUrl, downloadBookFile, translateTag, normalizeCoverUrl } from '../api';
import CoverImage from './CoverImage';
import { getReadingLength } from './BookCard';

export default function BookModal({ book, onClose, onDownloadClick }) {
  if (!book) return null;

  const [activeTab, setActiveTab] = useState('info');
  const [downloading, setDownloading] = useState(false);
  const [downloadingRange, setDownloadingRange] = useState(null);

  const coverUrl = normalizeCoverUrl(book.cover);
  const genres = Array.isArray(book.genres) ? book.genres : [];
  const rawStatus = (book.status || 'Completed').toUpperCase();
  const lengthInfo = getReadingLength(book.total_chapters);

  const totalCh = Number(book.total_chapters) || 0;
  const BATCH_SIZE = 50;
  const batches = [];
  if (totalCh > BATCH_SIZE) {
    for (let s = 1; s <= totalCh; s += BATCH_SIZE) {
      const e = Math.min(s + BATCH_SIZE - 1, totalCh);
      batches.push({
        start: s,
        end: e,
        label: `Ch ${String(s).padStart(3, '0')} - ${String(e).padStart(3, '0')}`,
        count: e - s + 1,
      });
    }
  }

  const handleDownload = async () => {
    if (onDownloadClick) {
      onDownloadClick(book);
    }
    setDownloading(true);
    try {
      await downloadBookFile(book.id, book.title);
    } finally {
      setDownloading(false);
    }
  };

  const handleBatchDownload = async (batch) => {
    setDownloadingRange(batch.label);
    try {
      await downloadBookFile(book.id, `${book.title} (${batch.label})`, batch);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingRange(null);
    }
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
        style={{ maxWidth: '780px', width: '95%' }}
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
                type="button"
                className={`nav-link ${activeTab === 'info' ? 'active fw-bold' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                Overview
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${activeTab === 'synopsis' ? 'active fw-bold' : ''}`}
                onClick={() => setActiveTab('synopsis')}
              >
                Synopsis
              </button>
            </li>
            {batches.length > 0 && (
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${activeTab === 'batches' ? 'active fw-bold' : ''}`}
                  onClick={() => setActiveTab('batches')}
                >
                  Volumes / Batches <span className="badge bg-secondary-subtle text-secondary border ms-1" style={{ fontSize: '9.5px' }}>{batches.length}</span>
                </button>
              </li>
            )}
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
                      title={book.title}
                      author={book.author}
                    />
                  </div>
                  <div className="mt-2">
                    <span className="badge bg-light text-muted border text-uppercase" style={{ fontSize: '9px' }}>
                      {book.language || 'WEB NOVEL'}
                    </span>
                  </div>
                </div>

                {/* Novel Information */}
                <div className="col-8 d-flex flex-column justify-content-between">
                  <div>
                    {/* Status & Chapters Row */}
                    <div className="d-flex align-items-center gap-1 mb-2 flex-wrap">
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

                    {/* Main Title */}
                    <h5
                      className="fw-bold mb-1 text-dark"
                      style={{
                        fontSize: '15px',
                        lineHeight: '1.4',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                      }}
                    >
                      {book.title}
                    </h5>

                    {/* Original Japanese Title (kecil & rapi) */}
                    {book.original_title && (
                      <p
                        className="text-muted small fst-italic mb-2"
                        style={{
                          fontSize: '11px',
                          lineHeight: '1.35',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        {book.original_title}
                      </p>
                    )}

                    {/* Author & Web Source */}
                    <div className="d-flex align-items-center gap-2 mb-2 flex-wrap" style={{ fontSize: '11.5px' }}>
                      <span className="text-secondary">
                        Author: <b className="text-dark">{book.author || 'Anonymous'}</b>
                      </span>
                      {book.source_url && (
                        <a
                          href={book.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline-secondary btn-sm rounded-pill px-2 py-0 d-inline-flex align-items-center gap-1 text-decoration-none"
                          style={{ fontSize: '10px' }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                          Web Source
                        </a>
                      )}
                    </div>

                    {/* Tags (Filtered & Clean) */}
                    <div className="d-flex flex-wrap gap-1 mb-2">
                      {genres.filter(g => {
                        const name = typeof g === 'object' ? g.name : String(g);
                        if (!name || name.length > 30 || name.includes('\n')) return false;
                        if (/["'“”「」『』!?！？*\/…~→\\]/.test(name)) return false;
                        const lower = name.toLowerCase();
                        const junk = [
                          'published', 'reposted', 'magnet', 'other site', 'thank you', 'understanding',
                          'good day', 'hello', 'everyone', 'not so bad', 'teen 15+', 'r15', 'violence',
                          'gore', 'award', 'prize', '大賞', 'contest', 'cruelty', 'original', 'second life begins',
                          'am i the', 'live normally'
                        ];
                        return !junk.some(j => lower.includes(j));
                      }).map((g, idx) => (
                        <span key={idx} className="badge bg-light text-secondary border fw-normal" style={{ fontSize: '9.5px' }}>
                          {translateTag(g)}
                        </span>
                      ))}
                    </div>

                    {/* Synopsis Preview */}
                    {book.description && (
                      <div className="mt-2 pt-2 border-top">
                        <p
                          className="text-secondary mb-1"
                          style={{
                            fontSize: '11.5px',
                            lineHeight: '1.5',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {book.description}
                        </p>
                        <button
                          type="button"
                          className="btn btn-link p-0 text-decoration-none fw-semibold"
                          style={{ fontSize: '11px' }}
                          onClick={() => setActiveTab('synopsis')}
                        >
                          Read full synopsis &rarr;
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-muted small mt-2" style={{ fontSize: '11px' }}>
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

            {activeTab === 'batches' && (
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-bold text-uppercase" style={{ fontSize: '10.5px' }}>
                    MeGaneBuk Standard Arc Batches (50 Ch / Batch)
                  </span>
                  <span className="text-muted" style={{ fontSize: '11px' }}>
                    Total: <b>{book.total_chapters}</b> Chapters
                  </span>
                </div>
                <div className="table-responsive rounded border" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  <table className="table table-hover table-sm align-middle mb-0" style={{ fontSize: '12px' }}>
                    <thead className="table-light">
                      <tr>
                        <th className="px-3 py-1 font-monospace">Range</th>
                        <th className="py-1">Chapters</th>
                        <th className="text-end px-3 py-1">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches.map((b, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-1 fw-bold font-monospace text-dark">
                            {b.label}
                          </td>
                          <td className="py-1 text-secondary">
                            {b.count} chapters
                          </td>
                          <td className="text-end px-3 py-1">
                            <button
                              type="button"
                              className="btn btn-dark btn-sm rounded-pill px-2 py-0 fw-medium d-inline-flex align-items-center gap-1 shadow-xs"
                              style={{ fontSize: '10.5px' }}
                              onClick={() => handleBatchDownload(b)}
                              disabled={downloadingRange === b.label}
                            >
                              {downloadingRange === b.label ? (
                                <>
                                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '9px', height: '9px' }}></span>
                                  Packaging...
                                </>
                              ) : (
                                <>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                  Download Part
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="modal-footer px-3 py-2 d-flex align-items-center justify-content-between">
            <span className="text-muted" style={{ fontSize: '11px' }}>
              <b>{book.total_chapters}</b> Ch &bull; <b>{book.file_size_mb} MB</b> &bull; Downloads: <b>{book.download_count}x</b>
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
                className="btn btn-dark btn-sm rounded-pill px-3 py-1 fw-medium d-inline-flex align-items-center gap-1 shadow-sm"
                style={{ fontSize: '11px' }}
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '11px', height: '11px' }}></span>
                    Downloading...
                  </>
                ) : (
                  <>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Download EPUB ({book.file_size_mb} MB)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
