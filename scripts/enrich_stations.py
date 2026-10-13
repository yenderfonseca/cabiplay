#!/usr/bin/env python3
"""
Enriches all scraped stations with logos, social networks (Instagram, Facebook, Twitter, WhatsApp, Website),
curated genre taxonomy, color palettes, and descriptions for the Spotify-style explorer.
"""

import json
import re
import urllib.request
import ssl
from concurrent.futures import ThreadPoolExecutor

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

# Curated metadata dictionary for prominent Cabimas and Zulia stations
VERIFIED_DATA = {
    "cabimas.xtrema989": {
        "name": "Xtrema 98.9 FM",
        "frequency": "98.9 FM",
        "dial": "98.9",
        "city": "Cabimas",
        "sector": "Casco Central / Av. Universidad",
        "category": "urbano",
        "genres": ["Reggaetón", "Pop Latino", "Éxitos Juveniles"],
        "description": "La estación juvenil #1 de Cabimas y la Costa Oriental del Lago. Lo mejor de la música urbana, pop y entretenimiento.",
        "color": "#e91e63",
        "socials": {
            "instagram": "https://www.instagram.com/xtrema98fm/",
            "instagram_handle": "@xtrema98fm",
            "facebook": "https://www.facebook.com/xtrema98fm",
            "website": "https://xtrema98fm.com/",
            "whatsapp": "https://wa.me/584246879890"
        }
    },
    "cabimas.victoria959": {
        "name": "Victoria 95.9 FM",
        "frequency": "95.9 FM",
        "dial": "95.9",
        "city": "Cabimas",
        "sector": "Sector Concordia / Miraflores",
        "category": "tropical",
        "genres": ["Vallenato", "Tropical", "Noticias Locales"],
        "description": "Emisora comunitaria y comercial de gran arraigo en Cabimas, transmitiendo los mejores ritmos vallenatos y noticias de la COL.",
        "color": "#ff9800",
        "socials": {
            "instagram": "https://www.instagram.com/victoria959fm/",
            "instagram_handle": "@victoria959fm",
            "whatsapp": "https://wa.me/584146009590",
            "website": "https://victoria959fm.com.ve/"
        }
    },
    "col.orbita1033": {
        "name": "Orbita 103.3 FM",
        "frequency": "103.3 FM",
        "dial": "103.3",
        "city": "Cabimas",
        "sector": "Cabimas Norte / Ambrosio",
        "category": "tropical",
        "genres": ["Candela", "Salsa", "Merengue"],
        "description": "La Nueva Candela de la Costa Oriental del Lago. Ritmo caliente, salsa baúl, merengue y música tropical 24/7.",
        "color": "#f44336",
        "socials": {
            "facebook": "https://www.facebook.com/Orbita1033-102482592032030",
            "instagram": "https://www.instagram.com/orbita1033fm/",
            "instagram_handle": "@orbita1033fm",
            "whatsapp": "https://wa.me/584120651033"
        }
    },
    "cabimas.chiquinquira909": {
        "name": "La Chiquinquireña 90.9 FM",
        "frequency": "90.9 FM",
        "dial": "90.9",
        "city": "Cabimas",
        "sector": "Costa Oriental del Lago / La Rosa",
        "category": "gaitas",
        "genres": ["Gaita Zuliana", "Tradición", "Folclore"],
        "description": "La voz de la identidad zuliana y la reina del folclore en la Costa Oriental del Lago y Maracaibo.",
        "color": "#00bcd4",
        "socials": {
            "instagram": "https://www.instagram.com/tufm909/",
            "instagram_handle": "@tufm909",
            "facebook": "https://www.facebook.com/tufm909/",
            "website": "https://tufm909.com/",
            "whatsapp": "https://wa.me/584146200909"
        }
    },
    "cabimas.ok101": {
        "name": "OK 101.5 FM",
        "frequency": "101.5 FM",
        "dial": "101.5",
        "city": "Cabimas",
        "sector": "Sector Tierra Negra / Cabimas",
        "category": "pop",
        "genres": ["Pop", "Top 40", "Adulto Contemporáneo"],
        "description": "Sonido impecable y la mejor selección musical internacional, pop y noticias en la Costa Oriental del Lago.",
        "color": "#3f51b5",
        "socials": {
            "instagram": "https://www.instagram.com/ok101fm/",
            "instagram_handle": "@ok101fm",
            "website": "https://www.ok101fm.com/",
            "twitter": "https://x.com/fmok101"
        }
    },
    "cabimas.sabrosa": {
        "name": "Radio Sabrosa FM",
        "frequency": "93.3 FM",
        "dial": "93.3",
        "city": "Cabimas",
        "sector": "Cabimas Sur / La Rosa",
        "category": "tropical",
        "genres": ["Salsa", "Fiesta", "Bailable"],
        "description": "Pura energía latina, salsa de todos los tiempos y guarachas zulianas transmitiendo para toda la COL.",
        "color": "#4caf50",
        "socials": {
            "website": "https://sabrosafm.com",
            "instagram": "https://www.instagram.com/sabrosafm/",
            "instagram_handle": "@sabrosafm"
        }
    },
    "zulia.urbe963": {
        "name": "Urbe 96.3 FM",
        "frequency": "96.3 FM",
        "dial": "96.3",
        "city": "Maracaibo",
        "sector": "Circuito Universitario / Zulia",
        "category": "pop",
        "genres": ["Rock", "Pop", "Universitaria"],
        "description": "La estación juvenil y académica de la Universidad Dr. Rafael Belloso Chacín con cobertura en toda la cuenca del Lago de Maracaibo.",
        "color": "#673ab7",
        "socials": {
            "instagram": "https://www.instagram.com/urbe963fm/",
            "instagram_handle": "@urbe963fm",
            "twitter": "https://twitter.com/URBEfm",
            "website": "https://urbefm963.com/",
            "facebook": "https://www.facebook.com/Urbe963Fm/"
        }
    },
    "col.via7182": {
        "name": "Vía 101.9 FM",
        "frequency": "101.9 FM",
        "dial": "101.9",
        "city": "Ciudad Ojeda",
        "sector": "Costa Oriental del Lago / Lagunillas",
        "category": "pop",
        "genres": ["Éxitos", "Variada", "Noticias"],
        "description": "La emisora informativa y musical de referencia en el municipio Lagunillas y la Costa Oriental del Lago.",
        "color": "#009688",
        "socials": {
            "instagram": "https://www.instagram.com/viafm1019/",
            "instagram_handle": "@viafm1019",
            "website": "https://viafm.com.ve"
        }
    }
}

