import { useCallback, useEffect, useRef, useState } from 'react';
import { storyBlob } from './art.js';

/**
 * "Compartir en tu historia". Instagram's own Stories API is native-app only,
 * so the web version renders a 1080x1920 story image and hands it to the
 * system share sheet, where Instagram > Historia is one tap.
 *
 * The image is rendered ahead of time: Safari only allows navigator.share()
 * inside the tap itself, and awaiting a canvas render first would lose that.
 * The station link goes to the clipboard in the same tap, ready for the
 * link sticker.
 */
export function useStoryShare(station) {
  const fileRef = useRef(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    fileRef.current = null;
    if (!station) return;
    let alive = true;
    storyBlob(station)
      .then((blob) => {
        if (alive && blob) fileRef.current = new File([blob], `cabiplay-${station.slug}.png`, { type: 'image/png' });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [station]);

  const flash = (text) => {
    setNote(text);
    setTimeout(() => setNote(''), 3500);
  };

  const share = useCallback(async () => {
    if (!station) return;
    const url = `${window.location.origin}${import.meta.env.BASE_URL}estacion/${station.slug}`;
    // Not awaited: both calls must start inside the same tap.
    const copied = navigator.clipboard?.writeText(url).then(() => true, () => false) || Promise.resolve(false);

    let file = fileRef.current;
    if (!file) {
      const blob = await storyBlob(station);
      file = new File([blob], `cabiplay-${station.slug}.png`, { type: 'image/png' });
    }

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: `${station.name} en cabiplay` });
        if (await copied) flash('Enlace copiado: pégalo en el sticker de enlace de tu historia.');
        if (window.gtag) window.gtag('event', 'share', { method: 'story', content_type: 'station', item_id: station.slug });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return; // sheet dismissed
      }
    }

    // Desktop and browsers without file sharing: download the image instead.
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    flash((await copied) ? 'Imagen descargada y enlace copiado. Súbela a tu historia.' : 'Imagen descargada. Súbela a tu historia.');
  }, [station]);

  return { share, note };
}
