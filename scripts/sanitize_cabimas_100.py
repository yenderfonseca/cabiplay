#!/usr/bin/env python3
"""
Sanitizes the cabiplay catalog to ensure 100% of stations are strictly from
the Municipality of Cabimas, Zulia. Overwrites data/stations.json, updates archives,
prunes non-Cabimas HTML pages, and regenerates all station pages.
"""

import os
import json
import csv
import re

BASE_DIR = "/Users/yenderfonseca/DTCMASTER/cabimas-radio"
DATA_FILE = os.path.join(BASE_DIR, "data", "stations.json")
ARCHIVE_JSON = os.path.join(BASE_DIR, "archive", "stations_archive.json")
ARCHIVE_CSV = os.path.join(BASE_DIR, "archive", "stations_archive.csv")
PAGES_DIR = os.path.join(BASE_DIR, "estacion")
LOGOS_DIR = os.path.join(BASE_DIR, "assets", "logos")

CABIMAS_STATIONS = [
    {
        "id": "cabimas.xtrema989",
        "station_id": "cabimas.xtrema989",
        "slug": "xtrema-989-fm",
        "name": "Xtrema 98.9 FM",
        "frequency": "98.9 FM",
        "dial": "98.9",
        "city": "Cabimas",
        "state": "Zulia",
        "sector": "Casco Central / Av. Universidad",
        "region_type": "cabimas_local",
        "category": "urbano",
        "genres": ["Reggaetón", "Pop Latino", "Éxitos Juveniles"],
        "tags": "Pop, Reggaetón, Variada, Éxitos",
        "description": "La estación juvenil #1 de Cabimas y la Costa Oriental del Lago. Lo mejor de la música urbana, pop y entretenimiento.",
        "stream_url": "https://app0102.sonicpanelradio.com/8352/stream",
        "lat": 10.3995,
        "lon": -71.4435,
        "theme_color": "#e91e63",
        "socials": {
            "instagram": "https://www.instagram.com/xtrema98fm/",
            "instagram_handle": "@xtrema98fm",
            "facebook": "https://www.facebook.com/xtrema98fm",
            "website": "https://xtrema98fm.com/",
            "whatsapp": "https://wa.me/584246879890"
        }
    },
    {
        "id": "cabimas.favoritas979",
        "station_id": "cabimas.favoritas979",
        "slug": "favoritas-979-fm",
        "name": "Favoritas 97.9 FM",
        "frequency": "97.9 FM",
        "dial": "97.9",
        "city": "Cabimas",
        "state": "Zulia",
        "sector": "Casco Central / Ambrosio",
        "region_type": "cabimas_local",
        "category": "pop",
        "genres": ["Éxitos", "Variada", "Noticias Locales"],
        "tags": "Éxitos, Noticias, Pop, Cabimas",
        "description": "La Imbatible de Cabimas. Estación pionera e histórica de la radiodifusión en la Costa Oriental del Lago, Corporación Regional Broadcasting (CRB).",
        "stream_url": "https://stream.zeno.fm/eaeo5job6q4uv",
        "lat": 10.4080,
        "lon": -71.4550,
        "theme_color": "#00a8e8",
        "socials": {
            "instagram": "https://www.instagram.com/favoritas979fm/",
            "instagram_handle": "@favoritas979fm"
        }
    },
    {
        "id": "cabimas.buenisima1063",
        "station_id": "cabimas.buenisima1063",
        "slug": "buenisima-1063-fm",
        "name": "Buenísima 106.3 FM",
        "frequency": "106.3 FM",
        "dial": "106.3",
        "city": "Cabimas",
        "state": "Zulia",
        "sector": "Sector Ambrosio / Av. Intercomunal",
        "region_type": "cabimas_local",
        "category": "tropical",
        "genres": ["Salsa", "Merengue", "Bailable"],
        "tags": "Salsa, Merengue, Fiesta, Bailable",
        "description": "La estación más alegre de Cabimas. Transmitiendo los mejores ritmos bailables, sabor latino y compañía diaria a toda la Costa Oriental del Lago.",
        "stream_url": "https://stream.zeno.fm/asxs03bkrlotv",
        "lat": 10.4180,
        "lon": -71.4650,
        "theme_color": "#ffb703",
        "socials": {
            "facebook": "https://www.facebook.com/p/Buenisima-1063-FM-100057114427007/"
        }
    },
    {
        "id": "cabimas.victoria959",
        "station_id": "cabimas.victoria959",
        "slug": "victoria-959-fm",
        "name": "Victoria 95.9 FM",
        "frequency": "95.9 FM",
        "dial": "95.9",
        "city": "Cabimas",
        "state": "Zulia",
        "sector": "Sector Concordia / Miraflores",
        "region_type": "cabimas_local",
        "category": "tropical",
        "genres": ["Vallenato", "Tropical", "Noticias Locales"],
        "tags": "Vallenato, Pop, Noticias, Comunitaria",
        "description": "Emisora comunitaria y comercial de gran arraigo en Cabimas, transmitiendo los mejores ritmos vallenatos y noticias de la COL.",
        "stream_url": "https://guri.tepuyserver.net/8140/stream",
        "lat": 10.4072,
        "lon": -71.4550,
        "theme_color": "#ff9800",
        "socials": {
            "instagram": "https://www.instagram.com/victoria959fm/",
            "instagram_handle": "@victoria959fm",
            "whatsapp": "https://wa.me/584146009590"
        }
    },
    {
        "id": "cabimas.mision943",
        "station_id": "cabimas.mision943",
        "slug": "mision-943-fm",
        "name": "Misión 94.3 FM",
        "frequency": "94.3 FM",
        "dial": "94.3",
        "city": "Cabimas",
        "state": "Zulia",
        "sector": "Sector Miraflores / Concordia",
        "region_type": "cabimas_local",
        "category": "pop",
        "genres": ["Variada", "Comunitaria", "Opinión"],
        "tags": "Variada, Información, Comunidad, Pop",
        "description": "La voz comunitaria e informativa de Cabimas, transmitiendo mensajes de optimismo, noticias veraces y música selecta desde Miraflores.",
        "stream_url": "https://stream.zeno.fm/unsxrfcdn5jtv",
        "lat": 10.4030,
        "lon": -71.4490,
        "theme_color": "#00a859",
        "socials": {
            "website": "https://www.tufm943.com/",
            "facebook": "https://www.facebook.com/mision943fm/"
        }
    },
    {
        "id": "cabimas.zumaque905",
        "station_id": "cabimas.zumaque905",
        "slug": "zumaque-905-fm",
        "name": "Zumaque 90.5 FM",
        "frequency": "90.5 FM",
        "dial": "90.5",
        "city": "Cabimas",
        "state": "Zulia",
        "sector": "Sector R-10 / El Zumaque",
        "region_type": "cabimas_local",
        "category": "tropical",
        "genres": ["Música Latina", "Tropical", "Noticias"],
        "tags": "Tropical, Latina, Vallenatos, Noticias",
        "description": "Homenaje al pionero petrolero de Venezuela. Música tropical, vallenatos, salsa y cobertura informativa local para el pueblo de Cabimas.",
        "stream_url": "https://stream.zeno.fm/qe1h4q3mxk8uv",
        "lat": 10.3880,
        "lon": -71.4460,
        "theme_color": "#ffb703",
        "socials": {
            "website": "https://onlineradiobox.com/ve/zumaque90.5/"
        }
    },
    {
        "id": "cabimas.sonora995",
        "station_id": "cabimas.sonora995",
        "slug": "sonora-995-fm",
        "name": "Sonora 99.5 FM",
        "frequency": "99.5 FM",
        "dial": "99.5",
        "city": "Cabimas",
        "state": "Zulia",
        "sector": "Sector Las 40s / Casco Central",
        "region_type": "cabimas_local",
        "category": "noticias",
        "genres": ["Radio Libre", "Alternativa", "Comunitaria"],
        "tags": "Radio Libre, Alternativa, Comunidad, Noticias",
        "description": "¡Radio Libre y Alternativa al Servicio de Todos! Dirección general de Luis Medina, transmitiendo cercanía comunitaria y música para Cabimas.",
        "stream_url": "https://stream.zeno.fm/n8zghua6u68uv",
        "lat": 10.4050,
        "lon": -71.4410,
        "theme_color": "#00a8e8",
        "socials": {
            "whatsapp": "https://wa.me/584246814831"
        }
    },
    {
        "id": "cabimas.ciudadstereo939",
        "station_id": "cabimas.ciudadstereo939",
        "slug": "ciudad-stereo-939-fm",
        "name": "Ciudad Stereo 93.9 FM",
        "frequency": "93.9 FM",
        "dial": "93.9",
        "city": "Cabimas",
        "state": "Zulia",
        "sector": "Sector Los Laureles",
        "region_type": "cabimas_local",
        "category": "pop",
        "genres": ["Música Cristiana", "Valores", "Familia"],
        "tags": "Cristiana, Valores, Contemporánea, Esperanza",
        "description": "Sonido inspirador para toda la familia en Cabimas. Programación musical contemporánea y mensajes de esperanza para la Costa Oriental.",
        "stream_url": "https://stream.zeno.fm/zkqm3ojholhtv",
        "lat": 10.4120,
        "lon": -71.4280,
        "theme_color": "#00a859",
        "socials": {}
    },
    {
        "id": "cabimas.radiobarroso",
        "station_id": "cabimas.radiobarroso",
        "slug": "radio-barroso",
        "name": "Radio Barroso",
        "frequency": "WEB",
        "dial": "CABI",
        "city": "Cabimas",
        "state": "Zulia",
        "sector": "Sector El Barroso II / La Rosa",
        "region_type": "cabimas_local",
        "category": "gaitas",
        "genres": ["Gaita Zuliana", "Música Venezolana", "Tradición"],
        "tags": "Gaita, Zuliana, Folclore, Llanera, Barroso",
        "description": "Homenaje viviente al mítico pozo Barroso II (1922). La emisora por excelencia del folclore zuliano, gaitas los 365 días del año y orgullo cabimense.",
        "stream_url": "https://stream.zeno.fm/zrh0rnwuarzuv",
        "lat": 10.3780,
        "lon": -71.4420,
        "theme_color": "#00a859",
        "socials": {
            "website": "https://radio-barroso.blogspot.com/"
        }
    },
    {
        "id": "cabimas.exitosa",
        "station_id": "cabimas.exitosa",
        "slug": "exitosa-fm",
        "name": "Exitosa FM Cabimas",
        "frequency": "WEB",
        "dial": "CABI",
        "city": "Cabimas",
        "state": "Zulia",
        "sector": "Sector Delicias Nuevas",
        "region_type": "cabimas_local",
        "category": "pop",
        "genres": ["Éxitos", "Variada", "Pop"],
        "tags": "Pop, Éxitos, Variada, Juvenil",
        "description": "La señal digital con los éxitos más sonados en Cabimas y la COL. Pop latino, baladas y ritmos del momento.",
        "stream_url": "https://stream.zeno.fm/awtyvmm5muhvv",
        "lat": 10.4110,
        "lon": -71.4390,
        "theme_color": "#e91e63",
        "socials": {
            "website": "https://exitosacabimas.blogspot.com/",
            "facebook": "https://www.facebook.com/ExitosaFm.Cabimas/"
        }
    },
    {
        "id": "cabimas.zulianisima",
        "station_id": "cabimas.zulianisima",
        "slug": "zulianisima-fm",
        "name": "Zulianísima FM",
        "frequency": "WEB",
        "dial": "CABI",
        "city": "Cabimas",
        "state": "Zulia",
        "sector": "Sector Campo Blanco",
        "region_type": "cabimas_local",
        "category": "gaitas",
        "genres": ["Gaita Zuliana", "Tradición", "Noticias"],
        "tags": "Gaita, Zulia, Tradición, Folclore",
        "description": "Pura identidad zuliana desde Cabimas. Gaitas tradicionales y modernas, entrevistas y difusión del gentilicio regional.",
        "stream_url": "https://stream.zeno.fm/m7z6zdlqlrkuv",
        "lat": 10.3950,
        "lon": -71.4360,
        "theme_color": "#00a8e8",
        "socials": {
            "website": "https://www.zulianisimafm.com/"
        }
    },
    {
        "id": "cabimas.diferente",
        "station_id": "cabimas.diferente",
        "slug": "diferente-fm",
        "name": "Diferente FM",
        "frequency": "WEB",
        "dial": "CABI",
        "city": "Cabimas",
        "state": "Zulia",
        "sector": "Sector Tierra Negra",
        "region_type": "cabimas_local",
        "category": "pop",
        "genres": ["Pop", "Alternativa", "Éxitos"],
        "tags": "Pop, Alternativo, Variada",
        "description": "Una propuesta radial fresca e innovadora transmitida desde Cabimas para los oyentes que buscan sonidos distintos y variados.",
        "stream_url": "https://stream.zeno.fm/xgddxc6af2zuv",
        "lat": 10.4220,
        "lon": -71.4480,
        "theme_color": "#ffb703",
        "socials": {
            "website": "https://diferentefm.blogspot.com/"
        }
    },
    {
        "id": "cabimas.sirio",
        "station_id": "cabimas.sirio",
        "slug": "sirio-radio-digital",
        "name": "Sirio Radio Digital",
        "frequency": "WEB",
        "dial": "CABI",
        "city": "Cabimas",
        "state": "Zulia",
        "sector": "Sector Guabina",
        "region_type": "cabimas_local",
        "category": "retro",
        "genres": ["Rock Clásico", "80s & 90s", "Pop"],
        "tags": "Rock, Retro, 80s, Clásicos",
        "description": "Emisora digital transmitiendo desde Cabimas los grandes clásicos anglo y en español de las décadas de oro del rock y pop.",
        "stream_url": "https://stream.zeno.fm/khmxxbjtlzhuv",
        "lat": 10.4020,
        "lon": -71.4320,
        "theme_color": "#ff5722",
        "socials": {
            "website": "https://sirioradiodigital.blogspot.com/"
        }
    },
    {
        "id": "cabimas.infinita",
        "station_id": "cabimas.infinita",
        "slug": "infinita-fm-sin-barreras",
        "name": "Infinita FM ¡Sin Barreras!",
        "frequency": "WEB",
        "dial": "CABI",
        "city": "Cabimas",
        "state": "Zulia",
        "sector": "Sector Las 50s",
        "region_type": "cabimas_local",
        "category": "pop",
        "genres": ["Inclusión", "Música Variada", "Comunidad"],
        "tags": "Inclusión, Variada, Comunidad",
        "description": "Radio inclusiva y comunitaria de Cabimas, abriendo espacios sin barreras para la expresión ciudadana y la música de todos los tiempos.",
        "stream_url": "https://stream.zeno.fm/7bh6uff1cf9uv",
        "lat": 10.4010,
        "lon": -71.4380,
        "theme_color": "#00a8e8",
        "socials": {
            "website": "https://infinitafmweb.blogspot.com/"
        }
    },
    {
        "id": "cabimas.technobuenisima",
        "station_id": "cabimas.technobuenisima",
        "slug": "la-techno-buenisima-247",
        "name": "La Techno Buenísima 24/7",
        "frequency": "WEB",
        "dial": "CABI",
        "city": "Cabimas",
        "state": "Zulia",
        "sector": "Sector Ambrosio / Buenísima Media",
        "region_type": "cabimas_local",
        "category": "urbano",
        "genres": ["Techno", "Electrónica", "Dance 24/7"],
        "tags": "Techno, Electrónica, Club, 24/7",
        "description": "Canal electrónico de alta fidelidad operado por la plataforma Buenísima de Cabimas, con beats ininterrumpidos las 24 horas.",
        "stream_url": "https://stream.zeno.fm/arvboln3rqnuv",
        "lat": 10.4180,
        "lon": -71.4650,
        "theme_color": "#e91e63",
        "socials": {}
    },
    {
        "id": "cabimas.mana",
        "station_id": "cabimas.mana",
        "slug": "mana-fm",
        "name": "MANA FM",
        "frequency": "WEB",
        "dial": "CABI",
        "city": "Cabimas",
        "state": "Zulia",
        "sector": "Sector Ambrosio",
        "region_type": "cabimas_local",
        "category": "pop",
        "genres": ["Música Cristiana", "Reflexión", "Comunidad"],
        "tags": "Cristiana, Fe, Esperanza, Familia",
        "description": "Señal de inspiración y música contemporánea transmitida desde el norte de Cabimas hacia toda la Costa Oriental del Lago.",
        "stream_url": "https://stream.zeno.fm/3rzep03457zuv",
        "lat": 10.4190,
        "lon": -71.4630,
        "theme_color": "#00a859",
        "socials": {
            "website": "https://manafm.org/"
        }
    },
    {
        "id": "cabimas.vinilo",
        "station_id": "cabimas.vinilo",
        "slug": "vinilo-fm-streaming",
        "name": "Vinilo FM Streaming",
        "frequency": "WEB",
        "dial": "CABI",
        "city": "Cabimas",
        "state": "Zulia",
        "sector": "Sector Punta Icotea",
        "region_type": "cabimas_local",
        "category": "retro",
        "genres": ["Baladas", "Retro", "Romántica"],
        "tags": "Retro, Clásicos, Baladas, 80s",
        "description": "Elegancia y recuerdos en vinilo desde la ribera de Cabimas. Los temas que marcaron época en los 70s, 80s y 90s.",
        "stream_url": "https://usa14.fastcast4u.com/proxy/vinilosfm?mp=/1",
        "lat": 10.3950,
        "lon": -71.4550,
        "theme_color": "#ffb703",
        "socials": {}
    }
]

