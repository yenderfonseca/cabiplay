import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Row from '../components/Row.jsx';
import Artwork from '../components/Artwork.jsx';
import StationRow from '../components/StationRow.jsx';
import Logo from '../components/Logo.jsx';
import { usePlayer } from '../lib/PlayerContext.jsx';
import { GENRES } from '../lib/genres.js';
import { Info } from '../lib/icons.jsx';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
};

export default function Home() {
  const { stations, current, status, play, toggle, recent, stats, liked } = usePlayer();
  const [genre, setGenre] = useState(null);

  // Popularity = likes first, then live listeners. Stations nobody has rated
  // yet keep their catalogue order instead of jumping around at random.
  const popular = useMemo(() => {
    const score = (s) => (stats[s.slug]?.likes || 0) * 10 + (stats[s.slug]?.listeners || 0);
    return [...stations].filter((s) => score(s) > 0).sort((a, b) => score(b) - score(a)).slice(0, 10);
  }, [stations, stats]);

  const bySlug = useMemo(() => Object.fromEntries(stations.map((s) => [s.slug, s])), [stations]);
  const favs = liked.map((slug) => bySlug[slug]).filter(Boolean);
  const recents = recent.map((slug) => bySlug[slug]).filter(Boolean);

  // Quick picks: what you played last, topped up with favourites and the most
  // liked, so a first visit still gets six one-tap stations.
  const quick = useMemo(() => {
    const seen = new Set();
    return [...recents, ...favs, ...popular, ...stations].filter((s) => !seen.has(s.slug) && seen.add(s.slug)).slice(0, 6);
  }, [recents, favs, popular, stations]);

  const presentGenres = GENRES.filter((g) => stations.some((s) => s.genre === g.key));

  if (!stations.length) {
    return (
      <main className="page">
        <p className="muted">Cargando emisoras…</p>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="masthead">
        <Logo size={24} />
        <Link to="/creditos" className="icon-btn" aria-label="Créditos y cómo se hizo">
          <Info size={20} />
        </Link>
      </header>

      <h1 className="hello">{greeting()}</h1>

      <div className="chips" role="group" aria-label="Filtrar por género">
        <button type="button" className={`chip ${genre ? '' : 'is-on'}`} aria-pressed={!genre} onClick={() => setGenre(null)}>
          Todas
        </button>
        {presentGenres.map((g) => (
          <button
            key={g.key}
            type="button"
            className={`chip ${genre === g.key ? 'is-on' : ''}`}
            aria-pressed={genre === g.key}
            onClick={() => setGenre(genre === g.key ? null : g.key)}
          >
            {g.label}
          </button>
        ))}
      </div>

      {genre ? (
        <ul className="slist">
          {stations.filter((s) => s.genre === genre).map((s) => <StationRow key={s.slug} station={s} />)}
        </ul>
      ) : (
        <>
          <ul className="quick">
            {quick.map((s) => {
              const isCurrent = current?.slug === s.slug;
              return (
                <li key={s.slug}>
                  <button
                    type="button"
                    className={`quick__item ${isCurrent ? 'is-current' : ''}`}
                    onClick={() => (isCurrent ? toggle() : play(s))}
                    aria-label={isCurrent && status === 'playing' ? `Pausar ${s.name}` : `Reproducir ${s.name}`}
                  >
                    <Artwork station={s} className="art--quick" />
                    <span>{s.name.replace(/ (?=\S+$)/, '\u00a0')}</span>
                    {isCurrent && status === 'playing' && <span className="eq" aria-hidden="true"><i /><i /><i /></span>}
                  </button>
                </li>
              );
            })}
          </ul>

          <Row title="Escuchadas hace poco" stations={recents} />
          <Row title="Tus favoritas" stations={favs} />
          <Row title="Lo más escuchado" stations={popular} />
          {presentGenres.map((g) => (
            <Row key={g.key} title={g.label} stations={stations.filter((s) => s.genre === g.key)} />
          ))}
        </>
      )}

      <footer className="foot">
        <p className="foot__legal">
          Directorio independiente. cabiplay no transmite ni aloja audio: cada
          señal viaja desde el servidor de su emisora.{' '}
          <Link to="/creditos#aviso-legal">Aviso legal</Link>
        </p>
        <p className="credit">
          Hecho con <span className="credit__heart">&hearts;</span> por{' '}
          <Link to="/creditos">Yender</Link>
        </p>
      </footer>
    </main>
  );
}
