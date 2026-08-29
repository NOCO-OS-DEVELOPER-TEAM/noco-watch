import { getServerUrl, isMixedContentRisk } from './serverConfig';

export class ApiError extends Error {
  constructor(message, { code, status } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code || 'API_ERROR';
    this.status = status ?? null;
  }
}

function mediaUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const base = getServerUrl();
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

async function request(path, options = {}) {
  const base = getServerUrl();

  if (isMixedContentRisk(base)) {
    throw new ApiError(
      'Dein Browser blockiert aktuell die Verbindung zwischen der sicheren GitHub-Seite und deinem lokalen NOCO-WATCH-Server.',
      { code: 'MIXED_CONTENT' }
    );
  }

  let res;
  try {
    res = await fetch(`${base}${path}`, {
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      ...options,
    });
  } catch (err) {
    if (isMixedContentRisk(base)) {
      throw new ApiError(
        'Dein Browser blockiert aktuell die Verbindung zwischen der sicheren GitHub-Seite und deinem lokalen NOCO-WATCH-Server.',
        { code: 'MIXED_CONTENT' }
      );
    }
    throw new ApiError(
      'NOCO WATCH ist nicht erreichbar. Stelle sicher, dass du dich im selben WLAN wie dein NOCO-WATCH-Server befindest.',
      { code: 'OFFLINE', status: 0 }
    );
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, { code: 'HTTP_ERROR', status: res.status });
  }

  return res.json();
}

export const api = {
  health: () => request('/api/health'),
  system: () => request('/api/system'),
  videos: () => request('/api/videos'),
  video: (id) => request(`/api/videos/${encodeURIComponent(id)}`),
  search: (q) => request(`/api/search?q=${encodeURIComponent(q)}`),
  categories: () => request('/api/categories'),
  recommendations: () => request('/api/recommendations'),
  streamUrl: (id) => mediaUrl(`/api/stream/${encodeURIComponent(id)}`),
  contentUrl: (id) => mediaUrl(`/api/content/${encodeURIComponent(id)}`),
  introUrl: () => mediaUrl('/api/intro/noco-originals'),
  mediaUrl,
};
