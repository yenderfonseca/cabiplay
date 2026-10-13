// CABIPLAY - RADIO CABIMAS EN VIVO
const CABIMAS_CONFIG = {
  center: [10.4000, -71.4500],
  zoom: 13,
  minZoom: 12,
  maxZoom: 18,
  bounds: [
    [10.2800, -71.5800], // Suroeste (Costas del Lago / Punta Gorda)
    [10.4900, -71.3200]  // Noreste (Límites de Cabimas / Carretera Lara-Zulia)
  ]
};

// State
let allStations = [];
let filteredStations = [];
let currentStation = null;
let currentNav = "all";
let currentCategory = null;
let searchQuery = "";
let currentView = "split";
let favorites = JSON.parse(localStorage.getItem("cabiplay_favorites") || "[]");
let map = null;
let markers = [];
let hlsInstance = null;
let playDurationSeconds = 0;
let playTimerInterval = null;

// DOM Cache
const audio = document.getElementById("audio-stream");
const mainPlayBtn = document.getElementById("btn-main-play");
const iconMainPlayText = document.getElementById("icon-main-play-text");
const stationGrid = document.getElementById("station-grid");
const gridHeading = document.getElementById("grid-heading");
const gridSubheading = document.getElementById("grid-subheading");
const resultsCount = document.getElementById("results-count");
const searchInput = document.getElementById("search-input");
const searchClearBtn = document.getElementById("search-clear-btn");
const favCountBadge = document.getElementById("fav-count-badge");
const playerStationName = document.getElementById("player-station-name");
const playerStationInfo = document.getElementById("player-station-info");
const playerThumb = document.getElementById("player-thumb");
const playerFavBtn = document.getElementById("player-fav-btn");
const playerCoverBars = document.getElementById("cover-bars");
const audioVisualizer = document.getElementById("audio-visualizer");
const playerStatusText = document.getElementById("player-status-text");
const playerLiveDot = document.getElementById("player-live-dot");
const playerTimer = document.getElementById("player-timer");
const playerSocialChips = document.getElementById("player-social-chips");
const volumeSlider = document.getElementById("volume-slider");
const btnVolMute = document.getElementById("btn-vol-mute");
const volText = document.getElementById("vol-text");
const btnShuffle = document.getElementById("btn-shuffle");
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");
const btnLocateMap = document.getElementById("btn-locate-map");
const mapRecenterBtn = document.getElementById("map-recenter-btn");

// Hero Banner Cache
const heroBanner = document.getElementById("hero-banner");
const heroImg = document.getElementById("hero-img");
const heroCity = document.getElementById("hero-city");
const heroFreq = document.getElementById("hero-freq");
const heroTitle = document.getElementById("hero-title");
const heroDesc = document.getElementById("hero-desc");
const heroPlayBtn = document.getElementById("hero-play-btn");
const heroFavBtn = document.getElementById("hero-fav-btn");
const heroSocials = document.getElementById("hero-socials");
const heroArtSlot = document.getElementById("hero-art-slot");
const playerThumbSlot = document.getElementById("player-thumb-slot");

// Frequency Tuner Cache & Spectrum Constants
const tunerDisplayFreq = document.getElementById("tuner-display-freq");
const tunerDisplayCallsign = document.getElementById("tuner-display-callsign");
const tunerDisplayMeta = document.getElementById("tuner-display-meta");
const tunerLampOnAir = document.getElementById("tuner-lamp-onair");
const tunerSeekPrev = document.getElementById("tuner-seek-prev");
const tunerSeekNext = document.getElementById("tuner-seek-next");
const tunerViewport = document.getElementById("tuner-viewport");
const tunerTrack = document.getElementById("tuner-track");
const tunerNeedle = document.getElementById("tuner-needle");
const vuMeterL = document.getElementById("vu-meter-l");
const vuMeterR = document.getElementById("vu-meter-r");
let vuAnimationInterval = null;
const FM_START = 88.0;
const FM_END = 108.0;
const FM_RANGE = FM_END - FM_START;

// Dial & Band Parser for HTML Default Cover
function parseStationDial(station) {
  const dial = String(station.dial || "").trim();
  const freq = String(station.frequency || "").trim();
  const name = String(station.name || "").trim();
  const allText = `${freq} ${dial} ${name}`;

  // 1. Standard FM frequency: 87.0 - 108.0
  const mFm = allText.match(/\b(8[7-9]\.\d|9\d\.\d|10[0-8]\.\d|8[7-9]|9\d|10[0-8])\b/);
  if (mFm) {
    return { num: mFm[1], band: "FM" };
  }

  // 2. Standard AM frequency: 530 - 1710
  const mAm = allText.match(/\b(5[3-9]\d|[6-9]\d{2}|1[0-6]\d{2}|17[0-1]0)\b/);
  if (mAm) {
    return { num: mAm[1], band: "AM" };
  }

  // 3. Digital or Web broadcast
  const isWeb = /WEB|ONLINE|NET|DIGITAL|STREAM/i.test(allText);
  const band = isWeb ? "WEB" : "LIVE";
  const clean = name.replace(/[^a-zA-Z0-9\s]/g, "").trim().split(/\s+/);
  const abbr = clean.length > 0 && clean[0].length >= 3 ? clean[0].substring(0, 4).toUpperCase() : "CABI";
  return { num: abbr, band };
}

