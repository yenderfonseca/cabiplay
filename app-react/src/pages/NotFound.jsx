import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="page">
      <h1 className="station__name">Nada por aquí</h1>
      <p className="muted">Esta página no existe en cabiplay.</p>
      <Link to="/" className="btn">Ir al directorio</Link>
    </main>
  );
}
