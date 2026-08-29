import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { PosterRail } from '../components/PosterCard';

export default function AskNocoPage() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [videos, setVideos] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [bank, setBank] = useState(null);
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .nocoQuestions()
      .then((data) => {
        setBank(data);
        setActiveCategory(data.categories?.[0] || '');
      })
      .catch(() => setBank(null));
  }, []);

  async function ask(text) {
    const q = String(text || '').trim();
    if (!q) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.askNoco(q);
      setAnswer(data.answer || '');
      setVideos(data.videos || []);
      setSuggestions(data.suggestions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const categoryQuestions =
    bank?.byCategory?.[activeCategory]?.slice(0, 12) || [];

  return (
    <div className="page ai-wrap">
      <h1 className="page-title">Frag NOCO</h1>
      <p className="muted">
        {bank?.count
          ? `${bank.count} Fragen in der Bibliothek – Stichworte werden erkannt.`
          : 'Lokale Empfehlungslogik für deine Bibliothek.'}
      </p>

      <form
        className="ai-form"
        onSubmit={(e) => {
          e.preventDefault();
          ask(query);
        }}
      >
        <input
          className="ai-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="z. B. Was kann ich mit Magie schauen?"
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Denke…' : 'Fragen'}
        </button>
      </form>

      {bank?.categories?.length > 0 && (
        <div className="filter-chips ask-cats">
          {bank.categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`chip-btn ${activeCategory === cat ? 'is-active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="ask-question-list">
        {categoryQuestions.map((item) => (
          <button
            key={item.id}
            type="button"
            className="ask-q"
            onClick={() => {
              setQuery(item.question);
              ask(item.question);
            }}
          >
            {item.question}
          </button>
        ))}
      </div>

      {suggestions.length > 0 && (
        <div className="meta-row" style={{ marginBottom: 18 }}>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="chip"
              style={{ cursor: 'pointer', border: '1px solid var(--line)' }}
              onClick={() => {
                setQuery(s);
                ask(s);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && <div className="error-box">{error}</div>}
      {answer && <div className="ai-answer">{answer}</div>}
      {videos.length > 0 && <PosterRail videos={videos} />}
    </div>
  );
}
