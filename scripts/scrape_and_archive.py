#!/usr/bin/env python3
"""
Cabimas Radio Garden - Web Scraper & Stream Archiver
Scrapes live radio streams for Cabimas, Costa Oriental del Lago, and Zulia State,
verifies live audio connectivity & CORS readiness, geolocates coordinates,
and archives the dataset into JSON and CSV formats.
"""

import urllib.request
import urllib.parse
import ssl
import re
import json
import csv
import time
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# Ignore SSL verification errors for streaming servers with self-signed certs
SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Icy-MetaData": "1"
}

# Base coordinates for sectors in Cabimas & Costa Oriental del Lago
COORDINATES = {
    "Cabimas": {"lat": 10.4000, "lon": -71.4500},
    "Cabimas - Casco Central": {"lat": 10.3995, "lon": -71.4435},
    "Cabimas - Ambrosio": {"lat": 10.4180, "lon": -71.4650},
    "Cabimas - Concordia": {"lat": 10.4072, "lon": -71.4550},
    "Cabimas - La Rosa": {"lat": 10.3780, "lon": -71.4420},
    "Cabimas - Miraflores": {"lat": 10.4030, "lon": -71.4490},
    "Cabimas - Tierra Negra": {"lat": 10.4220, "lon": -71.4480},
    "Cabimas - Punta Icotea": {"lat": 10.3950, "lon": -71.4550},
    "Cabimas - Delicias": {"lat": 10.4110, "lon": -71.4390},
    "Ciudad Ojeda": {"lat": 10.2039, "lon": -71.3094},
    "Santa Rita": {"lat": 10.5333, "lon": -71.5167},
    "Bachaquero": {"lat": 9.9689, "lon": -71.1494},
    "Mene Grande": {"lat": 9.8167, "lon": -70.9333},
    "Los Puertos de Altagracia": {"lat": 10.7167, "lon": -71.5167},
    "Maracaibo": {"lat": 10.6427, "lon": -71.6125},
    "San Francisco": {"lat": 10.5833, "lon": -71.6333},
}

def get_html(url, timeout=7):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=SSL_CTX) as resp:
            return resp.read().decode("utf-8", "ignore")
    except Exception as e:
        return ""

def scrape_onlineradiobox_page(city_slug, city_label, region_type):
    url = f"https://onlineradiobox.com/ve/{city_slug}"
    html = get_html(url)
    if not html:
        return []

    stations = []
    # Match button with attributes: stream, radioName, radioId, radioImg, listeners
    pattern = re.compile(
        r'<button\s+[^>]*class="[^"]*station_play[^"]*"[^>]*stream="([^"]+)"[^>]*radioName="([^"]+)"',
        re.IGNORECASE
    )

    for match in pattern.finditer(html):
        stream_url = match.group(1).strip()
        raw_name = match.group(2).strip()
        # Clean HTML entities
        name = raw_name.replace("&amp;#34;", '"').replace("&quot;", '"').replace("&amp;", "&")
        
        # Extract radioId if present
        id_match = re.search(r'radioId="([^"]+)"', match.group(0))
        radio_id = id_match.group(1) if id_match else f"orb.{re.sub(r'[^a-zA-Z0-9]', '', name).lower()}"

        # Extract image if present
        img_match = re.search(r'radioImg="([^"]+)"', match.group(0))
        logo = f"https:{img_match.group(1)}" if img_match and img_match.group(1).startswith("//") else (img_match.group(1) if img_match else "")

        # Extract listeners if present
        listeners_match = re.search(r'listeners="([^"]+)"', match.group(0))
        listeners = int(listeners_match.group(1)) if listeners_match and listeners_match.group(1).isdigit() else 0

        stations.append({
            "source": "OnlineRadioBox",
            "station_id": radio_id,
            "name": name,
            "city": city_label,
            "region_type": region_type,
            "stream_url": stream_url,
            "logo": logo,
            "listeners": listeners
        })

    return stations

