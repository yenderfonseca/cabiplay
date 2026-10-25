import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Artwork from '../components/Artwork.jsx';
import { usePlayer } from '../lib/PlayerContext.jsx';
import { useStoryShare } from '../lib/useStoryShare.js';
import {
  Play, Pause, Heart, Share, Instagram, WhatsApp, Globe, Facebook, Back, Listeners, Spinner,
} from '../lib/icons.jsx';

export default function Station() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { stations, current, status, play, toggle, stats, liked, like } = usePlayer();
  const [copied, setCopied] = useState(false);

  const station = stations.find((s) => s.slug === slug);
  const story = useStoryShare(station);

  // Deep links are the point of this page, so the title has to reflect the
  // station even before anyone presses play.
  useEffect(() => {
    if (!station) return;
    const prev = document.title;
    document.title = `${station.name} · cabiplay`;
    return () => {
      document.title = prev;
    };
  }, [station]);

  if (!stations.length) return <main className="page"><p className="muted">Cargando…</p></main>;

  if (!station) {
    return (
      <main className="page">
        <p className="muted">Esa emisora no está en el directorio.</p>
        <Link to="/" className="btn">Volver</Link>
      </main>
    );
  }

  const isCurrent = current?.slug === station.slug;
  const playing = isCurrent && status === 'playing';
  const tuning = isCurrent && status === 'tuning';
  const st = stats[station.slug] || {};
  const socials = station.socials || {};

  const share = async () => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}estacion/${station.slug}`;
    const data = { title: station.name, text: `Escucha ${station.name} en vivo`, url };
    // Native sheet on phones; clipboard is the desktop fallback.
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        /* user dismissed the sheet */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; nothing else to do */
    }
  };

  return (
    <main className="page station" style={{ '--st': station.theme_color || '#1a2430' }}>
      <button type="button" className="icon-btn station__back" onClick={() => navigate(-1)} aria-label="Volver">
        <Back size={20} />
      </button>

      <Artwork station={station} className="art--hero" />

      <h1 className="station__name">{station.name}</h1>
      <p className="station__dial">
        {station.frequency || 'WEB'} · Cabimas
        {st.listeners > 0 && (
          <>
            {' · '}
            <span className="station__live">
              <Listeners size={13} /> {st.listeners}
            </span>
          </>
        )}
      </p>

      <div className="station__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => (isCurrent ? toggle() : play(station))}
          aria-label={playing ? 'Pausar' : 'Reproducir'}
        >
          {tuning ? <Spinner size={22} /> : playing ? <Pause size={22} /> : <Play size={22} />}
          <span>{playing ? 'Pausar' : 'Escuchar'}</span>
        </button>

        <button
          type="button"
          className={`icon-btn icon-btn--lg ${liked.includes(station.slug) ? 'is-liked' : ''}`}
          onClick={() => like(station.slug)}
          aria-pressed={liked.includes(station.slug)}
          aria-label={liked.includes(station.slug) ? 'Quitar de favoritas' : 'Guardar en favoritas'}
        >
          <Heart size={20} active={liked.includes(station.slug)} />
        </button>

        <button type="button" className="icon-btn icon-btn--lg" onClick={share} aria-label="Compartir enlace">
          <Share size={20} />
        </button>

        <button type="button" className="icon-btn icon-btn--lg" onClick={story.share} aria-label="Compartir en tu historia de Instagram">
          <Instagram size={20} />
        </button>
      </div>

      {(copied || story.note) && <p className="toast" role="status">{story.note || 'Enlace copiado'}</p>}

      {station.description && <p className="station__about">{station.description}</p>}

      {(socials.instagram || socials.whatsapp || socials.website || socials.facebook) && (
        <nav className="station__socials" aria-label="Redes de la emisora">
          {socials.instagram && (
            <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="icon-btn icon-btn--lg" aria-label="Instagram">
              <Instagram size={20} />
            </a>
          )}
          {socials.whatsapp && (
            <a href={socials.whatsapp} target="_blank" rel="noopener noreferrer" className="icon-btn icon-btn--lg" aria-label="WhatsApp de cabina">
              <WhatsApp size={20} />
            </a>
          )}
          {socials.facebook && (
            <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="icon-btn icon-btn--lg" aria-label="Facebook">
              <Facebook size={20} />
            </a>
          )}
          {socials.website && (
            <a href={socials.website} target="_blank" rel="noopener noreferrer" className="icon-btn icon-btn--lg" aria-label="Sitio web">
              <Globe size={20} />
            </a>
          )}
        </nav>
      )}
    </main>
  );
}
