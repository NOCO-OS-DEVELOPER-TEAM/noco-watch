const fs = require('fs');
const path = require('path');

const INTRO_RELATIVE = path.join('intros', 'noco-originals.html');

function resolveMediaPath(entry, mediaDir, field = 'file') {
  const value = entry[field];
  if (!value) return null;
  if (path.isAbsolute(value)) return value;
  return path.join(mediaDir, value);
}

function resolveIntroPath(mediaDir) {
  return path.join(mediaDir, INTRO_RELATIVE);
}

function enrichVideo(video, mediaDir, port, lanAddress) {
  const type = video.type === 'html' ? 'html' : 'video';
  const absolutePath = resolveMediaPath(video, mediaDir, 'file');
  const exists = absolutePath ? fs.existsSync(absolutePath) : false;
  let sizeBytes = null;

  if (exists) {
    try {
      sizeBytes = fs.statSync(absolutePath).size;
    } catch {
      sizeBytes = null;
    }
  }

  const coverPath = resolveMediaPath(video, mediaDir, 'cover');
  const coverExists = coverPath ? fs.existsSync(coverPath) : false;

  const host = lanAddress || '127.0.0.1';
  const introPath = resolveIntroPath(mediaDir);
  const introAvailable = fs.existsSync(introPath);
  const playIntro = video.playIntro !== false;

  const subtitles = Array.isArray(video.subtitles)
    ? video.subtitles
        .map((sub) => {
          const subPath = resolveMediaPath(
            { file: sub.file },
            mediaDir,
            'file'
          );
          if (!subPath || !fs.existsSync(subPath)) return null;
          return {
            lang: sub.lang || 'und',
            label: sub.label || sub.lang || 'Untertitel',
            url: `/api/subtitles/${encodeURIComponent(video.id)}/${encodeURIComponent(sub.lang || 'und')}`,
          };
        })
        .filter(Boolean)
    : [];

  const genres =
    Array.isArray(video.genres) && video.genres.length
      ? video.genres
      : video.genre
        ? [video.genre]
        : [];

  return {
    id: video.id,
    title: video.title,
    description: video.description || '',
    category: video.category || video.series || 'Sonstiges',
    series: video.series || null,
    episode: video.episode ?? null,
    genre: video.genre || genres[0] || null,
    genres,
    keywords: Array.isArray(video.keywords) ? video.keywords : [],
    cast: Array.isArray(video.cast) ? video.cast : [],
    creators: Array.isArray(video.creators) ? video.creators : [],
    director: video.director || null,
    tags: Array.isArray(video.tags) ? video.tags : [],
    type,
    thumbnail: video.thumbnail
      ? `/thumbnails/${path.basename(video.thumbnail)}`
      : null,
    coverUrl: coverExists
      ? `/api/cover/${encodeURIComponent(video.id)}`
      : null,
    subtitles,
    durationSeconds: video.durationSeconds ?? video.duration ?? null,
    quality: video.quality || (type === 'html' ? 'HTML' : '720p'),
    releaseDate: video.releaseDate || null,
    featured: Boolean(video.featured),
    nocoOriginal: Boolean(video.nocoOriginal),
    addedAt: video.addedAt || null,
    available: exists,
    sizeBytes,
    playIntro,
    introAvailable,
    introUrl: introAvailable ? '/api/intro/noco-originals' : null,
    contentUrl:
      type === 'html'
        ? `/api/content/${encodeURIComponent(video.id)}`
        : `/api/stream/${encodeURIComponent(video.id)}`,
    streamUrl:
      type === 'video'
        ? `/api/stream/${encodeURIComponent(video.id)}`
        : null,
    detailUrl: `/api/videos/${encodeURIComponent(video.id)}`,
    streamUrlAbsolute:
      type === 'video'
        ? `http://${host}:${port}/api/stream/${encodeURIComponent(video.id)}`
        : `http://${host}:${port}/api/content/${encodeURIComponent(video.id)}`,
  };
}

function createLibrary(config) {
  function readRaw() {
    const raw = fs.readFileSync(config.metadataFile, 'utf8');
    return JSON.parse(raw);
  }

  function listVideos({ includeUnavailable = true } = {}) {
    const { getPreferredLanAddress } = require('./network');
    const lan = getPreferredLanAddress();
    let videos = readRaw().map((v) =>
      enrichVideo(v, config.mediaDir, config.port, lan)
    );
    if (!includeUnavailable) {
      videos = videos.filter((v) => v.available);
    }
    return videos;
  }

  function getRawById(id) {
    return readRaw().find((v) => v.id === id) || null;
  }

  function getById(id) {
    const raw = getRawById(id);
    if (!raw) return null;
    const { getPreferredLanAddress } = require('./network');
    return enrichVideo(raw, config.mediaDir, config.port, getPreferredLanAddress());
  }

  function getFilePath(id) {
    const raw = getRawById(id);
    if (!raw) return null;
    const absolutePath = resolveMediaPath(raw, config.mediaDir, 'file');
    if (!absolutePath || !fs.existsSync(absolutePath)) return null;
    return absolutePath;
  }

  function getCoverPath(id) {
    const raw = getRawById(id);
    if (!raw) return null;
    const absolutePath = resolveMediaPath(raw, config.mediaDir, 'cover');
    if (!absolutePath || !fs.existsSync(absolutePath)) return null;
    return absolutePath;
  }

  function getSubtitlePath(id, lang) {
    const raw = getRawById(id);
    if (!raw || !Array.isArray(raw.subtitles)) return null;
    const match = raw.subtitles.find(
      (s) => String(s.lang || '').toLowerCase() === String(lang || '').toLowerCase()
    );
    if (!match?.file) return null;
    const absolutePath = resolveMediaPath({ file: match.file }, config.mediaDir, 'file');
    if (!absolutePath || !fs.existsSync(absolutePath)) return null;
    return absolutePath;
  }

  function getIntroPath() {
    const p = resolveIntroPath(config.mediaDir);
    return fs.existsSync(p) ? p : null;
  }

  function getCategories() {
    const videos = listVideos();
    const map = new Map();
    for (const video of videos) {
      const key = video.series || video.category || 'Sonstiges';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(video);
    }
    return Array.from(map.entries()).map(([name, items]) => ({
      name,
      count: items.length,
      videos: items,
    }));
  }

  function getGenres() {
    const { collectGenres } = require('./search');
    return collectGenres(listVideos());
  }

  function getByGenre(name) {
    const { matchesFilters } = require('./search');
    return listVideos().filter((v) =>
      matchesFilters(v, { genre: name, type: 'all' })
    );
  }

  function search(query, filters = {}) {
    const { searchVideos } = require('./search');
    return searchVideos(listVideos(), query, filters);
  }

  return {
    listVideos,
    getById,
    getRawById,
    getFilePath,
    getCoverPath,
    getSubtitlePath,
    getIntroPath,
    getCategories,
    getGenres,
    getByGenre,
    search,
  };
}

module.exports = {
  createLibrary,
  resolveMediaPath,
  enrichVideo,
};
