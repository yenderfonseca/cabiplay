import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';

const PlayerContext = createContext(null);
export const usePlayer = () => useContext(PlayerContext);

const BASE = import.meta.env.BASE_URL;

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  if (audioRef.current === null && typeof Audio !== 'undefined') {
    audioRef.current = new Audio();
    audioRef.current.preload = 'none';
  }

  const [stations, setStations] = useState([]);
  const [current, setCurrent] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | tuning | playing | error
  const [elapsed, setElapsed] = useState(0);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cabiplay_favorites') || '[]');
    } catch {
      return [];
    }
  });

  // Tracks which tune-in an async callback belongs to. Tearing down the
  // previous stream fires a spurious `error`; without this guard it would
  // surface as a failure on the station the user just picked.
  const genRef = useRef(0);
  const hlsRef = useRef(null);

  useEffect(() => {
    let alive = true;
    fetch(`${BASE}data/stations.json`, { cache: 'no-cache' })
      .then((r) => r.json())
      .then((d) => alive && setStations(d))
      .catch(() => alive && setStations([]));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('cabiplay_favorites', JSON.stringify(favorites));
    } catch {
      /* private mode: favourites simply do not persist */
    }
  }, [favorites]);

  const play = useCallback(async (station) => {
    const audio = audioRef.current;
    if (!audio || !station) return;
    const gen = ++genRef.current;

    setCurrent(station);
    setStatus('tuning');
    setElapsed(0);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    audio.pause();
    audio.removeAttribute('src');
    audio.load();

    const url = station.stream_url;
    if (!url) {
      setStatus('error');
      return;
    }

    try {
      if (url.includes('.m3u8')) {
        const { default: Hls } = await import('hls.js');
        if (gen !== genRef.current) return;
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true });
          hlsRef.current = hls;
          hls.loadSource(url);
          hls.attachMedia(audio);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (gen === genRef.current) audio.play().catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (_e, data) => {
            if (data.fatal && gen === genRef.current) setStatus('error');
          });
          return;
        }
      }
      audio.src = url;
      await audio.play();
    } catch (err) {
      if (gen !== genRef.current) return;
      // An autoplay rejection is not a dead stream; the user just has to tap.
      setStatus(err && err.name === 'NotAllowedError' ? 'idle' : 'error');
    }
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }, [current]);

  const step = useCallback(
    (delta) => {
      if (!stations.length) return;
      const i = stations.findIndex((s) => s.slug === current?.slug);
      const next = stations[(i + delta + stations.length) % stations.length];
      play(next);
    },
    [stations, current, play],
  );

  const shuffle = useCallback(() => {
    if (!stations.length) return;
    const pool = stations.filter((s) => s.slug !== current?.slug);
    play(pool[Math.floor(Math.random() * pool.length)] || stations[0]);
  }, [stations, current, play]);

  const toggleFavorite = useCallback((slug) => {
    setFavorites((f) => (f.includes(slug) ? f.filter((x) => x !== slug) : [...f, slug]));
  }, []);

  // Audio element events drive status, so external pauses (headphones, OS
  // controls, interruptions) stay in sync with the UI.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlaying = () => setStatus('playing');
    const onPause = () => setStatus((s) => (s === 'error' ? s : 'idle'));
    const onError = () => {
      if (audio.src) setStatus('error');
    };
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
    };
  }, []);

  useEffect(() => {
    if (status !== 'playing') return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  // Lock screen / CarPlay / Android Auto metadata.
  useEffect(() => {
    if (!('mediaSession' in navigator) || !current) return;
    const art = current.logo_local || current.logo;
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: current.name,
      artist: `${current.frequency || 'WEB'} · Cabimas`,
      album: 'cabiplay',
      artwork: art
        ? [96, 192, 512].map((s) => ({
            src: `${BASE}${art}`,
            sizes: `${s}x${s}`,
            type: art.endsWith('.jpg') ? 'image/jpeg' : 'image/png',
          }))
        : [],
    });
    navigator.mediaSession.playbackState = status === 'playing' ? 'playing' : 'paused';
    const set = (k, fn) => {
      try {
        navigator.mediaSession.setActionHandler(k, fn);
      } catch {
        /* not every browser supports every action */
      }
    };
    set('play', () => audioRef.current?.play().catch(() => {}));
    set('pause', () => audioRef.current?.pause());
    set('previoustrack', () => step(-1));
    set('nexttrack', () => step(1));
  }, [current, status, step]);

  const value = useMemo(
    () => ({
      stations,
      current,
      status,
      elapsed,
      favorites,
      play,
      toggle,
      step,
      shuffle,
      toggleFavorite,
      audio: audioRef.current,
    }),
    [stations, current, status, elapsed, favorites, play, toggle, step, shuffle, toggleFavorite],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