def generate_svg_logo(station, filepath):
    name = station.get("name", "Radio")
    freq = station.get("frequency") or "FM"
    clean_words = [w for w in re.sub(r'[^a-zA-Z0-9\s]', '', name).split() if w.upper() not in ["FM", "RADIO"]]
    initials = "".join([w[0] for w in clean_words[:2]]).upper() if clean_words else "CB"
    color = station.get("theme_color") or "#00a8e8"

    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <defs>
    <linearGradient id="grad_{station['slug']}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1320"/>
      <stop offset="100%" stop-color="{color}"/>
    </linearGradient>
  </defs>
  <rect width="300" height="300" rx="24" fill="url(#grad_{station['slug']})" stroke="#223047" stroke-width="4"/>
  <circle cx="150" cy="115" r="54" fill="rgba(0,0,0,0.5)" stroke="#00a8e8" stroke-width="3"/>
  <text x="150" y="128" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="36" font-weight="900" fill="#ffffff" text-anchor="middle">{initials}</text>
  <rect x="40" y="180" width="220" height="34" rx="8" fill="#ffb703"/>
  <text x="150" y="203" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="16" font-weight="900" fill="#000000" text-anchor="middle">{freq}</text>
  <text x="150" y="248" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="800" fill="#94a3b8" letter-spacing="1.5" text-anchor="middle">CABIMAS, ZULIA</text>
