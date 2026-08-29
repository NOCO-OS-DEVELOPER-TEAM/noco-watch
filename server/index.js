const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { loadConfig, ROOT } = require('./config');
const { createCorsOptions } = require('./cors');
const { createLibrary } = require('./services/library');
const { createApiRouter } = require('./routes/api');
const {
  getLocalIPv4Addresses,
  getPreferredLanAddress,
} = require('./services/network');

const config = loadConfig();
const library = createLibrary(config);
const app = express();

app.use(cors(createCorsOptions(config)));

app.use(express.json({ limit: '1mb' }));

// Thumbnails (optional local files)
const thumbsDir = path.join(ROOT, 'public', 'thumbnails');
if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir, { recursive: true });
app.use('/thumbnails', express.static(thumbsDir));
app.use('/branding', express.static(path.join(ROOT, 'public', 'branding')));

app.use('/api', createApiRouter({ library, config }));

// Mobile web client (GitHub Pages build) – HTTP-friendly path for iPhone LAN tests
const mobileWebDir = path.join(ROOT, 'noco-watch-web', 'dist');
if (fs.existsSync(mobileWebDir)) {
  app.use(
    '/web',
    express.static(mobileWebDir, {
      setHeaders(res) {
        res.setHeader('Cache-Control', 'no-cache');
      },
    })
  );
}

// Serve built desktop/browser client in production / when dist exists
const distDir = path.join(ROOT, 'client', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/thumbnails') ||
      req.path.startsWith('/branding') ||
      req.path.startsWith('/web')
    ) {
      return next();
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

function printBanner() {
  const lan = getPreferredLanAddress();
  const addresses = getLocalIPv4Addresses();
  console.log('');
  console.log('══════════════════════════════════════════');
  console.log(`  ${config.appName} Server v${config.version}`);
  console.log('  Status: ONLINE');
  console.log(`  Lokal:  http://127.0.0.1:${config.port}`);
  if (lan) {
    console.log(`  WLAN:   http://${lan}:${config.port}`);
  } else {
    console.log('  WLAN:   (keine LAN-Adresse gefunden)');
  }
  if (fs.existsSync(path.join(ROOT, 'noco-watch-web', 'dist'))) {
    const base = lan || '127.0.0.1';
    console.log(`  Mobile: http://${base}:${config.port}/web/`);
  }
  if (addresses.length > 1) {
    console.log('  Weitere Adressen:');
    for (const a of addresses) {
      console.log(`    - http://${a.address}:${config.port} (${a.name})`);
    }
  }
  console.log('══════════════════════════════════════════');
  console.log('');
}

const server = app.listen(config.port, config.host, () => {
  printBanner();
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `Port ${config.port} ist bereits belegt. Setze NOCO_PORT oder stoppe den anderen Prozess.`
    );
  } else {
    console.error('Server-Fehler:', err.message);
  }
  process.exit(1);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

module.exports = { app, server, config };
