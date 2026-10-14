import StationCard from './StationCard.jsx';

// A genre gets its own horizontally scrollable shelf, so each has room to
// breathe instead of everything collapsing into one long grid.
export default function Row({ title, stations, stats, liked, onLike }) {
  if (!stations.length) return null;
  return (
    <section className="row">
      <h2 className="row__title">{title}</h2>
      <div className="row__scroller">
        {stations.map((s) => (
          <StationCard
            key={s.slug}
            station={s}
            stats={stats[s.slug]}
            liked={liked.includes(s.slug)}
            onLike={onLike}
          />
        ))}
      </div>
    </section>
  );
}
