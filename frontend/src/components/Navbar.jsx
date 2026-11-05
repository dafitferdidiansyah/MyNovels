import React from 'react';
import { getAdminAddUrl } from '../api';

export default function Navbar({ onOpenScan, searchQuery, onSearchChange, onSearchSubmit, readerApps }) {
  const adminAddUrl = getAdminAddUrl();

  return (
    <header className="border-bottom bg-white sticky-top shadow-xs">
      <nav className="navbar navbar-expand-lg navbar-light py-2">
        <div className="container-fluid px-3 px-md-4">
          {/* Brand Logo & Subtitle */}
          <a className="navbar-brand d-flex align-items-center gap-2 m-0 text-decoration-none" href={import.meta.env.BASE_URL || './'}>
            <span className="badge bg-dark text-white rounded-pill px-3 py-1 fs-6 fw-bold shadow-xs">
              Read This
            </span>
            <span className="text-secondary fw-semibold small d-none d-sm-inline">
              EPUB & Web Novel Hub
            </span>
          </a>

          {/* Quick Search in English */}
          <form className="d-flex mx-auto col-12 col-md-5 my-2 my-md-0" onSubmit={onSearchSubmit}>
            <div className="input-group input-group-sm w-100">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
              <input
                className="form-control form-control-sm bg-light border-start-0"
                type="search"
                placeholder="Search novel title, raw original, or author..."
                aria-label="Search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </form>

          {/* Right Actions: Reader Apps & Admin Panel */}
          <div className="d-flex align-items-center gap-2">
            {readerApps && readerApps.length > 0 && (
              <div className="dropdown">
                <button
                  className="btn btn-dark btn-sm rounded-pill px-3 fw-medium dropdown-toggle d-inline-flex align-items-center gap-1 shadow-xs"
                  type="button"
                  id="readerAppsDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  title="Download Aplikasi Reader (Moon+ Reader Pro, dll)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                  <span>Download Reader APK</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 py-2" aria-labelledby="readerAppsDropdown" style={{ minWidth: '240px' }}>
                  <li className="dropdown-header text-uppercase fw-bold" style={{ fontSize: '10px' }}>Rekomendasi EPUB Reader</li>
                  {readerApps.map((app) => (
                    <li key={app.id}>
                      <a
                        className="dropdown-item py-2 d-flex align-items-center justify-content-between"
                        href={app.download_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <div>
                          <div className="fw-semibold text-dark small">{app.name}</div>
                          {app.version && <div className="text-muted" style={{ fontSize: '11px' }}>{app.version} {app.file_size_mb > 0 ? `• ${app.file_size_mb} MB` : ''}</div>}
                        </div>
                        <span className="badge bg-light text-primary border rounded-pill px-2 py-1 ms-2" style={{ fontSize: '10px' }}>
                          APK ⬇
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <a
              href={`${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/admin/`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline-dark btn-sm rounded-pill px-3 fw-medium d-inline-flex align-items-center gap-1 shadow-xs"
              title="Open Admin Dashboard"
            >
              ⚙ Admin Panel
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}
