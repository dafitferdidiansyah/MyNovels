// API Client for EPUB Downloader Backend

const BASE_URL = (import.meta.env.VITE_API_URL || 'https://playset-setting-supermom.ngrok-free.dev').replace(/\/$/, '');

// Common headers for Ngrok tunnel support & JSON
const defaultHeaders = {
  'ngrok-skip-browser-warning': 'true',
};

// Translation lookup map for Japanese tags
export const TAG_MAP = {
  '異世界': 'Isekai',
  '異世界転生': 'Isekai Reincarnation',
  '異世界転移': 'Isekai Summoning',
  '転生': 'Reincarnation',
  '転移': 'Summoning / Transmigration',
  '主人公最強': 'Overpowered Protagonist',
  '最強': 'Overpowered',
  '無双': 'Overpowered',
  '勘違い': 'Misunderstanding',
  'チート': 'Cheat Ability',
  'ファンタジー': 'Fantasy',
  'ハイファンタジー': 'High Fantasy',
  'ローファンタジー': 'Urban Fantasy',
  'SF': 'Sci-Fi',
  'コメディ': 'Comedy',
  'ギャグ': 'Comedy',
  'ラブコメ': 'RomCom',
  '恋愛': 'Romance',
  'ざまぁ': 'Revenge',
  '復讐': 'Revenge',
  '追放': 'Banished / Exiled',
  '悪役令嬢': 'Villainess',
  'TS': 'Gender Bender',
  '性転換': 'Gender Bender',
  '女主人公': 'Female Protagonist',
  '男主人公': 'Male Protagonist',
  '日常': 'Slice of Life',
  'ほのぼの': 'Slice of Life',
  '冒険': 'Adventure',
  'ダンジョン': 'Dungeon',
  '魔法': 'Magic',
  'ステータス': 'Status / LitRPG',
  'ゲーム': 'LitRPG / Game',
  'スキル': 'Skills / Progression',
  '学園': 'School Life',
  'ハーレム': 'Harem',
  'スローライフ': 'Slow Life',
  'ダーク': 'Dark Fantasy',
  '生産': 'Crafting / Production',
  '錬金術': 'Alchemy',
  'もふもふ': 'Fluffy / Cute',
  'ミリタリー': 'Military',
  'ネット小説大賞': 'Award Winner',
  '書籍化': 'Light Novel Adaptation',
  'アニメ化': 'Anime Adaptation',
  'コミカライズ': 'Manga Adaptation',
  '完結済': 'Completed',
  '連載中': 'Ongoing',
  'R15': 'Teen 15+',
  '残酷な描写あり': 'Gore / Violence',
  'オリジナル': 'Original',
};

export const translateTag = (tag) => {
  if (!tag) return '';
  const str = typeof tag === 'object' ? (tag.name || '') : String(tag);
  if (TAG_MAP[str]) return TAG_MAP[str];
  for (const [k, v] of Object.entries(TAG_MAP)) {
    if (str.includes(k)) return v;
  }
  return str;
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
