import Artwork from './Artwork.jsx';
import { usePlayer } from '../lib/PlayerContext.jsx';
import { Play, Pause, Prev, Next, Shuffle, Spinner, Heart } from '../lib/icons.jsx';

export const statusText = (status, elapsed) => {
  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  if (status === 'error') return 'Señal no disponible';
  if (status === 'tuning') return 'Sintonizando';
  if (status === 'playing') return `En vivo · ${mmss}`;
  return 'En pausa';
};

// Floating mini player. Tapping the station opens the full-screen sheet.
export default function PlayerBar() {
  const { current, status, elapsed, toggle, step, shuffle, liked, like, setExpanded } = usePlayer();
  if (!current) return null;

  const playing = status === 'playing';
  const isLiked = liked.includes(current.slug);

  return (
    <div className="player" role="region" aria-label="Reproductor" style={{ '--st': current.theme_color || '#1a2430' }}>
      <button type="button" className="player__id" onClick={() => setExpanded(true)} aria-label={`Abrir ${current.name} en pantalla completa`}>
        <Artwork station={current} className="art--mini" />
        <span className="player__text">
          <strong>{current.name}</strong>
          <span className={`player__status player__status--${status}`}>
            {playing && <span className="eq" aria-hidden="true"><i /><i /><i /></span>}
            {statusText(status, elapsed)}
          </span>
        </span>
      </button>

      <div className="player__controls">
        <button type="button" onClick={shuffle} aria-label="Emisora aleatoria" className="icon-btn player__wide">
          <Shuffle size={18} />
        </button>
        <button type="button" onClick={() => step(-1)} aria-label="Anterior" className="icon-btn player__wide">
          <Prev size={20} />
        </button>
        <button
          type="button"
          onClick={() => like(current.slug)}
          aria-pressed={isLiked}
          aria-label={isLiked ? 'Quitar de favoritas' : 'Guardar en favoritas'}
          className={`icon-btn player__narrow ${isLiked ? 'is-liked' : ''}`}
        >
          <Heart size={22} active={isLiked} />
        </button>
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pausar' : 'Reproducir'}
          className="icon-btn player__play"
        >
          {status === 'tuning' ? <Spinner size={22} /> : playing ? <Pause size={22} /> : <Play size={22} />}
        </button>
        <button type="button" onClick={() => step(1)} aria-label="Siguiente" className="icon-btn player__wide">
          <Next size={20} />
        </button>
      </div>
    </div>
  );
}
