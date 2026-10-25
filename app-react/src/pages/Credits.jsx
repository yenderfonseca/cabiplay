import { Link } from 'react-router-dom';
import { usePlayer } from '../lib/PlayerContext.jsx';
import { Back, Radio, Listeners, Heart, Globe } from '../lib/icons.jsx';

export default function Credits() {
  const { stations } = usePlayer();
  const withLogo = stations.filter((s) => s.logo_local || s.logo).length;

  return (
    <main className="page">
      <Link to="/" className="icon-btn page__back" aria-label="Volver al directorio">
        <Back size={20} />
      </Link>

      <h1 className="page__title">Cómo se hizo</h1>
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
            <b>{withLogo}</b> con logotipo original de la&nbsp;emisora
          </span>
        </li>
        <li className="fact">
          <Listeners size={18} />
          <span>Oyentes en vivo estimados por sesiones&nbsp;activas</span>
        </li>
        <li className="fact">
          <Heart size={18} />
          <span>Los me gusta son públicos y ordenan lo más&nbsp;escuchado</span>
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

      <h2 className="row__title" id="aviso-legal">Aviso legal</h2>
      <div className="legal">
        <p>
          <b>cabiplay es un directorio, no una emisora.</b> No transmite, no
          retransmite y no almacena audio. Tampoco intercepta, reconvierte ni
          redistribuye ninguna señal.
        </p>
        <p>
          Cada ficha enlaza a la dirección pública que la propia emisora ya
          difunde en internet. Al pulsar play, el audio viaja directamente desde
          el servidor de esa emisora al dispositivo de quien escucha, igual que
          si abriera el enlace en su navegador. cabiplay no se interpone en esa
          conexión ni obtiene beneficio de ella.
        </p>
        <p>
          Los nombres, logotipos, frecuencias y contenidos pertenecen a cada
          emisora y se muestran únicamente para identificarlas. La
          responsabilidad sobre lo que se emite, incluidos los derechos de la
          música y la publicidad, es de cada estación.
        </p>
        <p>
          <b>¿Eres de una emisora?</b> Si quieres corregir tus datos, cambiar tu
          logotipo o que retiremos tu señal del directorio, escríbeme y lo hago
          sin preguntar por qué. Si una señal deja de funcionar o una emisora
          sale del aire, deja de aparecer como disponible.
        </p>
      </div>

      <h2 className="row__title">Créditos</h2>
      <p className="station__about">
        El directorio lo mantiene una persona, no una empresa. Las emisoras de
        Cabimas son de quienes las hacen sonar todos los días.
      </p>

      <p className="credit">
        Hecho con <span className="credit__heart">&hearts;</span> por Yender, desde Cabimas
        para el&nbsp;mundo.
      </p>
    </main>
  );
}
