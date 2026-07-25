"""Supplement post-2023 MAU data via archived Steam API responses.

For CS2/React era (>= 2023-03), the HTML page doesn't contain MAU.
Instead, query CDX for archived API snapshots and extract MAU from JSON.

Important: the API was called from two different referrers over time:
  - https://blog.counter-strike.net   (older layout / WP blog era)
  - https://www.counter-strike.net    (post-2023 React SPA era)
The Wayback Machine keyed snapshots by the *full* original URL including
the `origin=` query parameter, so we must reconstruct the Wayback URL
from CDX's `original` field verbatim - a paramless URL only hits the one
snapshot cached in 2023-03 and would otherwise fill every month with
the same stale value.
"""

import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
HISTORY_FILE = DATA_DIR / "history.json"

API_PATH = "ICSGOServers_730/GetMonthlyPlayerCount/v1"
CDX_URL = "https://web.archive.org/cdx/search/cdx"
WA_API_TMPL = "https://web.archive.org/web/{ts}id_/{original}"

HEADERS = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}

# CS2 was released 2023-09-27. Records before this date are CSGO even if
# pulled from the post-2023 Steam API pipeline; records >= this date are CS2.
CS2_CUTOFF = datetime(2023, 9, 27, tzinfo=timezone.utc)


def _game_version(dt: datetime) -> str:
    return "cs2" if dt >= CS2_CUTOFF else "csgo"

# Months whose data comes from the old blog.counter-strike.net referrer or
# the www.counter-strike.net referrer. We don't hard-split here; CDX gives
# us the exact original URL per snapshot, which is what we use.


def get_api_snapshots() -> dict[str, dict]:
    """Query CDX for all API endpoint snapshots, group by month (latest per month).

    Returns: {month_key: {"timestamp": ts, "original": original_url}}
    """
    params = {
        "url": f"api.steampowered.com/{API_PATH}/*",
        "output": "json",
        "fl": "timestamp,original,statuscode,length",
        "limit": "50000",
        "from": "2023",
        "to": "202612",
    }
    rows = None
    for attempt in range(5):
        try:
            resp = requests.get(CDX_URL, params=params, timeout=120, headers=HEADERS)
            if resp.status_code in (429, 502, 503, 504):
                time.sleep(5 * (attempt + 1))
                continue
            resp.raise_for_status()
            rows = resp.json()
            break
        except (requests.RequestException, json.JSONDecodeError):
            time.sleep(5 * (attempt + 1))
    if rows is None or len(rows) < 2:
        raise RuntimeError("CDX query failed after retries")

    by_month: dict[str, dict] = {}
    for row in rows[1:]:
        ts, original, statuscode, length = row
        if statuscode != "200":
            continue
        try:
            if int(length) < 50:
                continue
        except ValueError:
            continue
        m = ts[:6]
        if m not in by_month or ts > by_month[m]["timestamp"]:
            by_month[m] = {"timestamp": ts, "original": original}

    return by_month


def fetch_api_mau(ts: str, original: str) -> tuple[int, str] | None:
    """Fetch one archived API response.

    Returns (players, result_time_iso) or None. The result_time is used
    to verify the snapshot actually corresponds to the target month
    (Wayback sometimes serves a stale cached payload for a different
    month, which would silently pollute history.json).
    """
    url = WA_API_TMPL.format(ts=ts, original=original)
    for attempt in range(4):
        try:
            r = requests.get(url, timeout=40, headers=HEADERS)
            if r.status_code == 200:
                data = r.json()
                return int(data["result"]["players"]), data["result"].get("time", "")
            if r.status_code in (429, 502, 503, 504):
                time.sleep(3 * (attempt + 1))
                continue
            time.sleep(1)
        except (requests.RequestException, json.JSONDecodeError, KeyError, ValueError):
            time.sleep(2 * (attempt + 1))
    return None


def load_history() -> list[dict]:
    if HISTORY_FILE.exists():
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_history(records: list[dict]) -> None:
    records.sort(key=lambda r: r["date"])
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)


def main() -> None:
    print("Querying CDX for Steam API snapshots...")
    by_month = get_api_snapshots()
    months = sorted(k for k in by_month if k >= "202303")
    if not months:
        print("No API snapshots found.")
        return
    print(f"Months with API snapshots: {len(months)} ({months[0]} - {months[-1]})")

    records = load_history()
    done = {r["date"][:7] for r in records}
    new_count = 0
    skipped = 0

    for i, m in enumerate(months):
        if m in done:
            continue

        snap = by_month[m]
        ts = snap["timestamp"]
        original = snap["original"]
        print(f"[{i+1}/{len(months)}] {m} ({ts}) ", end="", flush=True)

        result = fetch_api_mau(ts, original)
        if result is None:
            print("NO DATA")
            continue

        mau, result_time = result
        # Verify the payload's month matches the snapshot month; if Wayback
        # served a stale cached response from a different month, skip it
        # rather than silently filling history with wrong data.
        if result_time:
            try:
                payload_month = result_time[:7].replace("-", "")
            except Exception:
                payload_month = ""
            if payload_month and payload_month != m:
                print(f"SKIP (payload month {payload_month} != {m})")
                skipped += 1
                continue

        dt = datetime.strptime(m + "01000000", "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)
        record = {
            "date": dt.strftime("%Y-%m-%d"),
            "mau": mau,
            "game_version": _game_version(dt),
            "source": "web_archive_api",
            "wayback_timestamp": ts,
        }
        records.append(record)
        done.add(m)
        new_count += 1
        print(f"MAU={mau:,}  ({result_time})")
        time.sleep(1.5)

    save_history(records)
    print(f"\nNew: {new_count}, Skipped (stale): {skipped}, Total: {len(records)}")


if __name__ == "__main__":
    main()