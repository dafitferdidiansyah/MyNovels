import React from 'react';
import { BookOpen, Layers, SortAsc, Filter, X, SlidersHorizontal, Check } from 'lucide-react';

export default function Sidebar({
  isOpen,
  onClose,
  genres,
  selectedGenre,
  onSelectGenre,
  selectedStatus,
  onSelectStatus,
  selectedLang,
  onSelectLang,
  ordering,
  onOrderingChange,
  totalCount,
}) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-30 w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-5 overflow-y-auto transition-transform duration-200 lg:translate-x-0 font-sans ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 lg:hidden">
          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-emerald-600" /> Novel Finder Filter
          </span>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
            <X className="size-5" />
          </button>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold text-sm">
            <SlidersHorizontal className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>Novel Finder</span>
          </div>
          {(selectedGenre || selectedStatus || selectedLang) && (
            <button
              onClick={() => {
                onSelectGenre('');
                onSelectStatus('');
                onSelectLang('');
              }}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Sort Options */}
        <div className="mb-5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 mb-2">
            <SortAsc className="size-3.5 text-emerald-600 dark:text-emerald-400" /> Urutkan Berdasarkan
          </label>
          <select
            value={ordering}
            onChange={(e) => onOrderingChange(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 outline-none focus:border-emerald-500 cursor-pointer font-medium"
          >
            <option value="-created_at">Terbaru Ditambahkan</option>
            <option value="-download_count">Paling Banyak Diunduh</option>
            <option value="-total_chapters">Jumlah Bab Terbanyak</option>
            <option value="title">Judul (A - Z)</option>
            <option value="-file_size_bytes">Ukuran Terbesar</option>
          </select>
        </div>

        {/* Status Filter (WTR-Lab parity) */}
        <div className="mb-5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2 block">
            Status Publikasi
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: 'Semua', val: '' },
              { label: 'Completed', val: 'completed' },
              { label: 'Ongoing', val: 'ongoing' },
            ].map((st) => (
              <button
                key={st.val}
                type="button"
                onClick={() => onSelectStatus(st.val)}
                className={`py-1.5 px-2 text-xs rounded-lg border text-center transition-all cursor-pointer font-medium ${
                  selectedStatus === st.val
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-emerald-600 dark:border-emerald-600'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Language Filter */}
        <div className="mb-5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2 block">
            Bahasa ePub
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: 'Semua', val: '' },
              { label: 'EN', val: 'en' },
              { label: 'ID', val: 'id' },
            ].map((lg) => (
              <button
                key={lg.val}
                type="button"
                onClick={() => onSelectLang(lg.val)}
                className={`py-1.5 px-2 text-xs rounded-lg border text-center transition-all cursor-pointer font-medium ${
                  selectedLang === lg.val
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-emerald-600 dark:border-emerald-600'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {lg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories / Genres (Novel Finder Tag Filter) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Layers className="size-3.5 text-emerald-600 dark:text-emerald-400" /> Genre / Tag ({genres.length})
            </label>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => onSelectGenre('')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                !selectedGenre
                  ? 'bg-zinc-900 text-white font-semibold dark:bg-emerald-600'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <span>Semua Koleksi</span>
              <span className="text-[11px] opacity-75">{totalCount}</span>
            </button>

            {genres.map((g) => (
              <button
                key={g.id}
                onClick={() => onSelectGenre(g.slug)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                  selectedGenre === g.slug
                    ? 'bg-zinc-900 text-white font-semibold dark:bg-emerald-600'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <span className="truncate text-left capitalize">{g.name}</span>
                <span className="text-[11px] opacity-75 ml-1">{g.books_count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Read This Info Banner */}
        <div className="mt-8 p-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          <p className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Read This Hub</p>
          Koleksi web novel dan serial terjemahan digital dalam format EPUB berkualitas dengan metadata terverifikasi.
        </div>
      </aside>
    </>
  );
}
