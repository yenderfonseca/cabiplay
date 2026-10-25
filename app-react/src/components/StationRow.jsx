import Artwork from './Artwork.jsx';
import { usePlayer } from '../lib/PlayerContext.jsx';
import { genreLabel } from '../lib/genres.js';
import { Play, Pause, Heart } from '../lib/icons.jsx';

// List row for search, library and genre views. The whole row tunes in:
// on a radio app the obvious tap is "play this", not "open a details page".
export default function StationRow({ station }) {
  const { current, status, play, toggle, liked } = usePlayer();
  const isCurrent = current?.slug === station.slug;
  const isPlaying = isCurrent && status === 'playing';

  return (
    <li>
      <button
        type="button"
        className={`srow ${isCurrent ? 'srow--active' : ''}`}
        onClick={() => (isCurrent ? toggle() : play(station))}
        aria-label={isPlaying ? `Pausar ${station.name}` : `Reproducir ${station.name}`}
      >
        <Artwork station={station} className="art--row" />
        <span className="srow__text">
          <strong>{station.name}</strong>
          <span>
            {liked.includes(station.slug) && <Heart size={11} active className="srow__liked" />}
            {station.frequency || 'Online'} · {genreLabel(station.genre)}
          </span>
        </span>
        <span className="srow__icon" aria-hidden="true">
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </span>
      </button>
    </li>
  );
}
