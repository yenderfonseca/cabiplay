import { Link } from 'react-router-dom';
import Artwork from './Artwork.jsx';
import { Play, Pause, Heart, Listeners } from '../lib/icons.jsx';
import { usePlayer } from '../lib/PlayerContext.jsx';

export default function StationCard({ station, stats, liked, onLike }) {
  const { current, status, play, toggle } = usePlayer();
  const isCurrent = current?.slug === station.slug;
  const isPlaying = isCurrent && status === 'playing';
  const listeners = stats?.listeners || 0;

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
        <span className="card__dial">{station.frequency || 'WEB'}</span>
      </div>

      <button
        type="button"
        className={`card__like ${liked ? 'is-liked' : ''}`}
        aria-label={liked ? `Quitar me gusta a ${station.name}` : `Me gusta ${station.name}`}
        aria-pressed={liked}
        onClick={() => onLike(station.slug)}
      >
        <Heart size={15} active={liked} />
        {stats?.likes > 0 && <span>{stats.likes}</span>}
      </button>
    </article>
  );
}
