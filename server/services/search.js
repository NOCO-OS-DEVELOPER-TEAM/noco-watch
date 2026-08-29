/**
 * Fuzzy / ranked library search for NOCO WATCH.
 */

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9äöüß\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(query) {
  return normalize(query)
    .split(' ')
    .filter((t) => t.length > 1);
}

/** Simple Levenshtein distance */
function distance(a, b) {
  const s = normalize(a);
  const t = normalize(b);
  if (s === t) return 0;
  if (!s.length) return t.length;
  if (!t.length) return s.length;
  const rows = Array.from({ length: s.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= t.length; j += 1) rows[0][j] = j;
  for (let i = 1; i <= s.length; i += 1) {
    for (let j = 1; j <= t.length; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + cost
      );
    }
  }
  return rows[s.length][t.length];
}

function fuzzyIncludes(haystack, needle) {
  const h = normalize(haystack);
  const n = normalize(needle);
  if (!n) return false;
  if (h.includes(n)) return true;
  // token-level fuzzy (typo tolerance)
  const tokens = h.split(' ').filter(Boolean);
  const maxDist = n.length <= 4 ? 1 : n.length <= 8 ? 2 : 3;
  return tokens.some((tok) => {
    if (tok.includes(n) || n.includes(tok)) return true;
    if (Math.abs(tok.length - n.length) > maxDist) return false;
    return distance(tok, n) <= maxDist;
  });
}

function fieldBlob(video, fields) {
  return fields
    .map((f) => {
      const val = video[f];
      if (Array.isArray(val)) return val.join(' ');
      return val == null ? '' : String(val);
    })
    .join(' ');
}

function scoreVideo(video, query) {
  const q = normalize(query);
  if (!q) return 0;
  const tokens = tokenize(query);
  let score = 0;

  const title = normalize(video.title);
  const series = normalize(video.series || video.category || '');
  const genres = normalize(
    [...(video.genres || []), video.genre].filter(Boolean).join(' ')
  );
  const keywords = normalize(
    [...(video.keywords || []), ...(video.tags || [])].join(' ')
  );
  const description = normalize(video.description || '');
  const people = normalize(
    [...(video.cast || []), ...(video.creators || []), video.director]
      .filter(Boolean)
      .join(' ')
  );
  const episode = String(video.episode ?? '');

  // Exact / full query title
  if (title === q) score += 1000;
  else if (title.startsWith(q)) score += 800;
  else if (title.includes(q)) score += 600;
  else if (fuzzyIncludes(title, q)) score += 420;

  if (series && (series.includes(q) || fuzzyIncludes(series, q))) score += 320;
  if (genres && (genres.includes(q) || fuzzyIncludes(genres, q))) score += 220;
  if (keywords && (keywords.includes(q) || fuzzyIncludes(keywords, q))) score += 180;
  if (description.includes(q) || fuzzyIncludes(description, q)) score += 80;
  if (people && (people.includes(q) || fuzzyIncludes(people, q))) score += 120;
  if (episode && q === episode) score += 60;

  for (const tok of tokens) {
    if (title.includes(tok) || fuzzyIncludes(title, tok)) score += 90;
    else if (series.includes(tok) || fuzzyIncludes(series, tok)) score += 55;
    else if (genres.includes(tok) || fuzzyIncludes(genres, tok)) score += 40;
    else if (keywords.includes(tok) || fuzzyIncludes(keywords, tok)) score += 35;
    else if (description.includes(tok) || fuzzyIncludes(description, tok)) score += 15;
    else if (people.includes(tok) || fuzzyIncludes(people, tok)) score += 25;
  }

  return score;
}

function matchesFilters(video, { genre, type } = {}) {
  if (genre && genre !== 'all') {
    const g = String(genre).toLowerCase();
    if (g === 'noco originals' || g === 'noco-originals') {
      if (!video.nocoOriginal) return false;
    } else {
      const list = [
        ...(video.genres || []),
        video.genre,
        video.category,
      ]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase());
      if (!list.includes(g)) return false;
    }
  }

  if (type && type !== 'all') {
    const t = String(type).toLowerCase();
    if (t === 'noco original' || t === 'noco-original') {
      if (!video.nocoOriginal) return false;
    } else if (t === 'html' || t === 'html movie') {
      if (video.type !== 'html') return false;
    } else if (t === 'video' || t === 'film') {
      if (video.type !== 'video') return false;
    }
  }

  return true;
}

function searchVideos(videos, query, filters = {}) {
  const filtered = videos.filter((v) => matchesFilters(v, filters));
  const q = String(query || '').trim();
  if (!q) {
    return filtered;
  }

  return filtered
    .map((video) => ({ video, score: scoreVideo(video, q) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.video.title.localeCompare(b.video.title))
    .map((row) => row.video);
}

function collectGenres(videos) {
  const set = new Map();
  for (const video of videos) {
    const list =
      Array.isArray(video.genres) && video.genres.length
        ? video.genres
        : video.genre
          ? [video.genre]
          : [];
    for (const g of list) {
      const name = String(g).trim();
      if (!name) continue;
      set.set(name, (set.get(name) || 0) + 1);
    }
  }
  return Array.from(set.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

module.exports = {
  normalize,
  searchVideos,
  scoreVideo,
  collectGenres,
  matchesFilters,
  fuzzyIncludes,
};
