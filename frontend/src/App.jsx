import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import BookCard from './components/BookCard';
import SkeletonCard from './components/SkeletonCard';
import CoverImage from './components/CoverImage';
import BookModal from './components/BookModal';
import ScanModal from './components/ScanModal';
import Toast from './components/Toast';
import MobileBottomNav from './components/MobileBottomNav';
import NovelFinder from './components/NovelFinder';
import { fetchBooks, fetchGenres, fetchStats, fetchReaderApps, translateTag } from './api';

export default function App() {
  const [books, setBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [stats, setStats] = useState(null);
  const [readerApps, setReaderApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.dataset.theme = 'dark';
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.dataset.theme = 'light';
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Toast Notifications State
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Search & Basic Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState([]); // ['completed', 'ongoing']
  const [selectedLangs, setSelectedLangs] = useState([]); // ['en', 'id']
  const [ordering, setOrdering] = useState('-created_at');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  // WTR-Lab Authentic Tri-State Multi-Select for Genres:
  // state 0: Neutral (off), 1: Include (+), 2: Exclude (-)
  const [genreStates, setGenreStates] = useState({}); // { [slug]: 1 | 2 }

  // Filter expand toggle
  const [filterExpanded, setFilterExpanded] = useState(false);

  // Modals
  const [selectedBook, setSelectedBook] = useState(null);
  const [isScanOpen, setIsScanOpen] = useState(false);

  const PAGE_SIZE = 20;

  // Metadata
  const loadMeta = useCallback(async () => {
    try {
      const [gData, sData, rData] = await Promise.all([fetchGenres(), fetchStats(), fetchReaderApps()]);
      setGenres(gData || []);
      setStats(sData || null);
      setReaderApps(rData || []);
    } catch (err) {
      console.warn('Failed to fetch metadata:', err);
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  // Derived included and excluded genres
  const includedGenres = Object.entries(genreStates)
    .filter(([_, state]) => state === 1)
    .map(([slug]) => slug)
    .join(',');

  const excludedGenres = Object.entries(genreStates)
    .filter(([_, state]) => state === 2)
    .map(([slug]) => slug)
    .join(',');

  // Load books with WTR-Lab query (Infinite Scroll support)
  const loadBooks = useCallback(async (targetPage = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      // Parse advanced search tokens (e.g., "genre:fantasy")
      let search = activeSearch;
      let extraGenres = '';
      const genreMatch = activeSearch.match(/genre:([\w-]+)/i);
      if (genreMatch) {
        extraGenres = genreMatch[1];
        search = activeSearch.replace(genreMatch[0], '').trim();
      }
      const data = await fetchBooks({
        search: search,
        genres: includedGenres ? (includedGenres + (extraGenres ? ',' + extraGenres : '')) : extraGenres,
        exclude_genres: excludedGenres,
        status: selectedStatuses.join(','),
        language: selectedLangs.join(','),
        ordering: ordering,
        page: targetPage,
      });
      const results = data.results || [];
      const count = data.count || 0;
      setTotalCount(count);

      if (append) {
        setBooks((prev) => [...prev, ...results]);
      } else {
        setBooks(results);
      }

      setHasNextPage(targetPage * PAGE_SIZE < count);
    } catch (err) {
      console.warn('Failed to load books:', err);
      setError(err.message || 'Failed to connect to backend server. Please ensure backend is running.');
      if (!append) {
        setBooks([]);
        setTotalCount(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeSearch, includedGenres, excludedGenres, selectedStatuses, selectedLangs, ordering]);

  useEffect(() => {
    setPage(1);
    loadBooks(1, false);
  }, [loadBooks]);

  // Infinite Scroll Intersection Observer
  const sentinelRef = useRef(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasNextPage && !loading && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadBooks(nextPage, true);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [hasNextPage, loading, loadingMore, page, loadBooks]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setActiveSearch(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setActiveSearch(searchQuery);
  };

  // Tri-State cycle: Neutral (0) -> Include (1) -> Exclude (2) -> Neutral (0)
  const cycleGenreState = (slug) => {
    setGenreStates((prev) => {
      const current = prev[slug] || 0;
      const next = (current + 1) % 3;
      const updated = { ...prev };
      if (next === 0) {
        delete updated[slug];
      } else {
        updated[slug] = next;
      }
      return updated;
    });
    setPage(1);
  };

  // Toggle multi-select status / lang
  const toggleItem = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
    setPage(1);
  };

  const resetAllFilters = () => {
    setGenreStates({});
    setSelectedStatuses([]);
    setSelectedLangs([]);
    setSearchQuery('');
    setActiveSearch('');
    setPage(1);
  };

  const activeFilterCount =
    (includedGenres ? includedGenres.split(',').length : 0) +
    (excludedGenres ? excludedGenres.split(',').length : 0) +
    selectedStatuses.length +
    selectedLangs.length +
    (activeSearch ? 1 : 0);

  const carouselBooks = books.slice(0, 6);

  const handleDownloadClick = (book) => {
    showToast(`Downloading "${book.title.slice(0, 30)}..." (${book.file_size_mb} MB)`);
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Navbar */}
      <Navbar
        onOpenScan={() => setIsScanOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        readerApps={readerApps}
        darkMode={darkMode}
        onToggleDark={toggleDarkMode}
      />

      <main className="container-fluid px-3 px-md-5 my-4 flex-grow-1">
        {/* Carousel / Recommendations */}
        {carouselBooks.length > 0 && activeFilterCount === 0 && (
          <div className="row justify-content-center mb-4">
            <div className="col-12 col-xl-10">
              <div className="p-3 rounded-3 border shadow-xs" style={{ backgroundColor: 'var(--card-bg)' }}>
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-dark rounded-pill px-2 py-1">Top</span>
                    <h6 className="fw-bold mb-0">Featured Books</h6>
                  </div>
                  <span className="text-muted small" style={{ fontSize: '11px' }}>
                    Scroll to explore popular titles
                  </span>
                </div>
                <div className="d-flex gap-3 overflow-auto py-1">
                  {carouselBooks.map((b) => (
                    <div
                      key={b.id}
                      className="text-center flex-shrink-0"
                      style={{ width: '120px', cursor: 'pointer' }}
                      onClick={() => setSelectedBook(b)}
                    >
                      <CoverImage
                        src={b.cover || ''}
                        alt={b.title}
                        title={b.title}
                        author={b.author}
                        className="carousel-cover-img"
                      />
                      <p
                        className="small fw-medium mt-2 mb-0 text-start"
                        style={{
                          fontSize: '12px',
                          lineHeight: '1.3',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          height: '2.6em',
                        }}
                        title={b.title}
                      >
                        {b.title}
                      </p>
                      <div className="text-start text-muted" style={{ fontSize: '11px' }}>
                        {b.total_chapters} Ch
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WTR-Lab Novel Finder Bar with Tri-State Multi-Select & Integrated Search */}
        <div className="row justify-content-center mb-4">
          <div className="col-12 col-xl-10">
            <div className="card border rounded-3 p-3 shadow-xs" style={{ backgroundColor: 'var(--card-bg)' }}>
              {/* Integrated Search Box & Quick Controls */}
              <div className="row g-2 align-items-center mb-2 pb-2 border-bottom">
                <div className="col-12 col-md-7">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text border-end-0 text-muted" style={{ backgroundColor: 'var(--input-bg)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </span>
                    <input
                      className="form-control form-control-sm border-start-0"
                      type="search"
                      placeholder="Search by title, author, or keywords..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        type="button"
                        onClick={() => setSearchQuery('')}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="col-12 col-md-5 d-flex align-items-center justify-content-md-end gap-2">
                  {activeFilterCount > 0 && (
                    <span className="badge bg-dark rounded-pill px-2 py-1" style={{ fontSize: '10px' }}>
                      {activeFilterCount} Active
                    </span>
                  )}
                  {activeFilterCount > 0 && (
                    <button
                      className="btn btn-sm btn-link text-danger text-decoration-none p-0 small"
                      style={{ fontSize: '12px' }}
                      onClick={resetAllFilters}
                    >
                      Reset
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 fw-medium"
                    style={{ fontSize: '12px' }}
                    onClick={() => setFilterExpanded(!filterExpanded)}
                  >
                    {filterExpanded ? 'Hide Filters ▲' : 'Filters & Tags ▼'}
                  </button>
                </div>
              </div>

              {/* Status & Sorting bar */}
              <div className="row g-2 align-items-center mt-2 pt-2 border-top">
                <div className="col-12 col-md-5 d-flex align-items-center gap-2">
                  <span className="text-muted small fw-medium" style={{ fontSize: '12px' }}>Order:</span>
                  <select
                    className="form-select form-select-sm rounded-pill px-3 fw-medium"
                    style={{ fontSize: '12px', width: 'auto' }}
                    value={ordering}
                    onChange={(e) => {
                      setOrdering(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="-created_at">Recently Added</option>
                    <option value="-download_count">Most Downloaded</option>
                    <option value="-total_chapters">Most Chapters</option>
                    <option value="title">Title (A - Z)</option>
                    <option value="-file_size_bytes">Largest Size</option>
                  </select>
                </div>

                <div className="col-12 col-md-7 d-flex flex-wrap align-items-center justify-content-md-end gap-1">
                  <span className="text-muted small fw-medium me-1" style={{ fontSize: '12px' }}>Status:</span>
                  <span
                    className={`filter-chip ${selectedStatuses.length === 0 ? 'active' : ''}`}
                    onClick={() => { setSelectedStatuses([]); setPage(1); }}
                  >
                    All
                  </span>
                  <span
                    className={`filter-chip ${selectedStatuses.includes('completed') ? 'active' : ''}`}
                    onClick={() => toggleItem(selectedStatuses, setSelectedStatuses, 'completed')}
                  >
                    Completed
                  </span>
                  <span
                    className={`filter-chip ${selectedStatuses.includes('ongoing') ? 'active' : ''}`}
                    onClick={() => toggleItem(selectedStatuses, setSelectedStatuses, 'ongoing')}
                  >
                    Ongoing
                  </span>

                  <span className="text-muted small fw-medium ms-2 me-1" style={{ fontSize: '12px' }}>Language:</span>
                  <span
                    className={`filter-chip ${selectedLangs.includes('en') ? 'active' : ''}`}
                    onClick={() => toggleItem(selectedLangs, setSelectedLangs, 'en')}
                  >
                    EN
                  </span>
                  <span
                    className={`filter-chip ${selectedLangs.includes('id') ? 'active' : ''}`}
                    onClick={() => toggleItem(selectedLangs, setSelectedLangs, 'id')}
                  >
                    ID
                  </span>
                </div>
              </div>

              {/* WTR-Lab Tri-State Multi-Select Genres Filter */}
              {filterExpanded && (
                <div className="mt-3 pt-3 border-top">
                  <div className="d-flex flex-wrap align-items-center justify-content-between mb-2">
                    <div>
                      <span className="text-muted small fw-bold text-uppercase" style={{ fontSize: '11px' }}>
                        Genre & Tag Filter
                      </span>
                      <span className="text-muted small ms-2" style={{ fontSize: '11px' }}>
                        (Click: <b>Neutral</b> &rarr; <span className="text-success fw-semibold">Include (+)</span> &rarr; <span className="text-danger fw-semibold">Exclude (&minus;)</span>)
                      </span>
                    </div>

                    {(includedGenres.length > 0 || excludedGenres.length > 0) && (
                      <button
                        className="btn btn-link btn-sm text-secondary text-decoration-none p-0"
                        style={{ fontSize: '11px' }}
                        onClick={() => { setGenreStates({}); setPage(1); }}
                      >
                        Clear Genres
                      </button>
                    )}
                  </div>

                  <div className="d-flex flex-wrap gap-1">
                    {genres.map((g) => {
                      const st = genreStates[g.slug] || 0;
                      let chipClass = '';
                      let icon = null;

                      if (st === 1) {
                        chipClass = 'state-include';
                        icon = <span className="fw-bold text-success">+</span>;
                      } else if (st === 2) {
                        chipClass = 'state-exclude';
                        icon = <span className="fw-bold text-danger">&minus;</span>;
                      }

                      return (
                        <span
                          key={g.id}
                          className={`tristate-chip text-capitalize ${chipClass}`}
                          onClick={() => cycleGenreState(g.slug)}
                          title={`${translateTag(g.name)}: ${st === 0 ? 'Click to Include' : st === 1 ? 'Click to Exclude' : 'Click to Reset'}`}
                        >
                          <span className="me-1 opacity-75">{icon}</span>
                          {translateTag(g.name)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Novel Archive Grid */}
        <div className="row justify-content-center">
          <div className="col-12 col-xl-10">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h5 className="fw-bold mb-0">EPUB Novel Library</h5>
                <p className="text-muted small mb-0" style={{ fontSize: '12px' }}>
                  Showing {books.length} of {totalCount} books ready for offline reading
                </p>
              </div>
            </div>

            {error ? (
              <div className="card text-center p-5 border rounded-3 shadow-xs" style={{ backgroundColor: 'var(--card-bg)' }}>
                <div className="mb-3">
                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 rounded-pill" style={{ fontSize: '12px' }}>
                    Connection Error
                  </span>
                </div>
                <h6 className="fw-bold mb-2">Unable to Load Novel Archives</h6>
                <p className="text-muted small mb-3">{error}</p>
                <div>
                  <button className="btn btn-dark btn-sm rounded-pill px-4" onClick={() => loadBooks(1, false)}>
                    Retry Connection
                  </button>
                </div>
              </div>
            ) : loading ? (
              <div className="row">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : books.length > 0 ? (
              <>
                <div className="row">
                  {books.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onOpenDetail={(b) => setSelectedBook(b)}
                      onDownloadClick={handleDownloadClick}
                    />
                  ))}
                </div>

                {/* Infinite Scroll Sentinel */}
                <div ref={sentinelRef} className="py-4 text-center">
                  {loadingMore && (
                    <div className="spinner-border spinner-border-sm text-secondary" role="status">
                      <span className="visually-hidden">Loading more...</span>
                    </div>
                  )}
                  {!hasNextPage && books.length > 0 && (
                    <span className="text-muted small" style={{ fontSize: '11px' }}>
                      &mdash; End of novel archives &mdash;
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="card text-center p-5 border rounded-3 shadow-xs" style={{ backgroundColor: 'var(--card-bg)' }}>
                <h6 className="fw-bold">No Matching Archives Found</h6>
                <p className="text-muted small mb-3">Try adjusting your multi-select criteria or excluded tags.</p>
                <div>
                  <button className="btn btn-dark btn-sm rounded-pill px-4" onClick={resetAllFilters}>
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer mt-auto py-2 border-top text-center text-muted" style={{ fontSize: '11px', backgroundColor: 'var(--footer-bg)' }}>
        <div className="container d-flex flex-column flex-md-row align-items-center justify-content-between gap-2 py-1">
          <span>Read This &copy; 2026 &bull; Digital Web Novel Library</span>
          <div className="d-flex flex-wrap align-items-center justify-content-center gap-2">
            {readerApps && readerApps.length > 0 && (
              <div className="d-flex align-items-center gap-1">
                <span className="text-secondary">Readers:</span>
                {readerApps.map((app) => (
                  <a
                    key={app.id}
                    href={app.download_url}
                    target="_blank"
                    rel="noreferrer"
                    className="badge text-secondary border text-decoration-none py-1 px-2"
                    style={{ fontSize: '10px', backgroundColor: 'var(--input-bg)' }}
                    title={`Download ${app.name} APK`}
                  >
                    📱 {app.name}
                  </a>
                ))}
              </div>
            )}

            <span className="text-secondary">
              UI by{' '}
              <a
                href="https://github.com/taufiq-azr"
                target="_blank"
                rel="noreferrer"
                className="text-decoration-none fw-semibold"
              >
                @taufiq-azr
              </a>
            </span>
          </div>
        </div>
      </footer>

      {/* Book Detail Modal */}
      {selectedBook && (
        <BookModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onDownloadClick={handleDownloadClick}
        />
      )}

      {/* Scan Modal */}
      <ScanModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onScanSuccess={() => {
          loadMeta();
          loadBooks(1, false);
        }}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        darkMode={darkMode}
        onToggleDark={toggleDarkMode}
        onOpenSearch={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
