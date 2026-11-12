// API Client for EPUB Downloader Backend

const BASE_URL = (import.meta.env.VITE_API_URL || 'https://playset-setting-supermom.ngrok-free.dev').replace(/\/$/, '');

// Common headers for Ngrok tunnel support & JSON
const defaultHeaders = {
  'ngrok-skip-browser-warning': 'true',
};

export const fetchBooks = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.genre) query.set('genre', params.genre);
  if (params.genres) query.set('genres', params.genres);
  if (params.exclude_genres) query.set('exclude_genres', params.exclude_genres);
  if (params.status) query.set('status', params.status);
  if (params.language) query.set('language', params.language);
  if (params.author) query.set('author', params.author);
  if (params.ordering) query.set('ordering', params.ordering);
  if (params.page) query.set('page', params.page);

  const res = await fetch(`${BASE_URL}/api/books/?${query.toString()}`, {
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error('Failed to fetch books');
  return await res.json();
};

export const fetchBookDetail = async (id) => {
  const res = await fetch(`${BASE_URL}/api/books/${id}/`, {
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error('Failed to fetch book detail');
  return await res.json();
};

export const fetchGenres = async () => {
  const res = await fetch(`${BASE_URL}/api/genres/`, {
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error('Failed to fetch genres');
  return await res.json();
};

export const fetchStats = async () => {
  const res = await fetch(`${BASE_URL}/api/stats/`, {
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error('Failed to fetch statistics');
  return await res.json();
};

export const fetchReaderApps = async () => {
  const res = await fetch(`${BASE_URL}/api/apps/`, {
    headers: defaultHeaders,
  });
  if (!res.ok) return [];
  return await res.json();
};

export const triggerScan = async (folderPath = '') => {
  const res = await fetch(`${BASE_URL}/api/scan/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    },
    body: JSON.stringify({ folder_path: folderPath }),
  });
  if (!res.ok) throw new Error('Failed to trigger scan');
  return await res.json();
};

export const getDownloadUrl = (id) => {
  return `${BASE_URL}/api/books/${id}/download/`;
};

export const getAdminAddUrl = () => {
  const adminBase = import.meta.env.VITE_ADMIN_URL || 'http://127.0.0.1:8000';
  return `${adminBase.replace(/\/$/, '')}/admin/books/epubbook/add/`;
};

export const getAdminUrl = () => {
  const adminBase = import.meta.env.VITE_ADMIN_URL || 'http://127.0.0.1:8000';
  return `${adminBase.replace(/\/$/, '')}/admin/`;
};
