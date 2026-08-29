import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { PosterCard } from '../components/PosterCard';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('all');
  const [type, setType] = useState('all');
  const [genres, setGenres] = useState([]);
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .genres()
      .then((data) => setGenres(data.genres || []))
      .catch(() => setGenres([]));
  }, []);

  useEffect(() => {
    const q = query.trim();
    const handle = setTimeout(() => {
      setLoading(true);
      api
        .search(q, { genre, type })
        .then((data) => {
          setResults(data.results || []);
          setSuggestions(data.suggestions || []);
          setError('');
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 220);

    return () => clearTimeout(handle);
  }, [query, genre, type]);

  const showEmpty = !loading && query.trim() && results.length === 0;

  const genreOptions = useMemo(
    () => [{ name: 'all', label: 'Alle' }, ...genres.map((g) => ({ name: g.name, label: g.name }))],
    [genres]
  );

  return (
    <div className="page search-wrap">
      <h1 className="page-title">Suche</h1>
      <p className="muted search-lead">
        Titel, Genres, Keywords – auch mit kleinen Tippfehlern.
      </p>

      <div className="search-bar">
        <span className="search-icon" aria-hidden="true">
          ⌕
        </span>
        <input
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="z. B. Magie, Jungle, Sci-Fi…"
          autoFocus
        />
      </div>

      {query.trim() && suggestions.length > 0 && (
        <div className="search-suggest">
          {suggestions.map((s) => (
            <Link key={s.id} to={`/video/${s.id}`} className="search-suggest-item">
              {s.title}
            </Link>
          ))}
        </div>
      )}

      <div className="filter-row">
        <div className="filter-group">
          <span className="filter-label">Genre</span>
          <div className="filter-chips">
            {genreOptions.map((opt) => (
              <button
                key={opt.name}
                type="button"
                className={`chip-btn ${genre === opt.name ? 'is-active' : ''}`}
                onClick={() => setGenre(opt.name)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label">Typ</span>
          <div className="filter-chips">
            {[
              ['all', 'Alle'],
              ['video', 'Video'],
              ['html', 'HTML Movie'],
              ['noco-original', 'NOCO Original'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`chip-btn ${type === value ? 'is-active' : ''}`}
                onClick={() => setType(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && <p className="muted">Suche…</p>}
      {error && <div className="error-box">{error}</div>}
      {showEmpty && (
        <div className="empty-box">
          Keine passenden Filme gefunden.
          <br />
          Versuche einen anderen Suchbegriff.
        </div>
      )}

      <div className="grid search-grid">
        {results.map((video) => (
          <PosterCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
