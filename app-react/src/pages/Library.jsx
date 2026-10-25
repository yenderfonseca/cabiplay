import { useState } from 'react';
import { Link } from 'react-router-dom';
import StationRow from '../components/StationRow.jsx';
import { usePlayer } from '../lib/PlayerContext.jsx';

export default function Library() {
  const { stations, liked, recent } = usePlayer();
  const [tab, setTab] = useState('favs');
  const bySlug = Object.fromEntries(stations.map((s) => [s.slug, s]));
  const list = (tab === 'favs' ? liked : recent).map((slug) => bySlug[slug]).filter(Boolean);

  return (
    <main className="page">
      <h1 className="page__title">Tu biblioteca</h1>
      <div className="chips" role="group" aria-label="Ver">
        <button type="button" className={`chip ${tab === 'favs' ? 'is-on' : ''}`} aria-pressed={tab === 'favs'} onClick={() => setTab('favs')}>
          Favoritas
        </button>
        <button type="button" className={`chip ${tab === 'recent' ? 'is-on' : ''}`} aria-pressed={tab === 'recent'} onClick={() => setTab('recent')}>
          Recientes
        </button>
      </div>

      {list.length ? (
        <ul className="slist">
          {list.map((s) => <StationRow key={s.slug} station={s} />)}
        </ul>
      ) : (
        <div className="empty">
          <p>
            {tab === 'favs'
              ? 'Toca el corazón en el reproductor para guardar tus emisoras aquí.'
              : 'Las emisoras que escuches aparecerán aquí.'}
          </p>
          <Link to="/" className="btn btn--primary">Explorar emisoras</Link>
        </div>
      )}
    </main>
  );
}