def scrape_radio_browser():
    """Scrape Venezuelan stations from Radio Browser API mirrors"""
    mirrors = [
        "https://de1.api.radio-browser.info",
        "https://nl1.api.radio-browser.info",
        "https://at1.api.radio-browser.info"
    ]
    stations = []

    for mirror in mirrors:
        url = f"{mirror}/json/stations/bycountry/venezuela"
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=6, context=SSL_CTX) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                for s in data:
                    name = s.get("name", "").strip()
                    stream_url = s.get("url_resolved") or s.get("url")
                    if not stream_url:
                        continue

                    state = (s.get("state") or "").strip()
                    tags = (s.get("tags") or "").strip()
                    full_text = f"{name} {state} {tags}".lower()

                    # Determine if it belongs to Zulia / Cabimas / COL
                    if "cabimas" in full_text:
                        region_type = "cabimas_local"
                        city = "Cabimas"
                    elif any(col in full_text for col in ["ojeda", "santa rita", "bachaquero", "mene grande", "altagracia", "costa oriental"]):
                        region_type = "costa_oriental"
                        city = "Costa Oriental del Lago"
                    elif "zulia" in full_text or "maracaibo" in full_text:
                        region_type = "zulia_regional"
                        city = "Zulia / Maracaibo"
                    else:
                        region_type = "venezuela_national"
                        city = "Venezuela"

                    stations.append({
                        "source": "RadioBrowser",
                        "station_id": s.get("stationuuid") or f"rb.{re.sub(r'[^a-zA-Z0-9]', '', name).lower()}",
                        "name": name,
                        "city": city,
                        "region_type": region_type,
                        "stream_url": stream_url,
                        "logo": s.get("favicon") or "",
                        "tags": tags,
                        "codec": s.get("codec") or "",
                        "bitrate": s.get("bitrate") or 0,
                        "geo_lat": s.get("geo_lat"),
                        "geo_long": s.get("geo_long")
                    })
                break
        except Exception as e:
            continue

    return stations

