import React from 'react';
import { Moon, Sun, Smartphone } from 'lucide-react';

export default function Navbar({ onOpenScan, searchQuery, onSearchChange, onSearchSubmit, readerApps, darkMode, onToggleDark }) {

  return (
    <header className="border-bottom sticky-top shadow-xs" style={{ backgroundColor: 'var(--card-bg)' }}>
      <nav className="navbar navbar-expand-lg py-2">
        <div className="container-fluid px-3 px-md-4">
          {/* Brand Logo & Subtitle */}
          <a className="navbar-brand d-flex align-items-center gap-2 m-0 text-decoration-none" href={import.meta.env.BASE_URL || './'}>
            <img src="/favicon.svg" alt="Read This Logo" width="28" height="28" className="rounded-2 shadow-xs" />
            <span className="badge bg-dark text-white rounded-pill px-3 py-1 fs-6 fw-bold shadow-xs">
              Read This
            </span>
            <span className="text-secondary fw-semibold small d-none d-sm-inline">
              EPUB & Web Novel Hub
            </span>
          </a>

          {/* Right Actions: Reader Apps & Dark Mode Toggle */}
          <div className="d-flex align-items-center gap-2 ms-auto">
            {readerApps && readerApps.length > 0 && (
              <div className="dropdown">
                <button
                  className="btn btn-dark btn-sm rounded-pill px-3 fw-medium dropdown-toggle d-inline-flex align-items-center gap-1 shadow-xs"
                  type="button"
                  id="readerAppsDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  title="Download Reader APK"
                >
                  <Smartphone size={14} />
                  <span>Readers</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 py-2" aria-labelledby="readerAppsDropdown" style={{ minWidth: '240px' }}>
                  <li className="dropdown-header text-uppercase fw-bold" style={{ fontSize: '10px' }}>EPUB Reader Recommendations</li>
                  {readerApps.map((app) => (
                    <li key={app.id}>
                      <a
                        className="dropdown-item py-2 d-flex align-items-center justify-content-between"
                        href={app.download_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <div>
                          <div className="fw-semibold small">{app.name}</div>
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

            {/* Dark Mode Toggle Button */}
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center shadow-xs"
              style={{ width: '34px', height: '34px' }}
              onClick={onToggleDark}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun size={16} className="text-warning" /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
