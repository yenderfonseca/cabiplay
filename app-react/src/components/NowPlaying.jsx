import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Artwork from './Artwork.jsx';
import { statusText } from './PlayerBar.jsx';
import { usePlayer } from '../lib/PlayerContext.jsx';
import { genreLabel } from '../lib/genres.js';
import { useStoryShare } from '../lib/useStoryShare.js';
import { Play, Pause, Prev, Next, Shuffle, Spinner, Heart, Share, ChevronDown, Instagram } from '../lib/icons.jsx';

// Full-screen "Sonando ahora", tinted with the station's own colour.
// Closes with the chevron, Escape, a downward swipe, or any navigation.
export default function NowPlaying() {
  const { current, status, elapsed, toggle, step, shuffle, liked, like, expanded, setExpanded } = usePlayer();
  const { pathname } = useLocation();
  const [copied, setCopied] = useState(false);
  const story = useStoryShare(expanded ? current : null);
  const closeRef = useRef(null);
  const touchY = useRef(null);
  const close = () => setExpanded(false);

  useEffect(() => { close(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!expanded) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [expanded]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!expanded || !current) return null;

  const playing = status === 'playing';
  const isLiked = liked.includes(current.slug);

  const share = async () => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}estacion/${current.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: current.name, text: `Escucha ${current.name} en vivo`, url });
        return;
      } catch {
        /* sheet dismissed */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div
      className="np"
      role="dialog"
      aria-modal="true"
      aria-label={`Sonando ahora: ${current.name}`}
      style={{ '--st': current.theme_color || '#1a2430' }}
      onTouchStart={(e) => { touchY.current = e.touches[0].clientY; }}
      onTouchEnd={(e) => {
        if (touchY.current !== null && e.changedTouches[0].clientY - touchY.current > 90) close();
        touchY.current = null;
      }}
    >
      <header className="np__head">
        <button type="button" ref={closeRef} className="icon-btn" onClick={close} aria-label="Cerrar">
          <ChevronDown size={26} />
        </button>
        <span className="np__context">
          <small>Sonando desde</small>
          <b>Cabimas · {genreLabel(current.genre)}</b>
        </span>
        <span className="np__spacer" />
      </header>

      <Artwork station={current} className="art--np" />

      <div className="np__title">
        <div>
          <h2>{current.name}</h2>
          <p>{current.frequency || 'Señal online'}{current.sector ? ` · ${current.sector}` : ''}</p>
        </div>
        <button
          type="button"
          onClick={() => like(current.slug)}
          aria-pressed={isLiked}
          aria-label={isLiked ? 'Quitar de favoritas' : 'Guardar en favoritas'}
          className={`icon-btn ${isLiked ? 'is-liked' : ''}`}
        >
          <Heart size={26} active={isLiked} />
        </button>
      </div>

      <div className={`np__live np__live--${status}`}>
        <span className="np__track"><span /></span>
        <span className="np__live-text">
          {playing && <span className="eq" aria-hidden="true"><i /><i /><i /></span>}
          {statusText(status, elapsed)}
        </span>
      </div>

      <div className="np__controls">
        <button type="button" className="icon-btn" onClick={shuffle} aria-label="Emisora aleatoria">
          <Shuffle size={22} />
        </button>
        <button type="button" className="icon-btn icon-btn--xl" onClick={() => step(-1)} aria-label="Anterior">
          <Prev size={30} />
        </button>
        <button type="button" className="np__play" onClick={toggle} aria-label={playing ? 'Pausar' : 'Reproducir'}>
          {status === 'tuning' ? <Spinner size={30} /> : playing ? <Pause size={30} /> : <Play size={30} />}
        </button>
        <button type="button" className="icon-btn icon-btn--xl" onClick={() => step(1)} aria-label="Siguiente">
          <Next size={30} />
        </button>
        <button type="button" className="icon-btn" onClick={share} aria-label="Compartir">
          <Share size={22} />
        </button>
      </div>

      <button type="button" className="np__story" onClick={story.share}>
        <Instagram size={20} />
        Compartir en tu&nbsp;historia
      </button>

      {(copied || story.note) && <p className="toast np__toast" role="status">{story.note || 'Enlace copiado'}</p>}

      <Link to={`/estacion/${current.slug}`} className="np__more">
        Ver la ficha de la&nbsp;emisora
      </Link>
    </div>
  );
}