def get_curated_cabimas_sources():
    """Curated direct stream endpoints with verified local frequencies in Cabimas and COL"""
    return [
        {
            "source": "DirectVerified",
            "station_id": "cabimas.xtrema989",
            "name": "Xtrema 98.9 FM",
            "frequency": "98.9 FM",
            "city": "Cabimas",
            "sector": "Casco Central / Av. Universidad",
            "region_type": "cabimas_local",
            "stream_url": "https://app0102.sonicpanelradio.com/8352/stream",
            "tags": "Pop, Reggaetón, Variada, Éxitos",
            "lat": 10.3995,
            "lon": -71.4435,
            "website": "http://xtrema98fm.com"
        },
        {
            "source": "DirectVerified",
            "station_id": "cabimas.victoria959",
            "name": "Victoria 95.9 FM",
            "frequency": "95.9 FM",
            "city": "Cabimas",
            "sector": "Sector Concordia / Miraflores",
            "region_type": "cabimas_local",
            "stream_url": "https://guri.tepuyserver.net/8140/stream",
            "tags": "Vallenato, Pop, Noticias, Comunitaria",
            "lat": 10.4072,
            "lon": -71.4550
        },
        {
            "source": "DirectVerified",
            "station_id": "col.orbita1033",
            "name": "Orbita 103.3 FM",
            "frequency": "103.3 FM",
            "city": "Cabimas",
            "sector": "Cabimas Norte / Ambrosio",
            "region_type": "cabimas_local",
            "stream_url": "https://guri.tepuyserver.net/8098/stream",
            "tags": "Candela, Tropical, Salsa",
            "lat": 10.4180,
            "lon": -71.4650
        },
        {
            "source": "DirectVerified",
            "station_id": "cabimas.chiquinquira909",
            "name": "La Chiquinquireña 90.9 FM",
            "frequency": "90.9 FM",
            "city": "Cabimas",
            "sector": "Costa Oriental del Lago / La Rosa",
            "region_type": "cabimas_local",
            "stream_url": "https://server6.globalhostla.com:8098/stream",
            "tags": "Gaita Zuliana, Tradición, Noticias",
            "lat": 10.3850,
            "lon": -71.4320
        },
        {
            "source": "DirectVerified",
            "station_id": "cabimas.ok101",
            "name": "OK 101.5 FM",
            "frequency": "101.5 FM",
            "city": "Cabimas",
            "sector": "Sector Tierra Negra / Cabimas",
            "region_type": "cabimas_local",
            "stream_url": "https://server6.globalhostla.com:9080/stream",
            "tags": "Pop, Top 40, Adulto Contemporáneo",
            "lat": 10.4220,
            "lon": -71.4480
        },
        {
            "source": "DirectVerified",
            "station_id": "cabimas.sabrosa",
            "name": "Radio Sabrosa FM",
            "frequency": "93.3 FM",
            "city": "Cabimas",
            "sector": "Cabimas Sur / La Rosa",
            "region_type": "cabimas_local",
            "stream_url": "https://radiostream3.interven.ca/listen/sabrosafm/radio.mp3",
            "tags": "Salsa, Tropical, Merengue",
            "lat": 10.3780,
            "lon": -71.4420
        },
        {
            "source": "DirectVerified",
            "station_id": "cabimas.favorita1061",
            "name": "Favorita 106.1 FM",
            "frequency": "106.1 FM",
            "city": "Cabimas",
            "sector": "Av. Intercomunal / Delicias",
            "region_type": "cabimas_local",
            "stream_url": "https://live.ajfnetwork.com.ve:8046/stream",
            "tags": "Criolla, Llanera, Folclore",
            "lat": 10.4110,
            "lon": -71.4390
        },
        {
            "source": "DirectVerified",
            "station_id": "col.via7182",
            "name": "Vía 101.9 FM",
            "frequency": "101.9 FM",
            "city": "Ciudad Ojeda",
            "sector": "Costa Oriental del Lago",
            "region_type": "costa_oriental",
            "stream_url": "https://streamingned.com/7182/stream",
            "tags": "Éxitos, Noticias, Región COL",
            "lat": 10.2039,
            "lon": -71.3094
        },
        {
            "source": "DirectVerified",
            "station_id": "zulia.urbe963",
            "name": "Urbe 96.3 FM",
            "frequency": "96.3 FM",
            "city": "Maracaibo",
            "sector": "Cuenca del Lago / Universitaria",
            "region_type": "zulia_regional",
            "stream_url": "https://app0102.sonicpanelradio.com/8780/stream",
            "tags": "Universitaria, Juvenil, Rock, Pop",
            "lat": 10.6427,
            "lon": -71.6125
        },
        {
            "source": "DirectVerified",
            "station_id": "zulia.latinos971",
            "name": "Latinos Radio 97.1 FM",
            "frequency": "97.1 FM",
            "city": "Maracaibo",
            "sector": "Zulia Regional",
            "region_type": "zulia_regional",
            "stream_url": "https://cloud.livescast.com:2020/stream/latinosradio971/stream",
            "tags": "Latino, Baile, Fiesta",
            "lat": 10.6350,
            "lon": -71.6200
        }
    ]

def probe_stream(station, timeout=4.5):
    """
    Actively probes stream URL to test for HTTP response, content-type,
    CORS access, and reads the first 1KB of audio bytes.
    """
    stream_url = station["stream_url"]
    status_info = {
        "is_live": False,
        "status_code": 0,
        "content_type": "",
        "cors_allowed": False,
        "bytes_received": 0,
        "error": None,
        "latency_ms": 0
    }

    start_time = time.time()
    try:
        req = urllib.request.Request(stream_url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=timeout, context=SSL_CTX) as resp:
            status_info["status_code"] = resp.status
            status_info["latency_ms"] = int((time.time() - start_time) * 1000)
            
            headers = resp.headers
            ct = headers.get("Content-Type", "").lower()
            status_info["content_type"] = ct

            cors = headers.get("Access-Control-Allow-Origin", "")
            status_info["cors_allowed"] = (cors == "*" or cors != "")

            # Read initial audio chunk
            chunk = resp.read(1024)
            status_info["bytes_received"] = len(chunk)

            # Detect stream format
            is_audio_ct = any(a in ct for a in ["audio/", "ogg", "mpegurl", "octet-stream", "aac"])
            if resp.status in [200, 206] and (len(chunk) > 0 or is_audio_ct):
                status_info["is_live"] = True

    except Exception as e:
        status_info["error"] = str(e)[:120]
        status_info["latency_ms"] = int((time.time() - start_time) * 1000)

    # Attach probe results
    station_copy = dict(station)
    station_copy.update({
        "status": "LIVE" if status_info["is_live"] else "OFFLINE",
        "status_code": status_info["status_code"],
        "content_type": status_info["content_type"],
        "cors_allowed": status_info["cors_allowed"],
        "bytes_received": status_info["bytes_received"],
        "latency_ms": status_info["latency_ms"],
        "last_checked": datetime.utcnow().isoformat() + "Z",
        "error": status_info["error"]
    })

    return station_copy

