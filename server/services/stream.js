const fs = require('fs');
const path = require('path');

const MIME_BY_EXT = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
  '.avi': 'video/x-msvideo',
};

function getMime(filePath) {
  return MIME_BY_EXT[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

/**
 * Stream a local video file with HTTP Range support (seekable playback).
 */
function streamFile(req, res, filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Video datei nicht gefunden' });
    return;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const mime = getMime(filePath);
  const range = req.headers.range;

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', mime);
  res.setHeader('Cache-Control', 'no-cache');

  if (!range) {
    res.setHeader('Content-Length', fileSize);
    res.status(200);
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) {
    res.status(416).setHeader('Content-Range', `bytes */${fileSize}`).end();
    return;
  }

  let start = match[1] ? parseInt(match[1], 10) : 0;
  let end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= fileSize) {
    res.status(416).setHeader('Content-Range', `bytes */${fileSize}`).end();
    return;
  }

  end = Math.min(end, fileSize - 1);
  const chunkSize = end - start + 1;

  res.status(206);
  res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
  res.setHeader('Content-Length', chunkSize);

  fs.createReadStream(filePath, { start, end }).pipe(res);
}

module.exports = { streamFile, getMime };
