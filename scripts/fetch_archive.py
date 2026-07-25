"""
Fetch historical CS MAU data from Wayback Machine.

Two-phase approach:
  Phase 1 (download_archives.py): Download snapshots locally to archive/
  Phase 2 (parse_archives.py):   Parse local files with BeautifulSoup → history.json

Usage:
  python scripts/download_archives.py              # Download all available snapshots
  python scripts/download_archives.py 202001 202312  # Download specific range
  python scripts/parse_archives.py                 # Parse local files → data/history.json

Both scripts support incremental operation - re-run to fill gaps.
"""

import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def main() -> None:
    args = sys.argv[1:] if len(sys.argv) > 1 else []

    print("=== Phase 1: Download archives from Wayback Machine ===")
    result = subprocess.run(
        [sys.executable, str(PROJECT_ROOT / "scripts" / "download_archives.py")] + args,
        cwd=str(PROJECT_ROOT),
    )
    if result.returncode != 0:
        print("Download phase failed or was interrupted.")

    print("\n=== Phase 2: Parse local archives → history.json ===")
    subprocess.run(
        [sys.executable, str(PROJECT_ROOT / "scripts" / "parse_archives.py")],
        cwd=str(PROJECT_ROOT),
    )


if __name__ == "__main__":
    main()
