import { useState } from 'react';

const BASE = import.meta.env.BASE_URL;

// Stations without a real logo get generated artwork built from their dial
// number, so a card is never an empty grey box.
function Fallback({ station }) {
  const dial = station.dial || (station.frequency || '').replace(/[^\d.]/g, '');
  return (
    <div className="art-fallback" aria-hidden="true">
      <span className="art-fallback__dial">{dial || 'WEB'}</span>
      <span className="art-fallback__band">{dial ? 'FM' : 'ONLINE'}</span>
    </div>
  );
}

export default function Artwork({ station, className = '' }) {
  const src = station.logo_local || station.logo;
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`art ${className}`}>
        <Fallback station={station} />
      </div>
    );
  }

  return (
    <div className={`art ${className}`}>
      <img
        src={`${BASE}${src}`}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        // Wide lockups must not be cropped; square marks may fill the tile.
        style={{ objectFit: station.logo_fit === 'contain' ? 'contain' : 'cover' }}
      />
    </div>
  );
}