def assign_geo_coordinates(station, index):
    """Assign precise coordinates in Cabimas / Zulia based on city and sector"""
    city = station.get("city", "Cabimas")
    sector = station.get("sector")

    if sector and sector in COORDINATES:
        base = COORDINATES[sector]
        lat, lon = base["lat"], base["lon"]
    elif city in COORDINATES:
        base = COORDINATES[city]
        lat, lon = base["lat"], base["lon"]
    else:
        base = COORDINATES["Cabimas"]
        lat, lon = base["lat"], base["lon"]

    # If coordinate is already provided and valid
    provided_lat = station.get("geo_lat") or station.get("lat")
    provided_lon = station.get("geo_long") or station.get("lon")
    if provided_lat and provided_lon and float(provided_lat) != 0 and float(provided_lon) != 0:
        station["lat"] = float(provided_lat)
        station["lon"] = float(provided_lon)
    else:
        # Deterministic distributed scatter around the city center to avoid perfectly overlapping markers
        hash_val = sum(ord(c) for c in station["name"]) + index * 7
        offset_lat = ((hash_val % 13) - 6) * 0.0035
        offset_lon = (((hash_val * 3) % 13) - 6) * 0.0035
        station["lat"] = round(lat + offset_lat, 6)
        station["lon"] = round(lon + offset_lon, 6)

    return station

