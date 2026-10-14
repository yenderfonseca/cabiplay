const BASE = import.meta.env.BASE_URL;

/**
 * The dial needle. The one thing a radio does is tune, so that is the mark:
 * a golden needle (the flag's sun) crossing a celeste scale (the lake and sky).
 * The trailing bars fade because the dial continues past whatever is tuned.
 *
 * Drawn inline rather than loaded as an <img> so it inherits size from the
 * layout and never flashes unstyled while the asset loads.
 */
export function Mark({ size = 26 }) {
  return (
    <svg
      width={(size * 62) / 56}
      height={size}
      viewBox="0 0 62 56"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="var(--celeste)" strokeWidth="3" strokeLinecap="round">
        <line x1="7" y1="21" x2="7" y2="35" />
        <line x1="19" y1="16" x2="19" y2="40" />
      </g>
      <line x1="31" y1="7" x2="31" y2="49" stroke="var(--sun)" strokeWidth="3.8" strokeLinecap="round" />
      <circle cx="31" cy="7" r="5" fill="var(--sun)" />
      <g stroke="var(--celeste)" strokeWidth="3" strokeLinecap="round" opacity="0.45">
        <line x1="43" y1="16" x2="43" y2="40" />
        <line x1="55" y1="21" x2="55" y2="35" />
      </g>
    </svg>
  );
}

export default function Logo({ size = 26 }) {
  return (
    <span className="logo">
      <Mark size={size} />
      <span className="logo__word">
        cabi<span className="logo__word-accent">play</span>
      </span>
    </span>
  );
}

export { BASE };
