import React, { useState } from 'react';
import { triggerScan } from '../api';

export default function ScanModal({ isOpen, onClose, onScanSuccess }) {
  const [folderPath, setFolderPath] = useState('C:\\Users\\Dafit Fernandus\\Downloads');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleStartScan = async (e) => {
    e.preventDefault();
    if (!folderPath.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await triggerScan(folderPath.trim());
      setResult(res);
      if (onScanSuccess) onScanSuccess();
    } catch (err) {
      setError(err.message || 'Failed to scan folder.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          <div className="modal-header bg-dark text-white px-4 py-3">
            <h5 className="modal-title fs-6 fw-bold">Scan Local EPUB Directory</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              aria-label="Close"
              onClick={onClose}
            ></button>
          </div>

          <form onSubmit={handleStartScan}>
            <div className="modal-body p-4">
              <p className="text-secondary small mb-3">
                Specify a directory containing <code>.epub</code> files. Metadata, chapters, and cover images will be extracted automatically.
              </p>

              <div className="mb-3">
                <label className="form-label small fw-bold text-dark">Directory Path:</label>
                <input
                  id="scan-directory-path"
                  name="scan-directory-path"
                  type="text"
                  required
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  placeholder="C:\Users\...\Downloads"
                  className="form-control form-control-sm font-monospace rounded-3"
                />
              </div>

              {error && (
                <div className="alert alert-danger small py-2 mb-3 rounded-3">
                  {error}
                </div>
              )}

              {result && (
                <div className="alert alert-success small py-2 mb-3 rounded-3">
                  <p className="fw-bold mb-1">Scan Complete:</p>
                  <div>Scanned Files: <b>{result.scanned}</b></div>
                  <div>Added Novels: <b>{result.added}</b></div>
                  <div>Updated Novels: <b>{result.updated}</b></div>
                </div>
              )}
            </div>

            <div className="modal-footer bg-light px-4 py-3">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary btn-sm rounded-pill px-3"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-dark btn-sm fw-bold px-4 rounded-pill"
              >
                {loading ? 'Scanning...' : 'Start Scan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
