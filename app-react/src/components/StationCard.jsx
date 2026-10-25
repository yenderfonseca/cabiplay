import { Link } from 'react-router-dom';
import Artwork from './Artwork.jsx';
import { Play, Pause, Listeners } from '../lib/icons.jsx';
import { usePlayer } from '../lib/PlayerContext.jsx';

// Shelf card. Likes live in the player and the station sheet, not on every
// cover: a heart on each tile competed with the play button for the thumb.
export default function StationCard({ station }) {
  const { current, status, play, toggle, stats } = usePlayer();
  const isCurrent = current?.slug === station.slug;
  const isPlaying = isCurrent && status === 'playing';
  const listeners = stats[station.slug]?.listeners || 0;

  return (
    <article className={`card ${isCurrent ? 'card--active' : ''}`}>
      <Link to={`/estacion/${station.slug}`} className="card__art-link" aria-label={station.name}>
        <Artwork station={station} />
        {listeners > 0 && (
          <span className="card__live" title={`${listeners} escuchando`}>
            <Listeners size={12} />
            {listeners}
          </span>
        )}
      </Link>

      <button
        type="button"
        className="card__play"
        aria-label={isPlaying ? `Pausar ${station.name}` : `Reproducir ${station.name}`}
        onClick={() => (isCurrent ? toggle() : play(station))}
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </button>

      <div className="card__meta">
        <Link to={`/estacion/${station.slug}`} className="card__name">
          {station.name}
        </Link>
        <span className="card__dial">{station.frequency || 'Online'}</span>
      </div>
    </article>
  );
}