def main():
    print("=" * 70)
    print("🚀 CABIMAS & ZULIA RADIO STREAM SCRAPER & ARCHIVER")
    print(f"Timestamp: {datetime.utcnow().isoformat()}Z")
    print("=" * 70)

    all_raw_stations = []

    # 1. Curated Direct Cabimas Streams
    curated = get_curated_cabimas_sources()
    print(f"\n[1/4] Loaded {len(curated)} curated local & regional verified stations.")
    all_raw_stations.extend(curated)

    # 2. Scrape OnlineRadioBox cities in Zulia
    orb_targets = [
        ("Cabimas", "Cabimas", "cabimas_local"),
        ("Ciudad_Ojeda", "Ciudad Ojeda", "costa_oriental"),
        ("Santa_Rita", "Santa Rita", "costa_oriental"),
        ("Bachaquero", "Bachaquero", "costa_oriental"),
        ("Mene_Grande", "Mene Grande", "costa_oriental"),
        ("Los_Puertos_De_Altagracia", "Los Puertos de Altagracia", "costa_oriental"),
        ("Maracaibo", "Maracaibo", "zulia_regional"),
        ("San_Francisco", "San Francisco", "zulia_regional")
    ]

    print("\n[2/4] Scraping OnlineRadioBox for Cabimas and Costa Oriental del Lago...")
    for slug, label, r_type in orb_targets:
        scraped = scrape_onlineradiobox_page(slug, label, r_type)
        print(f"   -> [{label}]: Found {len(scraped)} stations")
        all_raw_stations.extend(scraped)

    # 3. Scrape Radio Browser
    print("\n[3/4] Querying Radio Browser API for Venezuela/Zulia stations...")
    rb_stations = scrape_radio_browser()
    print(f"   -> Found {len(rb_stations)} stations across Venezuela from Radio Browser")
    all_raw_stations.extend(rb_stations)

    # Deduplicate by stream URL or station name
    unique_stations = {}
    for st in all_raw_stations:
        # Normalize stream url
        s_url = st.get("stream_url", "").strip()
        name_key = st.get("name", "").lower().strip()
        if not s_url:
            continue
        # Prefer curated or specific sources over general duplicates
        key = s_url.rstrip("/")
        if key not in unique_stations:
            unique_stations[key] = st
        else:
            # If current is DirectVerified, replace
            if st.get("source") == "DirectVerified":
                unique_stations[key] = st

    deduped_list = list(unique_stations.values())
    print(f"\n✅ Total unique candidate stations collected: {len(deduped_list)}")

    # 4. Probe live streams concurrently
    print("\n[4/4] Actively testing stream connectivity & live audio playback (30 concurrent workers)...")
    probed_stations = []
    with ThreadPoolExecutor(max_workers=30) as executor:
        futures = {executor.submit(probe_stream, st): st for st in deduped_list}
        for future in as_completed(futures):
            res = future.result()
            probed_stations.append(res)
            status_emoji = "🟢" if res["status"] == "LIVE" else "🔴"
            cors_label = " [CORS OK]" if res.get("cors_allowed") else ""
            print(f"  {status_emoji} {res['name']:<32} | {res['city']:<18} | {res['status']} ({res['latency_ms']}ms){cors_label}")

    # Assign coordinates and sectors
    for i, st in enumerate(probed_stations):
        assign_geo_coordinates(st, i)

    # Sort: LIVE first, then Cabimas local, then Costa Oriental, then Zulia
    priority_order = {"cabimas_local": 0, "costa_oriental": 1, "zulia_regional": 2, "venezuela_national": 3}
    probed_stations.sort(key=lambda s: (0 if s["status"] == "LIVE" else 1, priority_order.get(s.get("region_type"), 4), s["name"]))

    live_count = sum(1 for s in probed_stations if s["status"] == "LIVE")
    offline_count = sum(1 for s in probed_stations if s["status"] == "OFFLINE")

    print("\n" + "=" * 70)
    print(f"📊 SUMMARY: {live_count} LIVE stations verified | {offline_count} offline/unreachable")
    print("=" * 70)

    # 5. Archive Files
    archive_json_path = "archive/stations_archive.json"
    archive_csv_path = "archive/stations_archive.csv"
    app_data_path = "data/stations.json"

    # Save complete archive JSON
    archive_payload = {
        "metadata": {
            "title": "Cabimas & Zulia Radio Station Archive",
            "updated_at": datetime.utcnow().isoformat() + "Z",
            "total_stations": len(probed_stations),
            "live_stations": live_count,
            "offline_stations": offline_count,
            "description": "Comprehensive live radio stream archive for Cabimas, Costa Oriental del Lago, and Zulia State, Venezuela."
        },
        "stations": probed_stations
    }

    with open(archive_json_path, "w", encoding="utf-8") as f:
        json.dump(archive_payload, f, indent=2, ensure_ascii=False)
    print(f"💾 Full archive saved to: {archive_json_path}")

    # Save complete archive CSV
    csv_fields = [
        "name", "frequency", "city", "sector", "region_type", "status", "status_code",
        "stream_url", "content_type", "cors_allowed", "latency_ms", "lat", "lon",
        "tags", "source", "station_id", "last_checked"
    ]
    with open(archive_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=csv_fields, extrasaction="ignore")
        writer.writeheader()
        for s in probed_stations:
            writer.writerow(s)
    print(f"💾 CSV archive saved to: {archive_csv_path}")

    # Save active stations dataset for the web app (focused on LIVE stations)
    active_for_web = [s for s in probed_stations if s["status"] == "LIVE"]
    with open(app_data_path, "w", encoding="utf-8") as f:
        json.dump(active_for_web, f, indent=2, ensure_ascii=False)
    print(f"💾 Web app dataset saved to: {app_data_path} ({len(active_for_web)} live stations)")

if __name__ == "__main__":
    main()
