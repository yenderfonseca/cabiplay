import { Link } from 'react-router-dom';
import Artwork from './Artwork.jsx';
import { usePlayer } from '../lib/PlayerContext.jsx';
import { Play, Pause, Prev, Next, Shuffle, Spinner } from '../lib/icons.jsx';

const mmss = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function PlayerBar() {
  const { current, status, elapsed, toggle, step, shuffle } = usePlayer();
  if (!current) return null;

  const playing = status === 'playing';
  const tuning = status === 'tuning';

  return (
    <footer className="player" role="region" aria-label="Reproductor">
      <Link to={`/estacion/${current.slug}`} className="player__id">
        <Artwork station={current} className="art--mini" />
        <span className="player__text">
          <strong>{current.name}</strong>
          <span className={`player__status player__status--${status}`}>
            {status === 'error'
              ? 'Señal no disponible'
              : tuning
                ? 'Sintonizando'
                : playing
                  ? `En vivo · ${mmss(elapsed)}`
                  : 'En pausa'}
          </span>
        </span>
      </Link>

      <div className="player__controls">
        <button type="button" onClick={shuffle} aria-label="Emisora aleatoria" className="icon-btn">
          <Shuffle size={18} />
        </button>
        <button type="button" onClick={() => step(-1)} aria-label="Anterior" className="icon-btn">
          <Prev size={20} />
        </button>
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pausar' : 'Reproducir'}
          className="icon-btn icon-btn--primary"
        >
          {tuning ? <Spinner size={22} /> : playing ? <Pause size={22} /> : <Play size={22} />}
        </button>
        <button type="button" onClick={() => step(1)} aria-label="Siguiente" className="icon-btn">
          <Next size={20} />
        </button>
      </div>
    </footer>
  );
}
