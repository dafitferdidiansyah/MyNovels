import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="col-12 col-md-6 mb-3">
      <div className="card card-clean-novel h-100 bg-white placeholder-glow">
        <div className="row g-0 h-100">
          <div className="col-4 col-sm-3 p-2 d-flex flex-column justify-content-between">
            <div className="ratio-cover-container bg-light placeholder rounded"></div>
            <div className="mt-2 text-center">
              <span className="placeholder bg-secondary rounded w-100 d-inline-block" style={{ height: '14px' }}></span>
            </div>
          </div>
          <div className="col-8 col-sm-9 d-flex flex-column">
            <div className="card-body p-3 d-flex flex-column justify-content-between h-100">
              <div>
                <div className="d-flex align-items-center gap-1 mb-2">
                  <span className="placeholder bg-secondary rounded" style={{ width: '55px', height: '14px' }}></span>
                  <span className="placeholder bg-secondary rounded" style={{ width: '45px', height: '14px' }}></span>
                </div>
                <span className="placeholder bg-secondary rounded w-100 d-block mb-1" style={{ height: '16px' }}></span>
                <span className="placeholder bg-secondary rounded w-75 d-block mb-2" style={{ height: '16px' }}></span>
                <span className="placeholder bg-secondary rounded w-50 d-block mb-2" style={{ height: '11px' }}></span>
                <span className="placeholder bg-secondary rounded w-100 d-block mb-1" style={{ height: '12px' }}></span>
                <span className="placeholder bg-secondary rounded w-85 d-block mb-2" style={{ height: '12px' }}></span>
              </div>
              <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                <span className="placeholder bg-secondary rounded" style={{ width: '65px', height: '12px' }}></span>
                <span className="placeholder bg-secondary rounded-pill" style={{ width: '75px', height: '26px' }}></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