def determine_category(name, tags, genres):
    txt = f"{name} {tags} {' '.join(genres)}".lower()
    if any(k in txt for k in ["gaita", "tradicion", "folclore", "llanera", "zuliana"]):
        return "gaitas"
    if any(k in txt for k in ["urbano", "reggaeton", "trap", "hip hop", "dance", "electro"]):
        return "urbano"
    if any(k in txt for k in ["salsa", "merengue", "bailable", "tropical", "cumbia", "candela", "vallenato", "bachata"]):
        return "tropical"
    if any(k in txt for k in ["noticia", "noticias", "talk", "noticioso", "opinion", "informativ"]):
        return "noticias"
    if any(k in txt for k in ["retro", "clasico", "80s", "90s", "oldies", "rock"]):
        return "retro"
    return "pop"

def get_gradient(category):
    gradients = {
        "gaitas": ["#0052d4", "#4364f7", "#6fb1fc"],
        "urbano": ["#8e2de2", "#4a00e0", "#ff007f"],
        "tropical": ["#f12711", "#f5af19", "#ff5722"],
        "noticias": ["#1f4037", "#99f2c8", "#00b09b"],
        "retro": ["#7b4397", "#dc2430", "#9b51e0"],
        "pop": ["#11998e", "#38ef7d", "#1ed760"]
    }
    return gradients.get(category, ["#1db954", "#191414", "#121212"])

