"""
Phase 2: Parse locally-downloaded Wayback Machine HTML files with BeautifulSoup.

Walks the archive/ directory, extracts MAU from each file, and builds history.json.
"""

import json
import re
from datetime import datetime, timezone
from pathlib import Path

from bs4 import BeautifulSoup

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ARCHIVE_DIR = PROJECT_ROOT / "archive"
DATA_DIR = PROJECT_ROOT / "data"
HISTORY_FILE = DATA_DIR / "history.json"

CS2_CUTOFF = datetime(2023, 9, 27, tzinfo=timezone.utc)


def _game_version(dt: datetime) -> str:
    return "cs2" if dt >= CS2_CUTOFF else "csgo"


def parse_one(html: str) -> int | None:
    """Extract MAU from old CS:GO site HTML using BeautifulSoup."""
    soup = BeautifulSoup(html, "html.parser")

    for div in soup.find_all("div", class_="monthly"):
        text = div.get_text(strip=True)
        if text:
            cleaned = text.replace(",", "")
            if cleaned.isdigit():
                return int(cleaned)

    for el in soup.find_all(class_="monthly"):
        if el.name != "div":
            continue
        text = el.get_text(strip=True)
        if text:
            cleaned = text.replace(",", "")
            if cleaned.isdigit():
                return int(cleaned)

    return None


def load_existing(path: Path) -> list[dict]:
    if path.exists():
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            pass
    return []


def main() -> None:
    if not ARCHIVE_DIR.exists():
        print(f"No archive directory at {ARCHIVE_DIR}. Run download_archives.py first.")
        return

    html_files = sorted(ARCHIVE_DIR.glob("*.html"))
    print(f"Found {len(html_files)} cached HTML files")

    existing = load_existing(HISTORY_FILE)
    seen_months = {r["date"][:7] for r in existing}
    records = list(existing)

    new_count = 0

    for fpath in html_files:
        filename = fpath.name
        ts_match = re.search(r"(\d{14})", filename)
        if not ts_match:
            continue
        ts = ts_match.group(1)
        month_key = ts[:6]

        if month_key in seen_months:
            continue

        size = fpath.stat().st_size
        if size < 5000:
            continue

        try:
            with open(fpath, "r", encoding="utf-8", errors="replace") as f:
                html = f.read()
        except OSError:
            continue

        mau = parse_one(html)
        if mau is None:
            continue

        dt = datetime.strptime(month_key + "01000000", "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)
        record_date = dt.strftime("%Y-%m-%d")

        record = {
            "date": record_date,
            "mau": mau,
            "game_version": _game_version(dt),
            "source": "web_archive_html",
            "wayback_timestamp": ts,
        }
        records.append(record)
        seen_months.add(month_key)
        new_count += 1
        print(f"  {month_key} ({ts[:8]}): MAU={mau:,}  [{size:,} bytes]")

    records.sort(key=lambda r: r["date"])
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print(f"\nNew: {new_count}, Total: {len(records)}")


if __name__ == "__main__":
    main()
