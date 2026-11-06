import React, { useState } from 'react';
import BookCard from './BookCard';

export default function NovelFinder({ books }) {
  const [query, setQuery] = useState('');
  const filtered = books.filter((b) => {
    const lower = query.toLowerCase();
    return (
      b.title?.toLowerCase().includes(lower) ||
      b.author?.toLowerCase().includes(lower) ||
      b.original_title?.toLowerCase().includes(lower)
    );
  });

  return (
    <div className="novel-finder my-4">
      <input
        type="search"
        className="form-control mb-3"
        placeholder="Find novel by title, author, or original..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="row">
        {filtered.map((book) => (
          <BookCard key={book.id} book={book} onOpenDetail={() => {}} onDownloadClick={() => {}} />
        ))}
        {filtered.length === 0 && (
          <div className="col-12 text-center text-muted">No matches</div>
        )}
      </div>
    </div>
  );
}
