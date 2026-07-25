"""
Phase 1: Query CDX for available snapshots, then download to local files.

Usage:
  python scripts/download_archives.py              # All available snapshots
  python scripts/download_archives.py 202001 202312  # Specific month range
"""

import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ARCHIVE_DIR = PROJECT_ROOT / "archive"
DATA_DIR = PROJECT_ROOT / "data"
INDEX_FILE = ARCHIVE_DIR / "cdx_index.json"
HISTORY_FILE = DATA_DIR / "history.json"

CDX_URL = "https://web.archive.org/cdx/search/cdx"
WA_URL = "https://web.archive.org/web/{timestamp}id_/{url}"

HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "text/html,*/*",
}

MIN_SIZE = 5000
IA_MARKER = "Internet Archive"


def query_cdx(from_date: str, to_date: str) -> list[dict]:
    """Query CDX for all counter-strike.net homepage snapshots."""
    params = {
        "url": "counter-strike.net",
        "output": "json",
        "fl": "timestamp,original,statuscode,length",
        "from": from_date,
        "to": to_date,
        "limit": "100000",
    }

    print(f"Querying CDX: {from_date} - {to_date} ...")
    resp = requests.get(CDX_URL, params=params, timeout=120, headers=HEADERS)
    resp.raise_for_status()

    rows = resp.json()
    if len(rows) < 2:
        return []

    header = rows[0]
    snaps = [dict(zip(header, row)) for row in rows[1:]]

    # Filter: only homepage URLs
    homepage = []
    for s in snaps:
        orig = s.get("original", "")
        if re.match(r"^https?://(www\.)?counter-strike\.net(:80)?/?$", orig):
            homepage.append(s)

    print(f"  CDX returned {len(snaps)} total, {len(homepage)} homepage snapshots")
    return homepage


def load_index() -> dict:
    """Load cached CDX index from disk."""
    if INDEX_FILE.exists():
        try:
            with open(INDEX_FILE, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            pass
    return {}


def save_index(index: dict) -> None:
    ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
    with open(INDEX_FILE, "w") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)


def fetch_one(ts: str) -> tuple[str, int] | None:
    """Download one snapshot, return (filepath, size_bytes) or None."""
    out_path = ARCHIVE_DIR / f"{ts}.html"

    # Skip existing valid files
    if out_path.exists() and out_path.stat().st_size > MIN_SIZE:
        with open(out_path, "r", encoding="utf-8", errors="replace") as f:
            head = f.read(2000)
        if IA_MARKER not in head:
            return str(out_path), out_path.stat().st_size
        out_path.unlink()  # Delete IA campaign page, retry

    url = WA_URL.format(timestamp=ts, url="https://www.counter-strike.net/")

    for attempt in range(3):
        try:
            resp = requests.get(url, timeout=45, headers=HEADERS)
            if resp.status_code == 200 and len(resp.text) > MIN_SIZE:
                if IA_MARKER in resp.text[:2000]:
                    time.sleep(2 * (attempt + 1))
                    continue
                with open(out_path, "w", encoding="utf-8", errors="replace") as f:
                    f.write(resp.text)
                return str(out_path), len(resp.text)
            if resp.status_code in (429, 502, 503, 504):
                time.sleep(5 * (attempt + 1))
                continue
            time.sleep(2)
        except requests.RequestException:
            time.sleep(5 * (attempt + 1))

    return None


def main() -> None:
    from_date = sys.argv[1] if len(sys.argv) > 1 else "201308"
    to_date = sys.argv[2] if len(sys.argv) > 2 else datetime.now(timezone.utc).strftime("%Y%m")

    snaps = query_cdx(from_date, to_date)
    if not snaps:
        print("No snapshots found.")
        return

    # Build index: deduplicate by month, pick the LATEST timestamp per month
    # (Valve updates ~monthly, so later in month is more likely to have current data)
    by_month: dict[str, dict] = {}
    for s in snaps:
        key = s["timestamp"][:6]
        if key not in by_month or s["timestamp"] > by_month[key]["timestamp"]:
            by_month[key] = s

    months = sorted(by_month)
    print(f"Months to download: {len(months)} ({months[0]} - {months[-1]})")

    # Load cached index to skip months already downloaded
    index = load_index()
    
    # Filter out months already cached with valid files
    todo = []
    for m in months:
        ts = by_month[m]["timestamp"]
        if ts in index:
            continue  # Already marked as done
        # Check if file exists and is valid
        fpath = ARCHIVE_DIR / f"{ts}.html"
        if fpath.exists() and fpath.stat().st_size > MIN_SIZE:
            try:
                with open(fpath, "r", encoding="utf-8", errors="replace") as f:
                    if IA_MARKER not in f.read(2000):
                        index[ts] = m
                        continue
            except OSError:
                pass
        todo.append((m, ts))

    print(f"Already cached: {len(index)}")
    print(f"To download: {len(todo)}\n")

    if not todo:
        print("Nothing to do.")
        save_index(index)
        return

    success = 0
    for i, (month, ts) in enumerate(todo):
        print(f"[{i+1}/{len(todo)}] {month} ({ts}) ", end="", flush=True)
        result = fetch_one(ts)
        if result:
            fpath, size = result
            index[ts] = month
            print(f"OK ({size:,} bytes)")
            success += 1
        else:
            print("FAIL")

        # Save index periodically
        if i > 0 and i % 10 == 0:
            save_index(index)

        time.sleep(2.0)

    save_index(index)
    print(f"\nDownloaded: {success}/{len(todo)}")
    print(f"Total cached: {len(index)} months")

    # Also print date list for verification
    print("\nCached months:")
    cached_months = sorted(set(index.values()))
    for m in cached_months:
        cdx_info = next((s for s in snaps if s["timestamp"][:6] == m), None)
        ts = max((t for t, mm in index.items() if mm == m), default="?")
        size = cdx_info.get("length", "?") if cdx_info else "?"
        print(f"  {m}  ts={ts}  cdx_size={size}")


if __name__ == "__main__":
    main()
