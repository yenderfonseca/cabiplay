import { Link } from 'react-router-dom';
import { usePlayer } from '../lib/PlayerContext.jsx';
import { Back, Radio, Listeners, Heart, Globe } from '../lib/icons.jsx';

export default function Credits() {
  const { stations } = usePlayer();
  const withLogo = stations.filter((s) => s.logo_local || s.logo).length;

  return (
    <main className="page">
      <Link to="/" className="icon-btn station__back" aria-label="Volver">
        <Back size={20} />
      </Link>

      <h1 className="station__name">Cómo se hizo</h1>
      <p className="station__about">
        cabiplay es un directorio abierto de la radio de Cabimas y la Costa Oriental del
        Lago. Reúne las señales que ya transmiten por internet y las pone en un solo
        lugar, sin instalar nada.
      </p>

      <ul className="facts">
        <li className="fact">
          <Radio size={18} />
          <span>
            <b>{stations.length}</b> emisoras en el directorio
          </span>
        </li>
        <li className="fact">
          <Globe size={18} />
          <span>
            <b>{withLogo}</b> con logotipo original de la emisora
          </span>
        </li>
        <li className="fact">
          <Listeners size={18} />
          <span>Oyentes en vivo estimados por sesiones activas</span>
        </li>
        <li className="fact">
          <Heart size={18} />
          <span>Los me gusta son públicos y ordenan lo más escuchado</span>
        </li>
      </ul>

      <h2 className="row__title">De dónde salen los datos</h2>
      <p className="station__about">
        Cada señal se verificó reproduciéndola en un navegador real, no solo
        comprobando que el servidor respondiera. Las emisoras que alojan su audio en
        Zeno.fm entregan un enlace temporal firmado: el reproductor lo sigue solo. Si
        una señal sale del aire, deja de aparecer como disponible.
      </p>

      <h2 className="row__title">Hecho con</h2>
      <p className="station__about">
        React y Vite, sin librería de componentes ni iconos externos. Los iconos son
        SVG escritos a mano para que se vean nítidos en cualquier pantalla. Los colores
        salen de la bandera de Cabimas: el celeste del lago y el sol dorado.
      </p>

      <h2 className="row__title">Créditos</h2>
      <p className="station__about">
        Los logotipos y nombres pertenecen a cada emisora. cabiplay no aloja ni
        retransmite audio: enlaza a las señales públicas que cada estación ya emite.
        Si eres de una emisora y quieres actualizar tus datos o salir del directorio,
        escríbeme.
      </p>

      <p className="credit">
        Hecho con <span className="credit__heart">&hearts;</span> por Yender, desde Cabimas
        para el mundo.
      </p>
    </main>
  );
}
