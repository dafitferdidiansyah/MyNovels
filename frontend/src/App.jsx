import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import BookCard from './components/BookCard';
import SkeletonCard from './components/SkeletonCard';
import CoverImage from './components/CoverImage';
import BookModal from './components/BookModal';
import ScanModal from './components/ScanModal';
import { fetchBooks, fetchGenres, fetchStats, fetchReaderApps } from './api';

export default function App() {
  const [books, setBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [stats, setStats] = useState(null);
  const [readerApps, setReaderApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Basic Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState([]); // ['completed', 'ongoing']
  const [selectedLangs, setSelectedLangs] = useState([]); // ['en', 'id']
  const [ordering, setOrdering] = useState('-created_at');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // WTR-Lab Authentic Tri-State Multi-Select for Genres:
  // state 0: Neutral (off), 1: Include (+), 2: Exclude (-)
  const [genreStates, setGenreStates] = useState({}); // { [slug]: 1 | 2 }

  // Filter expand toggle
  const [filterExpanded, setFilterExpanded] = useState(false);

  // Modals
  const [selectedBook, setSelectedBook] = useState(null);
  const [isScanOpen, setIsScanOpen] = useState(false);

  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

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

  // Load books with WTR-Lab query
  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBooks({
        search: activeSearch,
        genres: includedGenres,
        exclude_genres: excludedGenres,
        status: selectedStatuses.join(','),
        language: selectedLangs.join(','),
        ordering: ordering,
        page: page,
      });
      setBooks(data.results || []);
      setTotalCount(data.count || 0);
    } catch (err) {
      console.warn('Failed to load books:', err);
      setError(err.message || 'Failed to connect to backend server. Please ensure backend is running.');
      setBooks([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [activeSearch, includedGenres, excludedGenres, selectedStatuses, selectedLangs, ordering, page]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setActiveSearch(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setActiveSearch(searchQuery);
    setPage(1);
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

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* English Navbar */}
      <Navbar
        onOpenScan={() => setIsScanOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        readerApps={readerApps}
      />

      <main className="container-fluid px-3 px-md-5 my-4 flex-grow-1">
        {/* Carousel / Recommendations */}
        {carouselBooks.length > 0 && activeFilterCount === 0 && (
          <div className="row justify-content-center mb-4">
            <div className="col-12 col-xl-10">
              <div className="p-3 bg-white rounded-3 border shadow-xs">
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-dark rounded-pill px-2 py-1">Top</span>
                    <h6 className="fw-bold mb-0 text-dark">Featured Books</h6>
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
                        className="carousel-cover-img"
                      />
                      <p
                        className="small fw-medium mt-2 mb-0 text-dark text-start"
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

        {/* WTR-Lab Novel Finder Bar with Tri-State Multi-Select */}
        <div className="row justify-content-center mb-4">
          <div className="col-12 col-xl-10">
            <div className="card border rounded-3 p-3 bg-white shadow-xs">
              {/* Header */}
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold text-dark fs-6">Novel Finder</span>
                  {activeFilterCount > 0 && (
                    <span className="badge bg-dark rounded-pill px-2 py-1" style={{ fontSize: '10px' }}>
                      {activeFilterCount} Active
                    </span>
                  )}
                </div>

                <div className="d-flex align-items-center gap-2">
                  {activeFilterCount > 0 && (
                    <button
                      className="btn btn-sm btn-link text-danger text-decoration-none p-0 small"
                      style={{ fontSize: '12px' }}
                      onClick={resetAllFilters}
                    >
                      Reset All
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1"
                    style={{ fontSize: '12px' }}
                    onClick={() => setFilterExpanded(!filterExpanded)}
                  >
                    {filterExpanded ? 'Hide Filters ▲' : 'Advanced Filters ▼'}
                  </button>
                </div>
              </div>

              {/* Status & Sorting bar */}
              <div className="row g-2 align-items-center mt-2 pt-2 border-top">
                <div className="col-12 col-md-5 d-flex align-items-center gap-2">
                  <span className="text-muted small fw-medium" style={{ fontSize: '12px' }}>Order:</span>
                  <select
                    className="form-select form-select-sm border-0 bg-light rounded-pill px-3 fw-medium"
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
                          title={`${g.name}: ${st === 0 ? 'Click to Include' : st === 1 ? 'Click to Exclude' : 'Click to Reset'}`}
                        >
                          {icon}
                          {g.name}
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
                <h5 className="fw-bold text-dark mb-0">EPUB Novel Library</h5>
                <p className="text-muted small mb-0" style={{ fontSize: '12px' }}>
                  Total {totalCount} books ready for offline reading
                </p>
              </div>
            </div>

            {error ? (
              <div className="card text-center p-5 border rounded-3 bg-white shadow-xs">
                <div className="mb-3">
                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 rounded-pill" style={{ fontSize: '12px' }}>
                    Connection Error
                  </span>
                </div>
                <h6 className="fw-bold text-dark mb-2">Unable to Load Novel Archives</h6>
                <p className="text-muted small mb-3">{error}</p>
                <div>
                  <button className="btn btn-dark btn-sm rounded-pill px-4" onClick={loadBooks}>
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
              <div className="row">
                {books.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onOpenDetail={(b) => setSelectedBook(b)}
                  />
                ))}
              </div>
            ) : (
              <div className="card text-center p-5 border rounded-3 bg-white shadow-xs">
                <h6 className="fw-bold text-dark">No Matching Archives Found</h6>
                <p className="text-muted small mb-3">Try adjusting your multi-select criteria or excluded tags.</p>
                <div>
                  <button className="btn btn-dark btn-sm rounded-pill px-4" onClick={resetAllFilters}>
                    Reset Filters
                  </button>
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav aria-label="Page navigation" className="mt-4">
                <ul className="pagination pagination-sm justify-content-center gap-1">
                  <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link rounded-pill border-0 px-3 text-dark bg-white shadow-xs"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      &larr; Prev
                    </button>
                  </li>
                  <li className="page-item disabled">
                    <span className="page-link border-0 text-muted bg-transparent">
                      {page} / {totalPages}
                    </span>
                  </li>
                  <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link rounded-pill border-0 px-3 text-dark bg-white shadow-xs"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next &rarr;
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </div>
      </main>

      {/* Footer with clean credits */}
      <footer className="footer mt-auto py-2 bg-white border-top text-center text-muted" style={{ fontSize: '11px' }}>
        <div className="container d-flex flex-column flex-md-row align-items-center justify-content-between gap-2 py-1">
          <span>Read This &copy; 2026 &bull; Direct EPUB Downloader</span>
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
                    className="badge bg-light text-dark border text-decoration-none py-1 px-2"
                    style={{ fontSize: '10px' }}
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
                className="text-decoration-none fw-semibold text-dark"
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
        />
      )}

      {/* Scan Modal */}
      <ScanModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onScanSuccess={() => {
          loadMeta();
          loadBooks();
        }}
      />
    </div>
  );
}