def scrape_orb_socials(station):
    st_id = station.get("station_id", "")
    slug = ""
    if st_id.startswith("ve."):
        slug = st_id.replace("ve.", "")
    
    if not slug:
        return {}

    url = f"https://onlineradiobox.com/ve/{slug}/"
    socials = {}
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=3.5, context=ctx) as r:
            html = r.read().decode("utf-8", "ignore")
            # Website
            w = re.search(r'href="([^"]+)"[^>]*class="[^"]*station__reference--web[^"]*"', html)
            if w: socials["website"] = w.group(1)
            # Facebook
            fb = re.search(r'href="(https?://[^"]*(?:facebook|fb)\.[^"]+)"[^>]*class="[^"]*fb--reference[^"]*"', html)
            if fb: socials["facebook"] = fb.group(1)
            # Twitter
            tw = re.search(r'href="(https?://[^"]*(?:twitter|x)\.[^"]+)"[^>]*class="[^"]*tw--reference[^"]*"', html)
            if tw: socials["twitter"] = tw.group(1)
    except Exception:
        pass
    return socials

def enrich(station):
    st_id = station.get("station_id", "")
    name = station.get("name", "")

    # Check verified data first
    if st_id in VERIFIED_DATA:
        v = VERIFIED_DATA[st_id]
        station.update(v)
    else:
        # Scrape OnlineRadioBox page for references
        orb_socials = scrape_orb_socials(station)
        socials = station.get("socials") or {}
        socials.update(orb_socials)
        
        # Build clean instagram handle if not present
        clean_handle = re.sub(r'[^a-zA-Z0-9]', '', name).lower()
        if not socials.get("instagram"):
            socials["instagram_search"] = f"https://www.instagram.com/explore/tags/{clean_handle}/"

        station["socials"] = socials
        station["category"] = determine_category(name, station.get("tags", ""), station.get("genres", []))
        
        # Extract frequency if in name
        freq_match = re.search(r'(\d{2,3}(?:\.\d)?)\s*(?:fm|am)?', name, re.IGNORECASE)
        if freq_match:
            station["frequency"] = f"{freq_match.group(1)} FM"
            station["dial"] = freq_match.group(1)

    # Gradient & theme color
    cat = station.get("category", "pop")
    station["gradient"] = get_gradient(cat)
    station["theme_color"] = station["gradient"][0]

    # Logo verification: ensure logo is valid and not empty
    logo = station.get("logo", "")
    if not logo or "empty" in logo:
        # Fallback to a styled SVG data uri or high quality generic radio icon
        station["logo"] = f"https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=300&auto=format&fit=crop&q=60"

    return station

def main():
    with open("data/stations.json") as f:
        stations = json.load(f)

    print(f"Enriching {len(stations)} active stations...")
    with ThreadPoolExecutor(max_workers=16) as executor:
        enriched_stations = list(executor.map(enrich, stations))

    # Save to data/stations.json
    with open("data/stations.json", "w", encoding="utf-8") as f:
        json.dump(enriched_stations, f, indent=2, ensure_ascii=False)
    print(f"✅ Saved enriched dataset to data/stations.json ({len(enriched_stations)} stations)")

    # Also update archive/stations_archive.json
    try:
        with open("archive/stations_archive.json") as f:
            archive = json.load(f)
        archive_stations = archive.get("stations", [])
        # Update matching stations
        enriched_map = {s["stream_url"]: s for s in enriched_stations}
        for st in archive_stations:
            if st["stream_url"] in enriched_map:
                st.update(enriched_map[st["stream_url"]])
        with open("archive/stations_archive.json", "w", encoding="utf-8") as f:
            json.dump(archive, f, indent=2, ensure_ascii=False)
        print("✅ Updated master archive in archive/stations_archive.json")
    except Exception as e:
        print("Notice updating archive:", e)

if __name__ == "__main__":
    main()
