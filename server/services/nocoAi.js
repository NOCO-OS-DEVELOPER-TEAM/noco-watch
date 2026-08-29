/**
 * NOCO AI – question bank + keyword recommendations.
 */
const fs = require('fs');
const path = require('path');
const { searchVideos } = require('./search');

const QUESTIONS_FILE = path.join(__dirname, '..', '..', 'data', 'noco-questions.json');

function loadQuestions() {
  try {
    const raw = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf8'));
    return Array.isArray(raw.questions) ? raw.questions : [];
  } catch {
    return [];
  }
}

function scoreQuestion(entry, text) {
  const q = String(text || '').toLowerCase();
  if (!q) return 0;
  let score = 0;
  const question = String(entry.question || '').toLowerCase();
  const answer = String(entry.answer || '').toLowerCase();
  const keywords = (entry.keywords || []).map((k) => String(k).toLowerCase());

  if (question === q) score += 100;
  if (question.includes(q) || q.includes(question)) score += 40;

  const distinctive = [
    'magie',
    'magic',
    'zauber',
    'fantasy',
    'jungle',
    'dschungel',
    'sci-fi',
    'scifi',
    'future',
    'original',
    'kurz',
    'server',
    'wlan',
    'html',
    'player',
    'streaming',
    'josie',
  ];
  for (const d of distinctive) {
    if (!q.includes(d)) continue;
    if (question.includes(d) || keywords.some((k) => k.includes(d))) score += 28;
    if (answer.includes(d)) score += 8;
  }

  for (const kw of keywords) {
    if (kw.length > 2 && q.includes(kw)) score += 12;
  }
  const words = q.split(/\s+/).filter((w) => w.length > 3);
  for (const w of words) {
    if (question.includes(w)) score += 8;
    if (answer.includes(w)) score += 2;
    if (keywords.some((k) => k.includes(w) || w.includes(k))) score += 6;
  }
  // Downrank ultra-generic greetings when query is longer
  if (q.length > 12 && /^(hallo|hi|danke|hilfe)$/i.test(question)) score -= 20;
  return score;
}

function recommendFromIntent(videos, text) {
  const available = videos.filter((v) => v.available);
  const q = String(text || '').toLowerCase();

  if (/kurz|kurze|kurzfilm|zwischendurch|schnell/.test(q)) {
    const short = [...available]
      .filter((v) => (v.durationSeconds || 9999) <= 150)
      .sort((a, b) => (a.durationSeconds || 0) - (b.durationSeconds || 0));
    if (short.length) {
      return {
        answer: 'Hier sind kürzere Titel aus deiner Bibliothek.',
        videos: short.slice(0, 8),
      };
    }
  }

  if (/lang|länger|abend|feature/.test(q)) {
    const long = [...available].sort(
      (a, b) => (b.durationSeconds || 0) - (a.durationSeconds || 0)
    );
    return {
      answer: 'Hier sind die längeren Titel.',
      videos: long.slice(0, 6),
    };
  }

  if (/original|noco original/.test(q)) {
    const originals = available.filter((v) => v.nocoOriginal);
    return {
      answer: 'Das sind deine NOCO Originals.',
      videos: originals.slice(0, 10),
    };
  }

  if (/magie|magic|zauber|fantasy|magisch|magical/.test(q)) {
    const found = searchVideos(available, 'magic fantasy magie zauber').filter(
      (v) =>
        /magic|fantasy|magie|zauber/i.test(
          [
            v.series,
            v.title,
            ...(v.genres || []),
            ...(v.keywords || []),
            ...(v.tags || []),
          ].join(' ')
        )
    );
    return {
      answer: 'Passend zu Magie / Fantasy habe ich das hier gefunden.',
      videos: (found.length ? found : available.filter((v) => v.series === 'Magic World')).slice(0, 8),
    };
  }

  if (/jungle|dschungel|abenteuer|adventure/.test(q)) {
    const found = searchVideos(available, 'jungle adventure dschungel');
    return {
      answer: 'Abenteuer und Dschungel – das könnte passen.',
      videos: (found.length ? found : available.filter((v) => (v.series || '').includes('Jungle'))).slice(0, 8),
    };
  }

  if (/sci-?fi|zukunft|future|weltraum|raumschiff/.test(q)) {
    const found = searchVideos(available, 'sci-fi future weltraum');
    return {
      answer: 'Sci-Fi aus deiner Bibliothek:',
      videos: (found.length ? found : available.filter((v) => (v.series || '').includes('Future'))).slice(0, 8),
    };
  }

  if (/spannung|spannend|action|flucht/.test(q)) {
    const found = searchVideos(available, 'escape jungle signal flucht');
    return {
      answer: 'Etwas Spannendes aus deiner Bibliothek:',
      videos: found.slice(0, 8),
    };
  }

  if (/persönlich|josie|familie|erinnerung/.test(q)) {
    const found = searchVideos(available, 'josie familie erinnerung');
    return {
      answer: 'Persönliche Titel:',
      videos: found.slice(0, 6),
    };
  }

  if (/neu|zuletzt|recent|new/.test(q)) {
    const sorted = [...available].sort((a, b) =>
      String(b.addedAt || '').localeCompare(String(a.addedAt || ''))
    );
    return {
      answer: 'Hier sind die neuesten Titel.',
      videos: sorted.slice(0, 8),
    };
  }

  // Generic keyword search against library
  const found = searchVideos(available, q);
  if (found.length) {
    return {
      answer: `Ich habe ${found.length} passende Titel gefunden.`,
      videos: found.slice(0, 8),
    };
  }

  return null;
}

