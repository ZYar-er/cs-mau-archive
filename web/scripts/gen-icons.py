"""Generate the site's favicon set from the 16x16 vector design.

The favicon is the same mark as web/public/favicon.svg (blue ring + play
triangle, #66c0f4). This script renders it with 4x4 supersampling into PNG
files and a classic BMP-frame ICO committed to web/public/ — no runtime
dependency, so Cloudflare Pages never needs a Python image stack at build time.

Usage:  python3 web/scripts/gen-icons.py
Output: web/public/favicon.ico (16/32/48), favicon-32x32.png,
        favicon-192.png, favicon-512.png, apple-touch-icon.png (180)
"""

import struct
import zlib
from pathlib import Path

BLUE = (102, 192, 244)  # #66c0f4

OUT_DIR = Path(__file__).resolve().parent.parent / "public"


def in_ring(x: float, y: float) -> bool:
    """Circle stroke r=7, width=0.5 in the 16x16 viewBox -> ring 6.75..7.25."""
    d = ((x - 8) ** 2 + (y - 8) ** 2) ** 0.5
    return 6.75 <= d <= 7.25


def in_triangle(x: float, y: float) -> bool:
    """Triangle (6,5) (10.5,8) (6,11) — the play glyph."""
    def sign(px, py, ax, ay, bx, by):
        return (px - bx) * (ay - by) - (ax - bx) * (py - by)

    d1 = sign(x, y, 6, 5, 10.5, 8)
    d2 = sign(x, y, 10.5, 8, 6, 11)
    d3 = sign(x, y, 6, 11, 6, 5)
    has_neg = d1 < 0 or d2 < 0 or d3 < 0
    has_pos = d1 > 0 or d2 > 0 or d3 > 0
    return not (has_neg and has_pos)


def render(size: int) -> bytes:
    """Return raw RGBA pixels for `size` x `size`."""
    scale = size / 16.0
    rows = []
    for py in range(size):
        row = bytearray()
        for px in range(size):
            hits = 0
            for sy in range(4):
                for sx in range(4):
                    vx = (px + (sx + 0.5) / 4) / scale
                    vy = (py + (sy + 0.5) / 4) / scale
                    if in_ring(vx, vy) or in_triangle(vx, vy):
                        hits += 1
            alpha = round(hits / 16 * 255)
            row += bytes((*BLUE, alpha))
        rows.append(bytes(row))
    return b"".join(rows)


def write_png(path: Path, size: int) -> None:
    raw = render(size)
    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    scanlines = b"".join(b"\x00" + raw[y * size * 4 : (y + 1) * size * 4] for y in range(size))
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(scanlines, 9))
        + chunk(b"IEND", b"")
    )
    path.write_bytes(png)
    print(f"  {path.name}: {size}x{size} ({len(png)} bytes)")


def write_ico(path: Path, sizes: list[int]) -> None:
    """Build a maximally compatible ICO with uncompressed 32-bit BMP frames."""
    payloads: list[bytes] = []

    for size in sizes:
        source = render(size)
        pixels = bytearray()
        for row in range(size - 1, -1, -1):
            for column in range(size):
                red, green, blue, alpha = source[
                    (row * size + column) * 4 :
                    (row * size + column + 1) * 4
                ]
                pixels.extend((blue, green, red, alpha))

        # ICO BMP frames double the biHeight for XOR + AND masks. A 1-bit mask
        # is required even though 32-bit pixels already carry alpha; older
        # parsers expect it, while modern browsers prefer the alpha channel.
        mask_stride = (size + 31) // 32 * 4
        mask_row = b"\x00" * mask_stride
        pixels.extend(mask_row * size)
        header = struct.pack(
            "<IiiHHII",
            40,
            size,
            size * 2,
            1,
            32,
            0,
            len(pixels),
        )
        # biXPelsPerMeter through biClrImportant complete the 40-byte header.
        payloads.append(header + b"\x00" * 16 + bytes(pixels))

    header = struct.pack("<HHH", 0, 1, len(sizes))
    offset = 6 + 16 * len(sizes)
    entries = b""
    for size, bitmap in zip(sizes, payloads):
        entries += struct.pack(
            "<BBBBHHII",
            size if size < 256 else 0,
            size if size < 256 else 0,
            0,
            0,
            1,
            32,
            len(bitmap),
            offset,
        )
        offset += len(bitmap)
    path.write_bytes(header + entries + b"".join(payloads))
    print(f"  {path.name}: BMP ICO with {sizes}")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    write_png(OUT_DIR / "favicon-32x32.png", 32)
    write_png(OUT_DIR / "favicon-192.png", 192)
    write_png(OUT_DIR / "favicon-512.png", 512)
    write_png(OUT_DIR / "apple-touch-icon.png", 180)
    write_ico(OUT_DIR / "favicon.ico", [16, 32, 48])
    print("Done.")


if __name__ == "__main__":
    main()
