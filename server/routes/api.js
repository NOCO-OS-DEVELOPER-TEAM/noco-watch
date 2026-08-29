const express = require('express');

function createApiRouter({ library, config }) {
  const router = express.Router();
  const { recommend } = require('../services/nocoAi');
  const { streamFile } = require('../services/stream');
  const {
    getLocalIPv4Addresses,
    getPreferredLanAddress,
  } = require('../services/network');

  router.get('/health', (_req, res) => {
    res.json({ ok: true, app: config.appName, version: config.version });
  });

  router.get('/system', (_req, res) => {
    const lan = getPreferredLanAddress();
    const addresses = getLocalIPv4Addresses();
    res.json({
      app: config.appName,
      version: config.version,
      status: 'online',
      host: config.host,
      port: config.port,
      protocol: 'http',
      lanAddress: lan,
      lanUrl: lan ? `http://${lan}:${config.port}` : null,
      localhostUrl: `http://127.0.0.1:${config.port}`,
      networkHint: 'Lokales WLAN / privates Netzwerk',
      useHttps: false,
      addresses: addresses.map((a) => ({
        ...a,
        url: `http://${a.address}:${config.port}`,
      })),
      mediaDir: config.mediaDir,
      videoCount: library.listVideos().length,
      availableCount: library.listVideos().filter((v) => v.available).length,
      firewallHint:
        'Windows-Firewall: Port 3000 nur für private Netzwerke freigeben (nicht öffentlich).',
    });
  });

  router.get('/videos', (_req, res) => {
    res.json({ videos: library.listVideos() });
  });

  router.get('/videos/:id', (req, res) => {
    const video = library.getById(req.params.id);
    if (!video) {
      res.status(404).json({ error: 'Video nicht gefunden' });
      return;
    }
    res.json({ video });
  });

  router.get('/search', (req, res) => {
    const q = req.query.q || '';
    const genre = req.query.genre || 'all';
    const type = req.query.type || 'all';
    const results = library.search(q, { genre, type });
    res.json({
      query: q,
      genre,
      type,
      results,
      suggestions: results.slice(0, 6).map((v) => ({
        id: v.id,
        title: v.title,
        series: v.series,
        episode: v.episode,
      })),
    });
  });

  router.get('/categories', (_req, res) => {
    res.json({ categories: library.getCategories() });
  });

  router.get('/genres', (_req, res) => {
    res.json({ genres: library.getGenres() });
  });

  router.get('/genres/:name', (req, res) => {
    const name = decodeURIComponent(req.params.name);
    const videos = library.getByGenre(name);
    res.json({ genre: name, count: videos.length, videos });
  });

  router.get('/recommendations', (_req, res) => {
    const videos = library.listVideos({ includeUnavailable: false });
    const featured = videos.filter((v) => v.featured);
    const originals = videos.filter((v) => v.nocoOriginal);
    const recent = [...videos].sort((a, b) =>
      String(b.addedAt || '').localeCompare(String(a.addedAt || ''))
    );
    const bySeriesEpisode = (a, b) => {
      const sa = String(a.series || a.title);
      const sb = String(b.series || b.title);
      if (sa !== sb) return sa.localeCompare(sb);
      return (a.episode || 0) - (b.episode || 0);
    };
    // Keep Home lean: limited curated rails only
    res.json({
      featured: (featured.length ? featured : videos.slice(0, 6))
        .sort(bySeriesEpisode)
        .slice(0, 8),
      popular: (featured.length ? featured : videos)
        .sort(bySeriesEpisode)
        .slice(0, 8),
      nocoOriginals: originals.sort(bySeriesEpisode).slice(0, 10),
      recentlyAdded: recent.slice(0, 8),
      continueWatching: [],
      hero: featured[0] || originals[0] || recent[0] || null,
    });
  });

  router.post('/noco-ai', express.json(), (req, res) => {
    const query = req.body?.query || req.body?.message || '';
    const result = recommend(library.listVideos(), { query });
    res.json(result);
  });

  router.get('/noco-ai', (req, res) => {
    const query = req.query.q || '';
    const result = recommend(library.listVideos(), { query });
    res.json(result);
  });

  router.get('/noco-ai/questions', (_req, res) => {
    const { listQuestionBank } = require('../services/nocoAi');
    res.json(listQuestionBank());
  });

  router.get('/stream/:id', (req, res) => {
    const item = library.getById(req.params.id);
    if (!item || item.type !== 'video') {
      res.status(404).json({ error: 'Video-Stream nicht verfügbar' });
      return;
    }
    const filePath = library.getFilePath(req.params.id);
    if (!filePath) {
      res.status(404).json({ error: 'Video oder Datei nicht gefunden' });
      return;
    }
    streamFile(req, res, filePath);
  });

  router.get('/content/:id', (req, res) => {
    const item = library.getById(req.params.id);
    if (!item || item.type !== 'html') {
      res.status(404).json({ error: 'HTML-Inhalt nicht gefunden' });
      return;
    }
    const filePath = library.getFilePath(req.params.id);
    if (!filePath) {
      res.status(404).json({ error: 'HTML-Datei nicht gefunden' });
      return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(filePath);
  });

  router.get('/intro/noco-originals', (_req, res) => {
    const filePath = library.getIntroPath();
    if (!filePath) {
      res.status(404).json({ error: 'Intro nicht gefunden' });
      return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(filePath);
  });

  router.get('/cover/:id', (req, res) => {
    const filePath = library.getCoverPath(req.params.id);
    if (!filePath) {
      res.status(404).json({ error: 'Cover nicht gefunden' });
      return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(filePath);
  });

  router.get('/subtitles/:id/:lang', (req, res) => {
    const filePath = library.getSubtitlePath(req.params.id, req.params.lang);
    if (!filePath) {
      res.status(404).json({ error: 'Untertitel nicht gefunden' });
      return;
    }
    res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(filePath);
  });

  return router;
}

module.exports = { createApiRouter };
