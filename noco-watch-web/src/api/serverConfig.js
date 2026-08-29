const STORAGE_KEY = 'nocoServer';
const DEFAULT_SERVER = 'http://192.168.178.197:3000';

export function normalizeServerUrl(raw) {
  let value = String(raw || '').trim();
  if (!value) return DEFAULT_SERVER;
  if (!/^https?:\/\//i.test(value)) {
    value = `http://${value}`;
  }
  return value.replace(/\/+$/, '');
}

/** Prefer current origin when UI is served by the NOCO server (/web). */
export function detectDefaultServer() {
  if (typeof window === 'undefined') return DEFAULT_SERVER;
  try {
    const { protocol, hostname, port, pathname } = window.location;
    const underWeb = pathname === '/web' || pathname.startsWith('/web/');
    const onServerPort = port === '3000' || port === String(3000);
    if (underWeb || onServerPort) {
      const portPart = port ? `:${port}` : '';
      return `${protocol}//${hostname}${portPart}`;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_SERVER;
}

export function getServerUrl() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return normalizeServerUrl(stored);
    return normalizeServerUrl(detectDefaultServer());
  } catch {
    return DEFAULT_SERVER;
  }
}

export function setServerUrl(url) {
  const next = normalizeServerUrl(url);
  localStorage.setItem(STORAGE_KEY, next);
  return next;
}

export function isMixedContentRisk(serverUrl = getServerUrl()) {
  if (typeof window === 'undefined') return false;
  const pageIsHttps = window.location.protocol === 'https:';
  const serverIsHttp = /^http:\/\//i.test(serverUrl);
  return pageIsHttps && serverIsHttp;
}

export { DEFAULT_SERVER, STORAGE_KEY };