// Generate stylized default HTML cover with dial number and Cabimas flag styling
function getStationDefaultArtHtml(station, isMini = false, isHero = false) {
  const { num, band } = parseStationDial(station);
  const extraClass = isMini ? "art-mini" : (isHero ? "art-hero" : "");

  return `
    <div class="station-default-art ${extraClass}" aria-label="${station.name} ${num} ${band}">
      <div class="art-flag-ribbon">
        <span class="ribbon-celeste"></span>
        <span class="ribbon-verde"></span>
        <span class="ribbon-negro"></span>
        <span class="ribbon-sun"></span>
      </div>
      <div class="art-header-line">
        <span class="art-brand-tag">CABIMAS</span>
        <span class="art-live-indicator"><span class="art-live-dot"></span> EN VIVO</span>
      </div>
      <div class="art-dial-box">
        <span class="art-dial-num">${num}</span>
        <span class="art-dial-band">${band}</span>
      </div>
      <div class="art-tuner-scale" aria-hidden="true">
        <span></span><span></span><span></span><span class="scale-pip"></span><span></span><span></span><span class="scale-needle"></span><span></span><span></span><span></span>
      </div>
      <div class="art-footer-line">
        <span class="art-sub-tag">COSTA ORIENTAL DEL LAGO</span>
      </div>
    </div>
  `;
}

function hasCustomLogoPng(station) {
  const logoLocal = station.logo_local || "";
  return logoLocal.endsWith(".png");
}

function renderStationArtMarkup(station, isMini = false, isHero = false) {
  const defaultArtHtml = getStationDefaultArtHtml(station, isMini, isHero);
  const hasPng = hasCustomLogoPng(station);
  const logoUrl = station.logo_local || station.logo || "";

  if (hasPng && logoUrl) {
    const imgClass = isMini ? "player-img" : (isHero ? "hero-img" : "card-img");
    return `
      <img class="${imgClass}" 
           src="${logoUrl}" 
           alt="${station.name}" 
           loading="lazy" 
           onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';" />
      <div style="display:none; width:100%; height:100%;">
        ${defaultArtHtml}
      </div>
    `;
  } else {
    return defaultArtHtml;
  }
}

// 1. Initialize Leaflet Map (Strictly limited to Cabimas)
function initMap() {
  map = L.map("map", {
    zoomControl: false,
    maxBounds: CABIMAS_CONFIG.bounds,
    maxBoundsViscosity: 1.0,
    minZoom: CABIMAS_CONFIG.minZoom,
    maxZoom: CABIMAS_CONFIG.maxZoom
  }).setView(CABIMAS_CONFIG.center, CABIMAS_CONFIG.zoom);

  L.control.zoom({ position: "topright" }).addTo(map);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);
}

// 2. Fetch Enriched Dataset
async function loadStations() {
  try {
    const res = await fetch("data/stations.json");
    if (!res.ok) throw new Error("Error loading dataset");
    const rawStations = await res.json();
    
    // Prioritize stations that transmit in or serve Cabimas
    allStations = rawStations.filter(s => {
      const city = (s.city || "").toLowerCase();
      const sector = (s.sector || "").toLowerCase();
      const tags = (s.tags || "").toLowerCase();
      return city.includes("cabimas") || s.region_type === "cabimas_local" || sector.includes("cabimas") || tags.includes("cabimas");
    });

    // If local list is ready, augment with other verified stations if needed
    if (allStations.length === 0) {
      allStations = rawStations;
    }
  } catch (e) {
    console.error("Using fallback:", e);
  }

  updateFavoritesBadge();
  applyFilters();
  initFrequencyTuner();

  const featured = allStations.find(s => s.name.includes("Xtrema")) || allStations[0];
  if (featured) {
    setHeroStation(featured);
  }
}

