import { useCallback, useEffect, useState } from 'react';

// Vercel serves functions from /api/<path>, which is a site-root route and is
// NOT under the app's /cabiplay base.
const API = '/api/cabiplay/stats';
const LIKED_KEY = 'cabiplay_liked';

const readLiked = () => {
  try {
    return JSON.parse(localStorage.getItem(LIKED_KEY) || '[]');
  } catch {
    return [];
  }
};

/**
 * Likes are shared state held server side, so the count is the same for
 * everyone. Which stations *this* visitor liked is kept locally, so the
 * heart renders correctly without needing accounts.
 *
 * Listener counts are estimates: the server counts heartbeats from sessions
 * active in the last few minutes. It is a live-ish signal, not analytics.
 */
export function useStats(currentSlug) {
  const [stats, setStats] = useState({});
  const [liked, setLiked] = useState(readLiked);
  const [online, setOnline] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch(API, { cache: 'no-store' });
      if (!r.ok) throw new Error(String(r.status));
      setStats(await r.json());
      setOnline(true);
    } catch {
      // No backend yet (or offline): the UI degrades to local-only hearts
      // rather than showing wrong shared numbers.
      setOnline(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  // Heartbeat: tells the server this session is listening to `currentSlug`.
  useEffect(() => {
    if (!currentSlug) return;
    let cancelled = false;
    const beat = () => {
      fetch(`${API}?action=listening&slug=${encodeURIComponent(currentSlug)}`, {
        method: 'POST',
        keepalive: true,
      }).catch(() => {});
    };
    beat();
    const t = setInterval(() => !cancelled && beat(), 45000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [currentSlug]);

  const like = useCallback(
    async (slug) => {
      const has = liked.includes(slug);
      const next = has ? liked.filter((s) => s !== slug) : [...liked, slug];
      setLiked(next);
      try {
        localStorage.setItem(LIKED_KEY, JSON.stringify(next));
      } catch {
        /* private mode */
      }
      // Optimistic: reflect the change immediately, reconcile on next poll.
      setStats((s) => ({
        ...s,
        [slug]: { ...(s[slug] || {}), likes: Math.max(0, ((s[slug]?.likes) || 0) + (has ? -1 : 1)) },
      }));
      try {
        await fetch(`${API}?action=like&slug=${encodeURIComponent(slug)}&undo=${has ? 1 : 0}`, {
          method: 'POST',
        });
      } catch {
        /* keeps the local heart; the count reconciles when the API returns */
      }
    },
    [liked],
  );

  return { stats, liked, like, online };
}
