"""
Monthly MAU fetcher for Counter-Strike.

Calls the official Steam API endpoint that powers the counter-strike.net
homepage player-count display and records the result. The API publishes
monthly on the 1st at 07:00 UTC.

Endpoint:
  https://api.steampowered.com/ICSGOServers_730/GetMonthlyPlayerCount/v1
"""

import json
from datetime import datetime, timezone
from pathlib import Path

import requests

API_URL = "https://api.steampowered.com/ICSGOServers_730/GetMonthlyPlayerCount/v1"
CS2_CUTOFF = datetime(2023, 9, 27, tzinfo=timezone.utc)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
DAILY_FILE = DATA_DIR / "daily.json"
CURRENT_FILE = DATA_DIR / "current.json"

HEADERS = {
    "User-Agent": "cs-mau-archive/1.0 (+https://github.com/anomalyco/cs-mau-archive)",
    "Accept": "application/json",
}


def _game_version(dt: datetime) -> str:
    return "cs2"


def fetch_mau() -> dict | None:
    """Hit the Steam API and return the raw response JSON as a dict."""
    try:
        resp = requests.get(
            f"{API_URL}?format=json",
            timeout=30,
            headers=HEADERS,
        )
        resp.raise_for_status()
        return resp.json()
    except (requests.RequestException, json.JSONDecodeError) as e:
        print(f"API request failed: {e}")
        return None


def load_json(path: Path) -> list | dict | None:
    if not path.exists():
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return None


def save_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main() -> None:
    result = fetch_mau()
    if result is None:
        print("Failed to fetch MAU. Exiting.")
        return

    players = result.get("result", {}).get("players")
    api_time = result.get("result", {}).get("time")

    if players is None or api_time is None:
        print("MAU or time not found in API response.")
        return

    mau = int(players)
    # API time is ISO-8601 UTC, e.g. "2026-07-01T07:00:00Z"
    api_dt = datetime.fromisoformat(api_time.replace("Z", "+00:00"))
    month_first = api_dt.strftime("%Y-%m-01")
    version = _game_version(api_dt)

    print(f"[API time {api_time}] MAU={mau:,}  month={month_first}  game={version}")

    record = {
        "date": month_first,
        "mau": mau,
        "game_version": version,
        "source": "steam_api",
        "api_timestamp": api_time,
    }

    # Load daily.json and dedup by month (YYYY-MM)
    daily = load_json(DAILY_FILE)
    if daily is None:
        daily = []
    if not isinstance(daily, list):
        daily = [daily]

    month_key = month_first[:7]  # YYYY-MM
    updated = False
    for i, entry in enumerate(daily):
        if isinstance(entry, dict) and entry.get("date", "")[:7] == month_key:
            daily[i] = record
            updated = True
            break
    if not updated:
        daily.append(record)

    # Keep ascending by date
    daily.sort(key=lambda r: r.get("date", ""))
    save_json(DAILY_FILE, daily)

    # Overwrite current.json
    save_json(CURRENT_FILE, record)

    print(f"Saved. daily.json has {len(daily)} entries (updated={updated}).")


if __name__ == "__main__":
    main()
