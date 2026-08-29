/**
 * CORS allowlist for Express.
 * - Same-origin / no Origin: always allowed (PC UI, Electron, curl)
 * - Explicit origins from config + NOCO_CORS_ORIGINS env
 * - Optional LAN HTTP origins for mobile web / Vite on the local network
 */
function isPrivateLanHttpOrigin(origin) {
  try {
    const url = new URL(origin);
    if (url.protocol !== 'http:') return false;
    const host = url.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    return false;
  } catch {
    return false;
  }
}

function buildAllowedOrigins(config) {
  const fromConfig = [
    ...(config.cors?.origins || []),
    ...(config.cors?.githubPagesOrigins || []),
  ];
  const fromEnv = String(process.env.NOCO_CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set([...fromConfig, ...fromEnv]);
}

function createCorsOptions(config) {
  const allowed = buildAllowedOrigins(config);
  const allowLanHttp = config.cors?.allowLanHttp !== false;

  return {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowed.has(origin) || allowed.has('*')) {
        callback(null, true);
        return;
      }
      if (allowLanHttp && isPrivateLanHttpOrigin(origin)) {
        callback(null, true);
        return;
      }
      console.warn(`[CORS] blocked origin: ${origin}`);
      callback(null, false);
    },
    credentials: false,
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
  };
}

module.exports = {
  createCorsOptions,
  isPrivateLanHttpOrigin,
  buildAllowedOrigins,
};