// 3. Filtering Logic
function applyFilters() {
  const query = searchQuery.toLowerCase().trim();

  filteredStations = allStations.filter(station => {
    // Nav Filter (Cabimas sectors)
    const sector = (station.sector || "").toLowerCase();
    const city = (station.city || "").toLowerCase();

    if (currentNav === "cabimas_centro") {
      if (!sector.includes("central") && !sector.includes("universidad") && !sector.includes("miraflores")) return false;
    } else if (currentNav === "cabimas_norte") {
      if (!sector.includes("ambrosio") && !sector.includes("tierra negra") && !sector.includes("norte")) return false;
    } else if (currentNav === "cabimas_sur") {
      if (!sector.includes("la rosa") && !sector.includes("concordia") && !sector.includes("sur")) return false;
    } else if (currentNav === "favorites") {
      const stId = station.station_id || station.stream_url;
      if (!favorites.includes(stId)) return false;
    }

    // Category Filter
    if (currentCategory && station.category !== currentCategory) {
      return false;
    }

    // Search Query
    if (query) {
      const matchName = (station.name || "").toLowerCase().includes(query);
      const matchTags = (station.tags || "").toLowerCase().includes(query);
      const matchCity = city.includes(query);
      const matchFreq = (station.frequency || "").toLowerCase().includes(query);
      const matchSector = sector.includes(query);
      if (!matchName && !matchTags && !matchCity && !matchFreq && !matchSector) return false;
    }

    return true;
  });

  updateHeadings();
  renderCards();
  renderMapMarkers();
}

function updateHeadings() {
  const count = filteredStations.length;
  resultsCount.textContent = `${count} ${count === 1 ? 'emisora' : 'emisoras'}`;

  if (currentNav === "favorites") {
    gridHeading.textContent = "Estaciones Favoritas";
    gridSubheading.textContent = "Tus emisoras guardadas en Cabimas";
  } else if (currentCategory) {
    const titles = {
      gaitas: "Gaitas & Tradición Zuliana",
      urbano: "Urbano & Reggaetón en Cabimas",
      tropical: "Salsa & Bailable",
      pop: "Pop Latino & Éxitos FM",
      noticias: "Noticias & Opinión"
    };
    gridHeading.textContent = titles[currentCategory] || "Categoría Seleccionada";
    gridSubheading.textContent = `Mostrando ${count} señales en vivo`;
  } else if (currentNav === "cabimas_centro") {
    gridHeading.textContent = "Casco Central & Miraflores";
    gridSubheading.textContent = "Emisoras transmitiendo en el centro urbano de Cabimas";
  } else if (currentNav === "cabimas_norte") {
    gridHeading.textContent = "Ambrosio & Tierra Negra";
    gridSubheading.textContent = "Emisoras del norte de Cabimas";
  } else if (currentNav === "cabimas_sur") {
    gridHeading.textContent = "La Rosa & Concordia";
    gridSubheading.textContent = "Emisoras del sur y costa petrolera de Cabimas";
  } else {
    gridHeading.textContent = "Emisoras en Cabimas";
    gridSubheading.textContent = "Directorio de radio en vivo de Cabimas, Zulia";
  }
}