function recommend(videos, { mood, query } = {}) {
  const available = videos.filter((v) => v.available);
  if (available.length === 0) {
    return {
      answer: 'Aktuell sind keine abspielbaren Videos verfügbar.',
      videos: [],
      matchedQuestion: null,
      categories: [],
    };
  }

  const text = String(query || mood || '').trim();
  const questions = loadQuestions();
  const ranked = questions
    .map((entry) => ({ entry, score: scoreQuestion(entry, text) }))
    .filter((row) => row.score > 8)
    .sort((a, b) => b.score - a.score);

  const intent = recommendFromIntent(videos, text);
  const topQ = ranked[0]?.entry || null;
  const topScore = ranked[0]?.score || 0;
  const categories = [...new Set(questions.map((q) => q.category))];
  const strongIntent =
    /magie|magic|zauber|fantasy|jungle|dschungel|sci-?fi|scifi|kurz|original|josie|spannung/.test(
      text.toLowerCase()
    );

  if (intent && strongIntent) {
    const specific = ranked.find((row) => {
      const blob = `${row.entry.question} ${(row.entry.keywords || []).join(' ')}`.toLowerCase();
      return /magie|magic|zauber|fantasy|jungle|sci-?fi|kurz|original|josie|spannung/.test(
        blob
      );
    });
    return {
      answer: specific?.entry.answer || intent.answer,
      videos: intent.videos,
      matchedQuestion: specific?.entry.question || null,
      category: specific?.entry.category || null,
      suggestions: ranked.slice(0, 6).map((r) => r.entry.question),
      categories,
    };
  }

  if (topQ && intent && topScore >= 30) {
    return {
      answer: topQ.answer,
      videos: intent.videos,
      matchedQuestion: topQ.question,
      category: topQ.category,
      suggestions: ranked.slice(0, 6).map((r) => r.entry.question),
      categories,
    };
  }

  if (topQ) {
    const related = recommendFromIntent(videos, topQ.question) || {
      videos: available.filter((v) => v.featured || v.nocoOriginal).slice(0, 6),
    };
    return {
      answer: topQ.answer,
      videos: related.videos,
      matchedQuestion: topQ.question,
      category: topQ.category,
      suggestions: ranked.slice(0, 6).map((r) => r.entry.question),
      categories,
    };
  }

  if (intent) {
    return {
      ...intent,
      matchedQuestion: null,
      suggestions: questions.slice(0, 8).map((q) => q.question),
      categories,
    };
  }

  return {
    answer:
      'Dazu habe ich noch keine starke Empfehlung. Schau dir gerne die Highlights an.',
    videos: available.filter((v) => v.featured).slice(0, 4),
    matchedQuestion: null,
    suggestions: questions.slice(0, 8).map((q) => q.question),
    categories,
  };
}

function listQuestionBank() {
  const questions = loadQuestions();
  const byCategory = {};
  for (const q of questions) {
    if (!byCategory[q.category]) byCategory[q.category] = [];
    byCategory[q.category].push({
      id: q.id,
      question: q.question,
    });
  }
  return {
    count: questions.length,
    categories: Object.keys(byCategory).sort(),
    byCategory,
  };
}

module.exports = { recommend, listQuestionBank, loadQuestions };
