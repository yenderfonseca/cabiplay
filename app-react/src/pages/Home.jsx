import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Row from '../components/Row.jsx';
import { usePlayer } from '../lib/PlayerContext.jsx';
import { useStats } from '../lib/useStats.js';
import { Info, Radio } from '../lib/icons.jsx';

const GENRES = [
  ['urbano', 'Urbano'],
  ['gaitas', 'Gaitas y tradición'],
  ['tropical', 'Salsa y tropical'],
  ['pop', 'Pop y variada'],
  ['recuerdos', 'Recuerdos'],
  ['noticias', 'Noticias y opinión'],
  ['cristiana', 'Cristiana'],
];

export default function Home() {
  const { stations, current } = usePlayer();
  const { stats, liked, like } = useStats(current?.slug);

  // Popularity = likes first, then live listeners. Stations nobody has rated
  // yet keep their catalogue order instead of jumping around at random.
  const popular = useMemo(() => {
    const score = (s) => (stats[s.slug]?.likes || 0) * 10 + (stats[s.slug]?.listeners || 0);
    return [...stations].filter((s) => score(s) > 0).sort((a, b) => score(b) - score(a)).slice(0, 10);
  }, [stations, stats]);

  const favs = useMemo(
    () => stations.filter((s) => liked.includes(s.slug)),
    [stations, liked],
  );

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
        <span className="brand">
          <Radio size={22} />
          <span>
            cabi<b>play</b>
          </span>
        </span>
        <Link to="/creditos" className="icon-btn" aria-label="Créditos y cómo se hizo">
          <Info size={20} />
        </Link>
      </header>

      <p className="masthead__sub">Radio en vivo de Cabimas</p>

      <Row title="Tus favoritas" stations={favs} stats={stats} liked={liked} onLike={like} />
      <Row title="Lo más escuchado" stations={popular} stats={stats} liked={liked} onLike={like} />

      {GENRES.map(([key, label]) => (
        <Row
          key={key}
          title={label}
          stations={stations.filter((s) => s.genre === key)}
          stats={stats}
          liked={liked}
          onLike={like}
        />
      ))}

      <p className="credit">
        Hecho con <span className="credit__heart">&hearts;</span> por{' '}
        <Link to="/creditos">Yender</Link>
      </p>
    </main>
  );
}
