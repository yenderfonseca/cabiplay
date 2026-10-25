import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import StationRow from '../components/StationRow.jsx';
import { usePlayer } from '../lib/PlayerContext.jsx';
import { GENRES, genreLabel } from '../lib/genres.js';
import { Search as SearchIcon } from '../lib/icons.jsx';

// Accent-insensitive, so "zulianisima" finds "Zulianísima".
const fold = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Search() {
  const { stations } = usePlayer();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const g = params.get('g') || '';

  const results = useMemo(() => {
    const needle = fold(q.trim());
    return stations.filter((s) => {
      if (g && s.genre !== g) return false;
      if (!needle) return true;
      return [s.name, s.frequency, s.dial, s.sector, genreLabel(s.genre), ...(s.tags || [])].some((f) => fold(String(f || '')).includes(needle));
    });
  }, [stations, q, g]);

  const set = (next) => setParams(Object.fromEntries(Object.entries({ q, g, ...next }).filter(([, v]) => v)), { replace: true });
  const browsing = !q.trim() && !g;

  return (
    <main className="page">
      <h1 className="page__title">Buscar</h1>
      <label className="search">
        <SearchIcon size={20} />
        <span className="sr-only">Buscar emisora</span>
        <input
          type="search"
          value={q}
          onChange={(e) => set({ q: e.target.value })}
          placeholder="Emisora, frecuencia o sector"
          enterKeyHint="search"
          autoComplete="off"
        />
      </label>

      {browsing ? (
        <>
          <h2 className="row__title">Explorar por género</h2>
          <ul className="tiles">
            {GENRES.filter((x) => stations.some((s) => s.genre === x.key)).map((x) => (
              <li key={x.key}>
                <button type="button" className="tile" style={{ background: x.color }} onClick={() => set({ g: x.key })}>
                  {x.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          {g && (
            <div className="chips">
              <button type="button" className="chip is-on" onClick={() => set({ g: '' })} aria-label={`Quitar filtro ${genreLabel(g)}`}>
                {genreLabel(g)} ✕
              </button>
            </div>
          )}
          {results.length ? (
            <ul className="slist">
              {results.map((s) => <StationRow key={s.slug} station={s} />)}
            </ul>
          ) : (
            <p className="empty">No encontramos "{q}". Prueba con el nombre o el número del dial, por ejemplo&nbsp;98.9.</p>
          )}
        </>
      )}
    </main>
  );
}
