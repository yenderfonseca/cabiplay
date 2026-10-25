// Genre order, labels and browse-tile colours. Tile colours are dark enough
// for white text to pass WCAG AA (>= 4.5:1).
export const GENRES = [
  { key: 'urbano', label: 'Urbano', color: '#b0124a' },
  { key: 'gaitas', label: 'Gaitas y\u00a0tradición', color: '#00703b' },
  { key: 'tropical', label: 'Salsa y tropical', color: '#b45309' },
  { key: 'pop', label: 'Pop y variada', color: '#0369a1' },
  { key: 'recuerdos', label: 'Recuerdos', color: '#c2410c' },
  { key: 'noticias', label: 'Noticias y opinión', color: '#334155' },
  { key: 'cristiana', label: 'Cristiana', color: '#6d28d9' },
];

export const genreLabel = (key) => GENRES.find((g) => g.key === key)?.label || key;
