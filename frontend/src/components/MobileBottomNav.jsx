import React from 'react';
import { Home, Search, Moon, Sun, ArrowUp } from 'lucide-react';

export default function MobileBottomNav({ darkMode, onToggleDark, onOpenSearch }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mobile-bottom-nav d-md-none fixed-bottom bg-white border-top shadow-lg py-2 px-3 align-items-center justify-content-around">
      <button
        type="button"
        className="btn btn-link text-dark text-decoration-none d-flex flex-column align-items-center p-0"
        style={{ fontSize: '10px' }}
        onClick={scrollToTop}
      >
        <Home size={18} />
        <span>Home</span>
      </button>

      <button
        type="button"
        className="btn btn-link text-dark text-decoration-none d-flex flex-column align-items-center p-0"
        style={{ fontSize: '10px' }}
        onClick={() => {
          scrollToTop();
          if (onOpenSearch) onOpenSearch();
        }}
      >
        <Search size={18} />
        <span>Search</span>
      </button>

      <button
        type="button"
        className="btn btn-link text-dark text-decoration-none d-flex flex-column align-items-center p-0"
        style={{ fontSize: '10px' }}
        onClick={onToggleDark}
      >
        {darkMode ? <Sun size={18} className="text-warning" /> : <Moon size={18} />}
        <span>{darkMode ? 'Light' : 'Dark'}</span>
      </button>

      <button
        type="button"
        className="btn btn-link text-dark text-decoration-none d-flex flex-column align-items-center p-0"
        style={{ fontSize: '10px' }}
        onClick={scrollToTop}
      >
        <ArrowUp size={18} />
        <span>Top</span>
      </button>
    </div>
  );
}