// 4. Render Cards Grid
function renderCards() {
  stationGrid.innerHTML = "";

  if (filteredStations.length === 0) {
    stationGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: var(--text-muted);">
        <h3 style="color:#fff;">No se encontraron emisoras</h3>
        <p style="margin-top: 6px; font-size: 0.85rem;">Prueba con otro término de búsqueda o limpia los filtros.</p>
      </div>
    `;
    return;
  }

  filteredStations.forEach(station => {
    const stId = station.station_id || station.stream_url;
    const isPlaying = currentStation && (currentStation.station_id === station.station_id || currentStation.stream_url === station.stream_url) && !audio.paused;
    const isActive = currentStation && (currentStation.station_id === station.station_id || currentStation.stream_url === station.stream_url);
    const isFav = favorites.includes(stId);

    const card = document.createElement("div");
    card.className = `station-card ${isActive ? 'active' : ''}`;
    card.dataset.id = stId;

    const logoUrl = station.logo_local || station.logo || "assets/logos/" + (station.slug || "radio") + ".svg";
    const pageUrl = station.page_url || "estacion/" + (station.slug || "") + ".html";

    // Social Links (Clean text)
    const socials = station.socials || {};
    let socialIconsHtml = "";
    if (socials.instagram) {
      socialIconsHtml += `<a href="${socials.instagram}" target="_blank" class="card-social-icon" onclick="event.stopPropagation()">Instagram</a>`;
    }
    if (socials.whatsapp) {
      socialIconsHtml += `<a href="${socials.whatsapp}" target="_blank" class="card-social-icon" onclick="event.stopPropagation()">WhatsApp</a>`;
    }
    if (socials.website) {
      socialIconsHtml += `<a href="${socials.website}" target="_blank" class="card-social-icon" onclick="event.stopPropagation()">Web</a>`;
    }
    socialIconsHtml += `<a href="${pageUrl}" class="card-social-icon card-page-link" onclick="event.stopPropagation()">Ficha</a>`;

    card.innerHTML = `
      <div class="card-art-wrap">
        ${renderStationArtMarkup(station, false, false)}
        <span class="card-freq-tag">${station.frequency || station.dial || 'FM'}</span>
        ${isPlaying ? `<div class="card-equalizer"><span></span><span></span><span></span></div>` : ''}
        <button class="card-play-btn">
          ${isPlaying ? 'PAUSA' : 'PLAY'}
        </button>
      </div>
      <div class="card-title" title="${station.name}">${station.name}</div>
      <div class="card-freq">${station.frequency || station.dial || 'ONLINE'} • Cabimas</div>
      <div class="card-sector">${station.sector || station.tags || 'En vivo'}</div>
      <div class="card-social-row">
        <div class="card-social-icons">${socialIconsHtml}</div>
        <button class="card-fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite('${stId}')">
          ${isFav ? 'Favorita' : 'Guardar'}
        </button>
      </div>
    `;

    card.addEventListener("click", () => {
      selectAndPlayStation(station);
    });

    stationGrid.appendChild(card);
  });
}

// 5. Render Map Markers (Limited to Cabimas bounds)
function renderMapMarkers() {
  if (!map) return;
  markers.forEach(m => map.removeLayer(m.marker));
  markers = [];

  filteredStations.forEach(station => {
    let lat = parseFloat(station.lat || station.geo_lat);
    let lon = parseFloat(station.lon || station.geo_long);
    if (isNaN(lat) || isNaN(lon)) return;

    // Clamp coordinates strictly within Cabimas boundary
    lat = Math.max(10.3100, Math.min(10.4700, lat));
    lon = Math.max(-71.5500, Math.min(-71.3700, lon));

    const stId = station.station_id || station.stream_url;
    const isCurrent = currentStation && (currentStation.station_id === station.station_id || currentStation.stream_url === station.stream_url);

    const icon = L.divIcon({
      className: `radio-marker ${isCurrent ? 'active' : ''}`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    const popupHtml = `
      <div style="font-family: inherit; font-size: 0.85rem; line-height: 1.4; padding: 4px;">
        <strong style="color: #00a8e8; font-size: 0.95rem;">${station.name}</strong><br/>
        <span style="color: #ffb703; font-weight: 700;">${station.sector || "Cabimas, Zulia"}</span><br/>
        <span style="color: #94a3b8; font-size: 0.75rem;">${station.frequency || ''} • ${station.tags || "En vivo"}</span>
        <button style="margin-top: 8px; width: 100%; padding: 6px; background: #00a8e8; color: #000; border: none; border-radius: 4px; font-weight: 800; cursor: pointer;" onclick="window.appPlayStation('${stId}')">
          Sintonizar Señal
        </button>
      </div>
    `;

    const marker = L.marker([lat, lon], { icon })
      .addTo(map)
      .bindPopup(popupHtml);

    marker.on("click", () => {
      selectAndPlayStation(station);
    });

    markers.push({ stationId: stId, marker, station });
  });
}

window.appPlayStation = function(stId) {
  const st = allStations.find(s => (s.station_id || s.stream_url) === stId);
  if (st) selectAndPlayStation(st);
};

// 5.5. Analog Frequency Tuner Scale & Logic
function initFrequencyTuner() {
  if (!tunerTrack) return;
  tunerTrack.innerHTML = "";

  // Make sure needle is inside the track coordinate space
  if (tunerNeedle) {
    tunerTrack.appendChild(tunerNeedle);
  }

  // 1. Build tick marks from 88.0 to 108.0 MHz with 0.1 increments
  const totalTicks = Math.round(FM_RANGE * 10); // 200 ticks
  for (let i = 0; i <= totalTicks; i++) {
    const freq = FM_START + (i * 0.1);
    const pct = (i / totalTicks) * 100;
    const isMajor = (i % 10 === 0);
    const isMid = (i % 5 === 0 && !isMajor);

    const tick = document.createElement("div");
    tick.className = `tuner-tick ${isMajor ? 'major' : (isMid ? 'mid' : 'minor')}`;
    tick.style.left = `${pct}%`;

    if (isMajor) {
      const label = document.createElement("span");
      label.className = "tick-label";
      label.textContent = freq.toFixed(0);
      tick.appendChild(label);
    }
    tunerTrack.appendChild(tick);
  }

  // 2. Build station pips for all stations with FM frequency
  allStations.forEach(station => {
    const dialData = parseStationDial(station);
    if (dialData.band === "FM") {
      const freqNum = parseFloat(dialData.num);
      if (!isNaN(freqNum) && freqNum >= FM_START && freqNum <= FM_END) {
        const pct = ((freqNum - FM_START) / FM_RANGE) * 100;
        const pip = document.createElement("div");
        pip.className = "tuner-station-pip";
        pip.style.left = `${pct}%`;
        pip.dataset.stationId = station.station_id || station.stream_url;
        pip.dataset.freq = freqNum.toFixed(1);

        const shortName = station.name.split(" ")[0] || freqNum.toFixed(1);
        pip.innerHTML = `
          <span class="pip-tag">${dialData.num} ${shortName}</span>
          <span class="pip-dot"></span>
        `;

        pip.addEventListener("click", (e) => {
          e.stopPropagation();
          selectAndPlayStation(station);
        });

        tunerTrack.appendChild(pip);
      }
    }
  });

  // 3. Viewport click seeking
  if (tunerViewport) {
    tunerViewport.addEventListener("click", (e) => {
      const rect = tunerTrack.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const trackWidth = rect.width;
      if (trackWidth <= 0) return;

      const pct = Math.max(0, Math.min(1, clickX / trackWidth));
      const targetFreq = FM_START + (pct * FM_RANGE);

      // Find closest station with FM frequency
      let closestStation = null;
      let minDiff = Infinity;
      allStations.forEach(st => {
        const d = parseStationDial(st);
        if (d.band === "FM") {
          const fn = parseFloat(d.num);
          if (!isNaN(fn)) {
            const diff = Math.abs(fn - targetFreq);
            if (diff < minDiff) {
              minDiff = diff;
              closestStation = st;
            }
          }
        }
      });

      if (closestStation && minDiff <= 0.6) {
        selectAndPlayStation(closestStation);
      } else {
        updateTunerNeedle(targetFreq, null);
      }
    });
  }

  // 4. Seek buttons
  if (tunerSeekPrev) {
    tunerSeekPrev.onclick = () => seekTunerStation(-1);
  }
  if (tunerSeekNext) {
    tunerSeekNext.onclick = () => seekTunerStation(1);
  }
}

function seekTunerStation(direction) {
  const fmStations = allStations.filter(st => {
    const d = parseStationDial(st);
    return d.band === "FM" && !isNaN(parseFloat(d.num));
  }).sort((a, b) => parseFloat(parseStationDial(a).num) - parseFloat(parseStationDial(b).num));

  if (!fmStations.length) return;

  let currentIdx = -1;
  if (currentStation) {
    currentIdx = fmStations.findIndex(s => (s.station_id || s.stream_url) === (currentStation.station_id || currentStation.stream_url));
  }

  let nextIdx = 0;
  if (currentIdx >= 0) {
    nextIdx = (currentIdx + direction + fmStations.length) % fmStations.length;
  } else if (direction < 0) {
    nextIdx = fmStations.length - 1;
  }
  selectAndPlayStation(fmStations[nextIdx]);
}

function updateTunerNeedle(freqNum, station) {
  if (!tunerNeedle) return;
  const clampedFreq = Math.max(FM_START, Math.min(FM_END, freqNum));
  const pct = ((clampedFreq - FM_START) / FM_RANGE) * 100;

  tunerNeedle.style.left = `${pct}%`;

  if (tunerDisplayFreq) {
    tunerDisplayFreq.textContent = clampedFreq.toFixed(1);
  }

  if (station) {
    if (tunerDisplayCallsign) tunerDisplayCallsign.textContent = station.name;
    if (tunerDisplayMeta) tunerDisplayMeta.textContent = `${station.sector || 'Cabimas, Zulia'} • ${station.category || 'En Vivo'}`;
  } else {
    if (tunerDisplayCallsign) tunerDisplayCallsign.textContent = `Búsqueda Libre ${clampedFreq.toFixed(1)} MHz`;
    if (tunerDisplayMeta) tunerDisplayMeta.textContent = "Sintonía manual Cabimas";
  }

  // Update active state on pips
  document.querySelectorAll(".tuner-station-pip").forEach(pip => {
    const isCurrent = station && (pip.dataset.stationId === (station.station_id || station.stream_url));
    pip.classList.toggle("active", Boolean(isCurrent));
  });
}

// 6. Set Featured Hero Banner
function setHeroStation(station) {
  heroTitle.textContent = station.name;
  heroCity.textContent = `CABIMAS, ZULIA • ${station.sector || 'COSTA ORIENTAL'}`;
  heroFreq.textContent = station.frequency || station.dial || 'FM';
  heroDesc.textContent = station.description || `Transmisión en directo desde Cabimas, Estado Zulia. Señal verificada online.`;
  if (heroArtSlot) {
    heroArtSlot.innerHTML = renderStationArtMarkup(station, false, true);
  } else if (heroImg) {
    heroImg.src = station.logo_local || station.logo || "assets/logos/" + (station.slug || "radio") + ".svg";
  }

  // Update Tuner Needle & Telemetry
  const dial = parseStationDial(station);
  if (dial.band === "FM" && !isNaN(parseFloat(dial.num))) {
    updateTunerNeedle(parseFloat(dial.num), station);
  } else {
    updateTunerNeedle(98.9, station);
    if (tunerDisplayFreq) tunerDisplayFreq.textContent = dial.num;
    if (tunerDisplayCallsign) tunerDisplayCallsign.textContent = station.name;
    if (tunerDisplayMeta) tunerDisplayMeta.textContent = `${dial.band} • ${station.sector || 'Cabimas'}`;
  }

  const stId = station.station_id || station.stream_url;
  const isFav = favorites.includes(stId);
  heroFavBtn.classList.toggle("active", isFav);
  heroFavBtn.textContent = isFav ? "Favorita" : "Guardar";
  heroFavBtn.onclick = () => toggleFavorite(stId);

  // Social chips on hero (clean text)
  heroSocials.innerHTML = "";
  const socials = station.socials || {};
  if (socials.instagram) {
    heroSocials.innerHTML += `<a href="${socials.instagram}" target="_blank" class="social-chip">${socials.instagram_handle || 'Instagram'}</a>`;
  }
  if (socials.whatsapp) {
    heroSocials.innerHTML += `<a href="${socials.whatsapp}" target="_blank" class="social-chip">WhatsApp</a>`;
  }
  if (socials.website) {
    heroSocials.innerHTML += `<a href="${socials.website}" target="_blank" class="social-chip">Sitio Web</a>`;
  }
  const pageUrl = station.page_url || "estacion/" + (station.slug || "") + ".html";
  heroSocials.innerHTML += `<a href="${pageUrl}" class="social-chip chip-page">Ver Ficha Completa</a>`;

  heroPlayBtn.onclick = () => selectAndPlayStation(station);
}

// 7. Select & Play Station
function selectAndPlayStation(station) {
  currentStation = station;
  setHeroStation(station);

  // Update Player UI
  playerStationName.textContent = station.name;
  playerStationInfo.textContent = `${station.frequency || station.dial || 'FM'} • ${station.sector || 'Cabimas'}`;
  if (playerThumbSlot) {
    playerThumbSlot.innerHTML = renderStationArtMarkup(station, true, false);
  } else if (playerThumb) {
    playerThumb.src = station.logo_local || station.logo || "assets/logos/" + (station.slug || "radio") + ".svg";
  }
  mainPlayBtn.disabled = false;

  const stId = station.station_id || station.stream_url;
  playerFavBtn.classList.toggle("active", favorites.includes(stId));
  playerFavBtn.onclick = () => toggleFavorite(stId);

  // Update Player Social Chips
  playerSocialChips.innerHTML = "";
  const socials = station.socials || {};
  if (socials.instagram) {
    playerSocialChips.innerHTML += `<a href="${socials.instagram}" target="_blank">Instagram</a>`;
  }
  if (socials.whatsapp) {
    playerSocialChips.innerHTML += `<a href="${socials.whatsapp}" target="_blank">WhatsApp</a>`;
  }
  if (socials.website) {
    playerSocialChips.innerHTML += `<a href="${socials.website}" target="_blank">Web</a>`;
  }
  const pageUrl = station.page_url || "estacion/" + (station.slug || "") + ".html";
  playerSocialChips.innerHTML += `<a href="${pageUrl}" class="player-chip-page" title="Ver ficha de la emisora">Ficha</a>`;

  // Update active markers on map
  markers.forEach(({ stationId, marker }) => {
    const el = marker.getElement();
    if (el) {
      el.classList.toggle("active", stationId === stId);
    }
    if (stationId === stId) {
      marker.openPopup();
      if (currentView !== "grid") {
        map.panTo(marker.getLatLng(), { animate: true, duration: 0.8 });
      }
    }
  });

  renderCards();
  playStream(station.stream_url || station.url_resolved);
}

function playStream(streamUrl) {
  audio.pause();
  audio.removeAttribute("src");
  audio.load();

  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }

  playerStatusText.textContent = "SINTONIZANDO SEÑAL...";
  playerLiveDot.className = "broadcast-dot loading";
  iconMainPlayText.textContent = "...";

  const isHls = streamUrl.includes(".m3u8");

  if (isHls && Hls.isSupported()) {
    hlsInstance = new Hls({ enableWorker: true });
    hlsInstance.loadSource(streamUrl);
    hlsInstance.attachMedia(audio);
    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
      audio.play().catch(handlePlaybackError);
    });
    hlsInstance.on(Hls.Events.ERROR, (_evt, data) => {
      if (data.fatal) handlePlaybackError(data);
    });
  } else {
    audio.src = streamUrl;
    audio.play().catch(handlePlaybackError);
  }
}

function handlePlaybackError(err) {
  playerLiveDot.className = "broadcast-dot";
  playerStatusText.textContent = "SEÑAL OFFLINE / PROTEGIDA";
  iconMainPlayText.textContent = "PLAY";
  playerCoverBars.classList.remove("active");
  audioVisualizer.classList.remove("playing");
  stopTimer();
  stopVuMeters();
}

// 7.8. Studio VU Meters Simulation
function startVuMeters() {
  stopVuMeters();
  const leftPips = vuMeterL ? vuMeterL.querySelectorAll(".vu-pip") : [];
  const rightPips = vuMeterR ? vuMeterR.querySelectorAll(".vu-pip") : [];
  if (!leftPips.length || !rightPips.length) return;

  vuAnimationInterval = setInterval(() => {
    // Generate organic studio audio levels (nominal levels 4-7, peak 8-9)
    const base = Math.floor(Math.random() * 4) + 4; // 4 to 7
    const peakL = Math.min(9, Math.max(1, base + (Math.random() > 0.8 ? 2 : 0) - (Math.random() > 0.7 ? 1 : 0)));
    const peakR = Math.min(9, Math.max(1, base + (Math.random() > 0.8 ? 2 : 0) - (Math.random() > 0.7 ? 1 : 0)));

    leftPips.forEach((pip, idx) => {
      pip.classList.toggle("lit", idx < peakL);
    });
    rightPips.forEach((pip, idx) => {
      pip.classList.toggle("lit", idx < peakR);
    });
  }, 75);
}

function stopVuMeters() {
  if (vuAnimationInterval) {
    clearInterval(vuAnimationInterval);
    vuAnimationInterval = null;
  }
  if (vuMeterL) vuMeterL.querySelectorAll(".vu-pip").forEach(p => p.classList.remove("lit"));
  if (vuMeterR) vuMeterR.querySelectorAll(".vu-pip").forEach(p => p.classList.remove("lit"));
}

// 8. Playback Timer & Listeners
function startTimer() {
  stopTimer();
  playDurationSeconds = 0;
  playTimerInterval = setInterval(() => {
    playDurationSeconds++;
    const m = Math.floor(playDurationSeconds / 60).toString().padStart(2, "0");
    const s = (playDurationSeconds % 60).toString().padStart(2, "0");
    playerTimer.textContent = `${m}:${s}`;
  }, 1000);
}

function stopTimer() {
  if (playTimerInterval) {
    clearInterval(playTimerInterval);
    playTimerInterval = null;
  }
}

audio.addEventListener("playing", () => {
  playerLiveDot.className = "broadcast-dot live";
  playerStatusText.textContent = "SEÑAL EN DIRECTO";
  iconMainPlayText.textContent = "PAUSA";
  playerCoverBars.classList.add("active");
  audioVisualizer.classList.add("playing");
  startTimer();
  startVuMeters();
  renderCards();
});

audio.addEventListener("pause", () => {
  playerLiveDot.className = "broadcast-dot";
  iconMainPlayText.textContent = "PLAY";
  playerCoverBars.classList.remove("active");
  audioVisualizer.classList.remove("playing");
  stopTimer();
  stopVuMeters();
  renderCards();
});

audio.addEventListener("error", handlePlaybackError);

mainPlayBtn.addEventListener("click", () => {
  if (!currentStation) return;
  if (audio.paused) {
    audio.play().catch(handlePlaybackError);
  } else {
    audio.pause();
  }
});

// 9. Shuffle, Next & Prev
btnNext.addEventListener("click", () => {
  if (!filteredStations.length) return;
  let idx = filteredStations.findIndex(s => s === currentStation);
  idx = (idx + 1) % filteredStations.length;
  selectAndPlayStation(filteredStations[idx]);
});

btnPrev.addEventListener("click", () => {
  if (!filteredStations.length) return;
  let idx = filteredStations.findIndex(s => s === currentStation);
  idx = (idx - 1 + filteredStations.length) % filteredStations.length;
  selectAndPlayStation(filteredStations[idx]);
});

btnShuffle.addEventListener("click", () => {
  if (!filteredStations.length) return;
  const randIdx = Math.floor(Math.random() * filteredStations.length);
  selectAndPlayStation(filteredStations[randIdx]);
});

btnLocateMap.addEventListener("click", () => {
  if (!currentStation || !map) return;
  let lat = parseFloat(currentStation.lat || currentStation.geo_lat);
  let lon = parseFloat(currentStation.lon || currentStation.geo_long);
  if (!isNaN(lat) && !isNaN(lon)) {
    lat = Math.max(10.3100, Math.min(10.4700, lat));
    lon = Math.max(-71.5500, Math.min(-71.3700, lon));
    if (currentView === "grid") setViewMode("split");
    map.flyTo([lat, lon], 14, { duration: 1 });
  }
});

mapRecenterBtn.addEventListener("click", () => {
  if (map) map.flyTo(CABIMAS_CONFIG.center, CABIMAS_CONFIG.zoom, { duration: 1 });
});

// 10. Volume Controls
volumeSlider.addEventListener("input", (e) => {
  const val = parseFloat(e.target.value);
  audio.volume = val;
  volText.textContent = val === 0 ? "MUTE" : "VOL";
});

btnVolMute.addEventListener("click", () => {
  if (audio.volume > 0) {
    audio.dataset.prevVol = audio.volume;
    audio.volume = 0;
    volumeSlider.value = 0;
    volText.textContent = "MUTE";
  } else {
    const prev = parseFloat(audio.dataset.prevVol || 1);
    audio.volume = prev;
    volumeSlider.value = prev;
    volText.textContent = "VOL";
  }
});

// 11. Favorites Management
function toggleFavorite(stId) {
  const idx = favorites.indexOf(stId);
  if (idx >= 0) {
    favorites.splice(idx, 1);
  } else {
    favorites.push(stId);
  }
  localStorage.setItem("cabiplay_favorites", JSON.stringify(favorites));
  updateFavoritesBadge();
  applyFilters();
}

function updateFavoritesBadge() {
  favCountBadge.textContent = favorites.length;
  const mobCount = document.getElementById("mobile-fav-count");
  if (mobCount) mobCount.textContent = favorites.length;
}

// 12. Navigation & Categories
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    document.querySelectorAll(".genre-item").forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    currentNav = item.dataset.nav;
    currentCategory = null;

    if (map) {
      map.flyTo(CABIMAS_CONFIG.center, CABIMAS_CONFIG.zoom, { duration: 1 });
    }

    applyFilters();
  });
});

document.querySelectorAll(".genre-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    document.querySelectorAll(".genre-item").forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    currentCategory = item.dataset.category;
    currentNav = "all";
    applyFilters();
  });
});

// Search
searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  searchClearBtn.style.display = searchQuery ? "block" : "none";
  applyFilters();
});

searchClearBtn.addEventListener("click", () => {
  searchInput.value = "";
  searchQuery = "";
  searchClearBtn.style.display = "none";
  applyFilters();
});

// 13. View Toggles (Split / Directorio / Mapa)
document.querySelectorAll(".view-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    setViewMode(btn.dataset.view);
  });
});

function setViewMode(view) {
  currentView = view;
  document.querySelectorAll(".view-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.view === view);
  });

  document.body.classList.remove("view-grid-only", "view-map-only");
  if (view === "grid") {
    document.body.classList.add("view-grid-only");
  } else if (view === "map") {
    document.body.classList.add("view-map-only");
    if (map) setTimeout(() => map.invalidateSize(), 150);
  } else {
    // split
    if (map) setTimeout(() => map.invalidateSize(), 150);
  }

  // Sync mobile bottom tab active state
  document.querySelectorAll(".mobile-tab-btn").forEach(btn => {
    if (view === "map") {
      btn.classList.toggle("active", btn.dataset.tab === "radar");
    } else if (btn.dataset.tab === "radar") {
      btn.classList.remove("active");
    }
  });
}

// 14. Mobile Swipe Category Carousel
document.querySelectorAll(".cat-pill").forEach(pill => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".cat-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");

    if (pill.dataset.nav) {
      currentNav = pill.dataset.nav;
      currentCategory = null;
      document.querySelectorAll(".nav-item").forEach(i => {
        i.classList.toggle("active", i.dataset.nav === currentNav);
      });
      document.querySelectorAll(".genre-item").forEach(i => i.classList.remove("active"));
    } else if (pill.dataset.category) {
      currentCategory = pill.dataset.category;
      currentNav = "all";
      document.querySelectorAll(".genre-item").forEach(i => {
        i.classList.toggle("active", i.dataset.category === currentCategory);
      });
      document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    }

    applyFilters();
    if (currentView === "map") {
      setViewMode("split");
    }
  });
});

// 15. Mobile App Bottom Navigation Bar
document.querySelectorAll(".mobile-tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mobile-tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;

    if (tab === "radio") {
      setViewMode("split");
      currentNav = "all";
      currentCategory = null;
      document.querySelectorAll(".cat-pill").forEach((p, idx) => p.classList.toggle("active", idx === 0));
      applyFilters();
      const splitEl = document.getElementById("split-layout");
      if (splitEl) splitEl.scrollIntoView({ behavior: "smooth" });
    } else if (tab === "tuner") {
      setViewMode("split");
      const tunerEl = document.getElementById("frequency-tuner");
      if (tunerEl) tunerEl.scrollIntoView({ behavior: "smooth" });
    } else if (tab === "radar") {
      setViewMode("map");
      if (map) {
        setTimeout(() => {
          map.invalidateSize();
          map.setView(CABIMAS_CONFIG.center, CABIMAS_CONFIG.zoom);
        }, 120);
      }
    } else if (tab === "favs") {
      setViewMode("split");
      currentNav = "favorites";
      currentCategory = null;
      applyFilters();
      const splitEl = document.getElementById("split-layout");
      if (splitEl) splitEl.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// App Entry Point
window.addEventListener("DOMContentLoaded", () => {
  initMap();
  loadStations();
});