</svg>'''
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(svg_content)

def generate_html_default_art(station):
    freq = station.get("frequency") or "FM"
    name = station.get("name", "Emisora")
    dial_num = station.get("dial") or "98.9"
    dial_band = "FM" if "FM" in freq.upper() else "WEB"
    return f'''<div class="station-default-art" aria-label="{name} {dial_num} {dial_band}">
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
        <span class="art-dial-num">{dial_num}</span>
        <span class="art-dial-band">{dial_band}</span>
      </div>
      <div class="art-tuner-scale" aria-hidden="true">
        <span></span><span></span><span></span><span class="scale-pip"></span><span></span><span></span><span class="scale-needle"></span><span></span><span></span><span></span>
      </div>
      <div class="art-footer-line">
        <span class="art-sub-tag">COSTA ORIENTAL DEL LAGO</span>
      </div>
    </div>'''

def generate_station_biography(station):
    name = station.get("name", "Esta emisora")
    city = "Cabimas"
    sector = station.get("sector") or "Municipio Cabimas"
    freq = station.get("frequency") or "FM"
    genres = station.get("genres") or ["Música Variada"]
    genres_str = ", ".join(genres)
    desc = station.get("description", "")

    return f"""{desc}

{name} es una estación de radio que transmite su señal en vivo desde {sector}, en {city}, Estado Zulia.
Reconocida por su aporte comunicacional a la Costa Oriental del Lago, su propuesta sonora combina lo mejor de {genres_str.lower()},
brindando a los oyentes cabimenses entretenimiento continuo, actualidad informativa y una selección musical representativa de la identidad zuliana y nacional.
Transmitiendo en la frecuencia {freq}, la emisora mantiene una presencia activa tanto en el dial como a través de su señal digital en streaming,
conectando a los habitantes de Cabimas con la diáspora en el resto de Venezuela y el mundo.""".strip()

def build_individual_page(station):
    slug = station["slug"]
    name = station.get("name", "Emisora")
    freq = station.get("frequency") or "FM"
    dial = station.get("dial") or "FM"
    city = "Cabimas"
    sector = station.get("sector") or "Municipio Cabimas, Zulia"
    stream_url = station.get("stream_url") or ""
    logo_src = "../" + station.get("logo_local", f"assets/logos/{slug}.svg")
    bio = generate_station_biography(station)
    lat = float(station.get("lat") or 10.4000)
    lon = float(station.get("lon") or -71.4500)
    socials = station.get("socials") or {}
    theme_color = station.get("theme_color") or "#00a8e8"

    social_links_html = ""
    if socials.get("instagram"):
        social_links_html += f'''
        <a href="{socials['instagram']}" target="_blank" class="social-btn instagram-btn">
          <strong>Instagram</strong>
          <span>{socials.get('instagram_handle', '@' + slug)}</span>
        </a>'''
    if socials.get("whatsapp"):
        social_links_html += f'''
        <a href="{socials['whatsapp']}" target="_blank" class="social-btn whatsapp-btn">
          <strong>WhatsApp Cabina</strong>
          <span>Escribir a cabina</span>
        </a>'''
    if socials.get("website"):
        social_links_html += f'''
        <a href="{socials['website']}" target="_blank" class="social-btn website-btn">
          <strong>Sitio Web Oficial</strong>
          <span>Visitar portal</span>
        </a>'''
    if socials.get("facebook"):
        social_links_html += f'''
        <a href="{socials['facebook']}" target="_blank" class="social-btn facebook-btn">
          <strong>Facebook</strong>
          <span>Página comunitaria</span>
        </a>'''

    if not social_links_html:
        social_links_html = f'''
        <div class="no-socials-box">
          <p>Esta emisora transmite su señal en vivo para Cabimas y la COL a través de cabiplay.</p>
        </div>'''

    default_art_html = generate_html_default_art(station)

    html_content = f'''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover" />
  <meta name="referrer" content="no-referrer" />
  <title>{name} ({freq}) — Cabimas, Zulia en Vivo | cabiplay</title>
  <meta name="description" content="Escucha {name} ({freq}) en vivo desde {sector}, Cabimas, Estado Zulia. Conoce su historia, frecuencia dial y enlaces oficiales en cabiplay." />
  <meta property="og:title" content="{name} ({freq}) — En Vivo desde Cabimas, Zulia" />
  <meta property="og:description" content="{bio[:160]}..." />
  <meta property="og:type" content="music.radio_station" />
  <meta property="og:url" content="https://yenderfonseca.com/cabiplay/estacion/{slug}.html" />
  <link rel="canonical" href="https://yenderfonseca.com/cabiplay/estacion/{slug}.html" />

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

  <style>
    :root {{
      --bg-base: #070a13;
      --bg-surface: #0e1422;
      --bg-card: #141c2e;
      --border: #1e293b;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --celeste: #00a8e8;
      --sol: #ffb703;
      --verde: #00a859;
      --station-accent: {theme_color};
    }}

    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background: var(--bg-base);
      color: var(--text);
      line-height: 1.5;
      padding-bottom: 90px;
    }}

    header.top-nav {{
      background: rgba(7, 10, 19, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      padding: 12px 20px;
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }}

    .back-btn {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--text);
      text-decoration: none;
      font-weight: 700;
      font-size: 0.88rem;
      padding: 8px 14px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 999px;
      transition: all 0.2s;
    }}

    .back-btn:hover {{
      background: var(--celeste);
      color: #000;
      border-color: var(--celeste);
    }}

    .brand-tag {{
      font-size: 0.9rem;
      font-weight: 900;
      letter-spacing: -0.02em;
    }}
    .brand-tag span {{ color: var(--celeste); }}

    .hero-container {{
      max-width: 1000px;
      margin: 32px auto 0;
      padding: 0 20px;
    }}

    .station-hero-card {{
      background: linear-gradient(135deg, rgba(20, 28, 46, 0.95) 0%, rgba(7, 10, 19, 0.98) 100%);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }}

    .station-hero-card::before {{
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--celeste) 0%, var(--verde) 50%, var(--sol) 100%);
    }}

    @media (min-width: 640px) {{
      .station-hero-card {{
        flex-direction: row;
        align-items: center;
      }}
    }}

    .avatar-wrapper {{
      width: 160px;
      height: 160px;
      flex-shrink: 0;
      border-radius: 16px;
      overflow: hidden;
      background: #000;
      border: 2px solid var(--border);
      position: relative;
      margin: 0 auto;
    }}

    .avatar-wrapper img {{
      width: 100%;
      height: 100%;
      object-fit: cover;
    }}

    /* Default HTML Art */
    .station-default-art {{
      width: 100%;
      height: 100%;
      background: #080c14;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 12px 10px;
      text-align: center;
    }}
    .art-flag-ribbon {{
      display: flex;
      width: 100%;
      height: 3px;
      gap: 2px;
    }}
    .ribbon-celeste {{ flex: 1; background: var(--celeste); }}
    .ribbon-verde {{ flex: 1; background: var(--verde); }}
    .ribbon-negro {{ flex: 1; background: #000; }}
    .ribbon-sun {{ flex: 1; background: var(--sol); }}
    .art-brand-tag {{ font-size: 0.65rem; font-weight: 900; color: #64748b; letter-spacing: 0.1em; }}
    .art-live-indicator {{ font-size: 0.6rem; font-weight: 800; color: #22c55e; }}
    .art-live-dot {{ display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #22c55e; margin-right: 3px; }}
    .art-dial-box {{ margin: auto 0; }}
    .art-dial-num {{ font-size: 1.8rem; font-weight: 900; color: #fff; line-height: 1; }}
    .art-dial-band {{ font-size: 0.75rem; font-weight: 800; color: var(--sol); margin-left: 2px; }}
    .art-tuner-scale {{ display: flex; gap: 3px; align-items: flex-end; height: 10px; }}
    .art-tuner-scale span {{ width: 2px; height: 5px; background: #334155; }}
    .art-tuner-scale .scale-pip {{ height: 8px; background: #94a3b8; }}
    .art-tuner-scale .scale-needle {{ height: 10px; width: 2px; background: #ef4444; }}
    .art-sub-tag {{ font-size: 0.55rem; font-weight: 800; color: #64748b; letter-spacing: 0.05em; }}

    .station-info {{
      flex: 1;
      text-align: center;
    }}
    @media (min-width: 640px) {{
      .station-info {{ text-align: left; }}
    }}

    .station-badge-row {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      margin-bottom: 12px;
    }}
    @media (min-width: 640px) {{
      .station-badge-row {{ justify-content: flex-start; }}
    }}

    .badge-pill {{
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}
    .badge-freq {{ background: var(--celeste); color: #000; }}
    .badge-city {{ background: var(--bg-card); color: var(--text-muted); border: 1px solid var(--border); }}
    .badge-live {{ background: rgba(34, 197, 94, 0.15); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }}

    .station-title {{
      font-size: 2rem;
      font-weight: 900;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }}

    .station-sector-sub {{
      font-size: 0.95rem;
      color: var(--text-muted);
      margin-bottom: 16px;
    }}

    .cta-row {{
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
    }}
    @media (min-width: 640px) {{
      .cta-row {{ justify-content: flex-start; }}
    }}

    .btn-play-direct {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--celeste);
      color: #000;
      font-weight: 800;
      font-size: 0.95rem;
      padding: 12px 24px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      text-decoration: none;
      box-shadow: 0 4px 16px rgba(0, 168, 232, 0.3);
      transition: all 0.2s;
    }}
    .btn-play-direct:hover {{
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(0, 168, 232, 0.5);
    }}

    .btn-back-player {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-card);
      color: var(--text);
      font-weight: 700;
      font-size: 0.9rem;
      padding: 12px 20px;
      border-radius: 12px;
      border: 1px solid var(--border);
      text-decoration: none;
      transition: all 0.2s;
    }}
    .btn-back-player:hover {{
      border-color: var(--text-muted);
    }}

    .content-grid {{
      max-width: 1000px;
      margin: 32px auto;
      padding: 0 20px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }}
    @media (min-width: 768px) {{
      .content-grid {{ grid-template-columns: 2fr 1fr; }}
    }}

    .card-panel {{
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
    }}

    .panel-header {{
      font-size: 1.1rem;
      font-weight: 800;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #fff;
    }}

    .bio-text {{
      font-size: 0.95rem;
      color: #cbd5e1;
      white-space: pre-line;
      line-height: 1.7;
    }}

    .social-btn-list {{
      display: flex;
      flex-direction: column;
      gap: 10px;
    }}

    .social-btn {{
      display: flex;
      flex-direction: column;
      padding: 12px 14px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 10px;
      text-decoration: none;
      color: var(--text);
      transition: all 0.2s;
    }}
    .social-btn strong {{ font-size: 0.85rem; font-weight: 800; }}
    .social-btn span {{ font-size: 0.78rem; color: var(--text-muted); }}
    .social-btn:hover {{ border-color: var(--celeste); transform: translateX(3px); }}

    .tech-sheet-table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }}
    .tech-sheet-table td {{
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }}
    .tech-sheet-table td:first-child {{
      color: var(--text-muted);
      width: 45%;
    }}
    .tech-sheet-table td:last-child {{
      font-weight: 700;
      text-align: right;
    }}

    #map-preview {{
      width: 100%;
      height: 200px;
      border-radius: 12px;
      overflow: hidden;
      margin-top: 14px;
      border: 1px solid var(--border);
    }}

    /* Persistent Mini-Audio Player */
    .mini-player-bar {{
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(7, 10, 19, 0.98);
      backdrop-filter: blur(14px);
      border-top: 1px solid var(--border);
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 1000;
    }}
    .mini-player-info {{
      display: flex;
      align-items: center;
      gap: 12px;
    }}
    .mini-player-info strong {{ font-size: 0.9rem; }}
    .mini-player-info span {{ font-size: 0.75rem; color: var(--text-muted); }}
    .btn-toggle-play {{
      background: var(--celeste);
      border: none;
      color: #000;
      font-weight: 900;
      font-size: 0.82rem;
      padding: 10px 20px;
      border-radius: 999px;
      cursor: pointer;
    }}
  </style>
</head>
<body>

  <header class="top-nav">
    <a href="../#station-{slug}" class="back-btn">
      ← Volver al Dial
    </a>
    <div class="brand-tag">
      <span>cabi</span>play • <strong>{city.upper()}</strong>
    </div>
  </header>

  <div class="hero-container">
    <div class="station-hero-card">
      <div class="avatar-wrapper">
        <img src="{logo_src}" alt="{name} Logo" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';" />
        <div style="display:none; width:100%; height:100%;">
          {default_art_html}
        </div>
      </div>

      <div class="station-info">
        <div class="station-badge-row">
          <span class="badge-pill badge-freq">{freq}</span>
          <span class="badge-pill badge-city">{sector}</span>
          <span class="badge-pill badge-live">● EN VIVO</span>
        </div>
        <h1 class="station-title">{name}</h1>
        <p class="station-sector-sub">{sector} — Cabimas, Zulia, Venezuela</p>

        <div class="cta-row">
          <a href="../#station-{slug}" class="btn-play-direct">
            Sintonizar en Vivo
          </a>
          <a href="../" class="btn-back-player">
            Explorar todas las emisoras
          </a>
        </div>
      </div>
    </div>
  </div>

  <div class="content-grid">
    <div class="card-panel">
      <h2 class="panel-header">Historia & Propuesta Radial</h2>
      <p class="bio-text">{bio}</p>
    </div>

    <div style="display: flex; flex-direction: column; gap: 24px;">
      <div class="card-panel">
        <h2 class="panel-header">Redes & Contacto</h2>
        <div class="social-btn-list">
          {social_links_html}
        </div>
      </div>

      <div class="card-panel">
        <h2 class="panel-header">Ficha Técnica</h2>
        <table class="tech-sheet-table">
          <tr>
            <td>Dial</td>
            <td>{freq}</td>
          </tr>
          <tr>
            <td>Municipio</td>
            <td>Cabimas</td>
          </tr>
          <tr>
            <td>Sector</td>
            <td>{sector.split('/')[0].strip()}</td>
          </tr>
          <tr>
            <td>Estado</td>
            <td>Zulia, Venezuela</td>
          </tr>
          <tr>
            <td>Coordenadas</td>
            <td>{lat:.4f}° N, {abs(lon):.4f}° W</td>
          </tr>
          <tr>
            <td>Transmisión</td>
            <td>Streaming Directo</td>
          </tr>
        </table>

        <div id="map-preview"></div>
      </div>
    </div>
  </div>

  <!-- Persistent Live Audio Element -->
  <div class="mini-player-bar">
    <div class="mini-player-info">
      <div>
        <strong>{name}</strong>
        <p><span>{freq} • {city}</span></p>
      </div>
    </div>
    <audio id="station-audio" src="{stream_url}" preload="none"></audio>
    <button id="mini-play-btn" class="btn-toggle-play" onclick="toggleAudio()">
      REPRODUCIR
    </button>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    // Leaflet mini map
    const map = L.map('map-preview', {{
      center: [{lat}, {lon}],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    }});

    L.tileLayer('https://{{s}}.basemaps.cartocdn.com/rastertiles/voyager/{{z}}/{{x}}/{{y}}{{r}}.png', {{
      maxZoom: 18
    }}).addTo(map);

    L.marker([{lat}, {lon}]).addTo(map)
      .bindPopup("<b>{name}</b><br>{sector}")
      .openPopup();

    // Audio Playback
    const audio = document.getElementById('station-audio');
    const btn = document.getElementById('mini-play-btn');

    function toggleAudio() {{
      if (audio.paused) {{
        audio.play().then(() => {{
          btn.textContent = 'PAUSAR';
          btn.style.background = '#ef4444';
          btn.style.color = '#fff';
        }}).catch(e => {{
          console.error(e);
          alert('Conectando a la señal en vivo de Cabimas...');
        }});
      }} else {{
        audio.pause();
        btn.textContent = 'REPRODUCIR';
        btn.style.background = '#00a8e8';
        btn.style.color = '#000';
      }}
    }}
  </script>
</body>
</html>'''

    page_path = os.path.join(PAGES_DIR, f"{slug}.html")
    with open(page_path, "w", encoding="utf-8") as f:
        f.write(html_content)

def main():
    print(f"Sanitizing Cabimas radio catalog: exactly {len(CABIMAS_STATIONS)} authentic Cabimas stations...")
    os.makedirs(LOGOS_DIR, exist_ok=True)
    os.makedirs(PAGES_DIR, exist_ok=True)
    os.makedirs(os.path.join(BASE_DIR, "archive"), exist_ok=True)

    # 1. Logos
    for station in CABIMAS_STATIONS:
        slug = station["slug"]
        png_path = os.path.join(LOGOS_DIR, f"{slug}.png")
        svg_path = os.path.join(LOGOS_DIR, f"{slug}.svg")
        generate_svg_logo(station, svg_path)
        if os.path.exists(png_path) and os.path.getsize(png_path) > 500:
            station["logo_local"] = f"assets/logos/{slug}.png"
            station["logo"] = f"assets/logos/{slug}.png"
        else:
            station["logo_local"] = f"assets/logos/{slug}.svg"
            station["logo"] = f"assets/logos/{slug}.svg"

    # 2. Write stations.json
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(CABIMAS_STATIONS, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(CABIMAS_STATIONS)} stations to {DATA_FILE}")

    # 3. Write archive/stations_archive.json
    with open(ARCHIVE_JSON, "w", encoding="utf-8") as f:
        json.dump(CABIMAS_STATIONS, f, indent=2, ensure_ascii=False)
    print(f"Saved archive JSON to {ARCHIVE_JSON}")

    # 4. Write archive/stations_archive.csv
    csv_fields = ["id", "name", "frequency", "dial", "city", "state", "sector", "category", "stream_url", "lat", "lon"]
    with open(ARCHIVE_CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=csv_fields, extrasaction="ignore")
        writer.writeheader()
        for s in CABIMAS_STATIONS:
            writer.writerow(s)
    print(f"Saved archive CSV to {ARCHIVE_CSV}")

    # 5. Clean up old HTML pages in estacion/
    valid_slugs = {f"{s['slug']}.html" for s in CABIMAS_STATIONS}
    existing_pages = os.listdir(PAGES_DIR)
    pruned_count = 0
    for p in existing_pages:
        if p.endswith(".html") and p not in valid_slugs:
            os.remove(os.path.join(PAGES_DIR, p))
            pruned_count += 1
    print(f"Pruned {pruned_count} non-Cabimas HTML pages from {PAGES_DIR}")

    # 6. Generate individual pages
    for s in CABIMAS_STATIONS:
        build_individual_page(s)
    print(f"Generated {len(CABIMAS_STATIONS)} individual station pages in {PAGES_DIR}")

if __name__ == "__main__":
    main()
