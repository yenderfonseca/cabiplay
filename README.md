# cabiplay 📻

> **Explorador y Sintonizador de Radio en Vivo de Cabimas y la Costa Oriental del Lago (Zulia, Venezuela)**

En vivo en producción: **[https://yenderfonseca.com/cabiplay](https://yenderfonseca.com/cabiplay)**

---

## 🌟 Acerca de cabiplay

**cabiplay** es una plataforma web interactiva y directorio abierto de radiodifusión digital dedicada exclusivamente al municipio **Cabimas** y la **Costa Oriental del Lago de Maracaibo** (Zulia, Venezuela). 

Diseñada con una estética limpia de consola de transmisión y guiada por los colores oficiales de la **Bandera de Cabimas** (Celeste Lago, Verde Fertilidad, Negro Petróleo/Barroso II y Sol Dorado), ofrece sintonía en tiempo real, geolocalización de antenas transmisoras y fichas dedicadas para cada emisora.

---

## ✨ Características Principales

- **56 Señales Verificadas en Directo**: Estaciones de transmisión FM, AM y señal web con soporte para streams de audio directo y HLS (.m3u8).
- **Radar de Antenas en Cabimas**: Mapa interactivo con Leaflet delimitado estrictamente a las coordenadas de Cabimas (`[10.28, -71.58]` a `[10.49, -71.32]`), bloqueando desplazamientos fuera del municipio.
- **Fichas Dedicadas por Emisora (`estacion/<slug>.html`)**: 56 páginas individuales con reseña histórica, programación, coordenadas de antena, enlaces oficiales (WhatsApp de cabina, Instagram, web oficial) y reproductor dedicado.
- **Carátulas Inteligentes Generadas en HTML/CSS**: Si una emisora no dispone de logotipo original o el recurso falla, el sistema genera automáticamente una carátula con estilo dial broadcast, número de frecuencia sintonizada y cinta tricolor cabimense.
- **Filtros por Sectores de Cabimas**: Navegación por Casco Central & Miraflores, Ambrosio & Tierra Negra, La Rosa & Concordia, además de géneros (Gaitas Zulianas, Pop, Urbano, Salsa, Noticias).
- **Directorio de Datos Abierto**: Archivos archivados y actualizados en `data/stations.json` y exportables en CSV y JSON (`archive/`).
- **Diseño Tipográfico Limpio**: Libre de emojis, controles directos tipo broadcast (`PLAY`, `PAUSA`, `SINTONIZAR`, `FICHA`, `FAVORITA`).

---

## 🎨 Paleta de Color (Bandera de Cabimas)

| Color | Hex | Simbolismo |
|---|---|---|
| **Celeste** | `#00a8e8` | El Lago de Maracaibo y el cielo cabimense |
| **Verde** | `#00a859` | Riqueza agropecuaria y fertilidad de la tierra |
| **Negro** | `#090d14` | El petróleo, riqueza del subsuelo y el Pozo Barroso II |
| **Sol Dorado** | `#ffb703` | El amanecer y la calidez del pueblo zuliano |

---

## 📂 Estructura del Proyecto

```text
cabimas-radio/
├── index.html            # Explorador principal cabiplay (Directorio + Mapa + Player)
├── style.css             # Hoja de estilos con variables de Cabimas y responsive design
├── app.js                # Lógica del reproductor, filtros de sectores, Leaflet y HLS
├── data/
│   └── stations.json     # Base de datos de 56 estaciones verificadas
├── assets/
│   └── logos/            # Logotipos descargados (.png) e insignias vectoriales (.svg)
├── estacion/             # 56 páginas individuales dedicadas por emisora
├── archive/
│   ├── stations_archive.csv   # Respaldo tabular de frecuencias y streams
│   └── stations_archive.json  # Respaldo JSON completo
└── scripts/
    ├── scrape_and_archive.py  # Script de scraping y validación de streams
    └── build_station_pages_and_download_logos.py # Generador de páginas y logos
```

---

## 🚀 Ejecución Local

Para levantar el proyecto en tu máquina local:

```bash
# Iniciar servidor HTTP estático
python3 -m http.server 8000

# Abrir en el navegador:
# http://localhost:8000
```

---

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3 moderno (Flexbox, CSS Grid, Variables CSS), JavaScript vanilla (ES6+).
- **Mapas**: [Leaflet.js](https://leafletjs.com/) con tiles de OpenStreetMap y bounded panning.
- **Audio Streaming**: Audio API nativa + [Hls.js](https://github.com/video-dev/hls.js/) para flujos HLS.
- **Herramientas de automatización**: Python 3 (urllib, concurrent.futures, json).

---

## 📄 Licencia

MIT License • Creado por [Yender Fonseca](https://yenderfonseca.com).
