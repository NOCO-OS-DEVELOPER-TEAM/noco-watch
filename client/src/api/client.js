async function request(path, options = {}) {
  const base =
    (typeof window !== 'undefined' && window.nocoDesktop?.apiBase) || '';
  const res = await fetch(`${base}${path}`, {
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return res.json();
}

function mediaUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const base =
    (typeof window !== 'undefined' && window.nocoDesktop?.apiBase) || '';
  return `${base}${path}`;
}

export const api = {
  health: () => request('/api/health'),
  system: () => request('/api/system'),
  videos: () => request('/api/videos'),
  video: (id) => request(`/api/videos/${encodeURIComponent(id)}`),
  search: (q, { genre = 'all', type = 'all' } = {}) =>
    request(
      `/api/search?q=${encodeURIComponent(q)}&genre=${encodeURIComponent(genre)}&type=${encodeURIComponent(type)}`
    ),
  categories: () => request('/api/categories'),
  genres: () => request('/api/genres'),
  genre: (name) =>
    request(`/api/genres/${encodeURIComponent(name)}`),
  recommendations: () => request('/api/recommendations'),
  askNoco: (query) =>
    request('/api/noco-ai', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
  nocoQuestions: () => request('/api/noco-ai/questions'),
  streamUrl: (id) => mediaUrl(`/api/stream/${encodeURIComponent(id)}`),
  contentUrl: (id) => mediaUrl(`/api/content/${encodeURIComponent(id)}`),
  introUrl: () => mediaUrl('/api/intro/noco-originals'),
  mediaUrl,
};

export function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem('noco-settings') || '{}');
  } catch {
    return {};
  }
}

export function saveSettings(next) {
  localStorage.setItem('noco-settings', JSON.stringify(next));
}
