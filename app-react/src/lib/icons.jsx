// Inline SVG icon set. No emoji and no icon font: these inherit colour through
// currentColor, stay crisp at any density, and add no network request.
const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const Svg = ({ size = 20, children, filled = false, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    {...(filled ? { fill: 'currentColor' } : stroke)}
    {...rest}
  >
    {children}
  </svg>
);

export const Play = (p) => (
  <Svg filled {...p}>
    <path d="M8 5.14v13.72a1 1 0 0 0 1.53.85l10.74-6.86a1 1 0 0 0 0-1.7L9.53 4.29A1 1 0 0 0 8 5.14z" />
  </Svg>
);

export const Pause = (p) => (
  <Svg filled {...p}>
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </Svg>
);

export const Prev = (p) => (
  <Svg filled {...p}>
    <path d="M6 5h2v14H6z" />
    <path d="M19 5.5v13a1 1 0 0 1-1.54.84l-9.2-6.5a1 1 0 0 1 0-1.68l9.2-6.5A1 1 0 0 1 19 5.5z" />
  </Svg>
);

export const Next = (p) => (
  <Svg filled {...p}>
    <path d="M16 5h2v14h-2z" />
    <path d="M5 5.5v13a1 1 0 0 0 1.54.84l9.2-6.5a1 1 0 0 0 0-1.68l-9.2-6.5A1 1 0 0 0 5 5.5z" />
  </Svg>
);

export const Shuffle = (p) => (
  <Svg {...p}>
    <path d="M16 3h5v5" />
    <path d="M4 20 21 3" />
    <path d="M21 16v5h-5" />
    <path d="m15 15 6 6" />
    <path d="m4 4 5 5" />
  </Svg>
);

export const Heart = ({ active = false, ...p }) => (
  <Svg {...p} {...(active ? { fill: 'currentColor', stroke: 'currentColor' } : {})}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </Svg>
);

export const Share = (p) => (
  <Svg {...p}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="m8.59 13.51 6.83 3.98" />
    <path d="m15.41 6.51-6.82 3.98" />
  </Svg>
);

export const Instagram = (p) => (
  <Svg {...p}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </Svg>
);

export const WhatsApp = (p) => (
  <Svg {...p}>
    <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z" />
    <path d="M8.9 9.2c.3 2.4 2.6 4.6 5 4.9l.9-1.4 1.8.8c-.3 1.2-1.6 1.8-2.8 1.5-2.8-.6-5.3-3.1-5.9-5.9-.3-1.2.3-2.5 1.5-2.8l.8 1.8z" />
  </Svg>
);

export const Globe = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z" />
  </Svg>
);

export const Facebook = (p) => (
  <Svg {...p}>
    <path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H6v3h2v8h3v-8h2.5l.5-3H11V7.5a1.5 1.5 0 0 1 1.5-1.5H15z" />
  </Svg>
);

export const Back = (p) => (
  <Svg {...p}>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </Svg>
);

export const ChevronDown = (p) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const Radio = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="2" />
    <path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14" />
  </Svg>
);

export const Listeners = (p) => (
  <Svg {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Svg>
);

export const Info = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </Svg>
);

export const Spinner = (p) => (
  <Svg {...p} className="spin">
    <path d="M21 12a9 9 0 1 1-6.22-8.56" />
  </Svg>
);

export const Home = ({ active = false, ...p }) => (
  <Svg {...p} {...(active ? { fill: 'currentColor' } : {})}>
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </Svg>
);

export const Search = ({ active, ...p }) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);

export const Library = ({ active, ...p }) => (
  <Svg {...p}>
    <path d="M4 4v16M9 4v16" />
    <path d="m14 4.5 5.5 15" />
  </Svg>
);
