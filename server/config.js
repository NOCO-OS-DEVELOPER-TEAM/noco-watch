const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const configPath = path.join(ROOT, 'config', 'default.json');

function loadConfig() {
  const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return {
    ...raw,
    port: Number(process.env.NOCO_PORT || raw.port || 3000),
    host: process.env.NOCO_HOST || raw.host || '0.0.0.0',
    root: ROOT,
    mediaDir: path.isAbsolute(raw.mediaDir)
      ? raw.mediaDir
      : path.join(ROOT, raw.mediaDir),
    metadataFile: path.isAbsolute(raw.metadataFile)
      ? raw.metadataFile
      : path.join(ROOT, raw.metadataFile),
  };
}

module.exports = { loadConfig, ROOT };
