#!/usr/bin/env python3
"""
Builds the Backyard Spades icon set from Mikayla's source icon
(~/workspace/user/media_library/image/plain2-1024.png — 1024x1024, navy
pixel spade with a white outline on a red-and-white picnic check).

Usage:  python3 scripts/build_app_icon.py   (needs Pillow)

The source is already the finished icon, so the main icon is a straight copy.
The spade mark is isolated from the check background for the Android adaptive
foreground / splash / monochrome variants by masking the mark's own colours:
navy (29,42,68), the dark-red drop shadow (120,40,28), and the white outline
(255,250,240) where it touches the navy (white check cells are NOT part of
the mark — they are only kept when they lie within a few pixels of navy).

Writes (all referenced from app.json):
  assets/icon.png                       1024^2 opaque — iOS + default icon
  assets/images/android-icon-foreground.png  1024^2 transparent, mark in the
      adaptive-icon safe zone (~58% of the canvas)
  assets/images/android-icon-background.png  1024^2 check, tiled from a
      spade-free corner of the source so it matches exactly
  assets/images/android-icon-monochrome.png  1024^2 single-colour navy
      silhouette (Android 13+ themed icons)
  assets/images/splash-icon.png         1024^2 transparent mark (~78%)
  assets/images/favicon.png             64^2 for the web tab

NOTE (binary): these PNGs are binary and cannot be pushed through the GitHub
connector — they live in the local tree only. The in-app wordmark/logo uses
the base64 data URI in src/assets/images.ts instead (see scripts note there).
The source PNG is also kept at assets/images/icon-source.png for reference.
"""
import sys
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = Path.home() / 'workspace' / 'user' / 'media_library' / 'image' / 'plain2-1024.png'
IMAGES = ROOT / 'assets' / 'images'
S = 1024

NAVY = (29, 42, 68)
SHADOW = (120, 40, 28)
OUTLINE = (255, 250, 240)


def is_navy(px):
    return px == NAVY


def is_shadow(px):
    return px == SHADOW


def mark_mask(src: Image.Image) -> Image.Image:
    """L-mode mask of the spade mark (navy + shadow + outline touching navy)."""
    w, h = src.size
    px = src.load()
    mask = Image.new('L', (w, h), 0)
    mp = mask.load()
    for y in range(h):
        for x in range(w):
            if is_navy(px[x, y]) or is_shadow(px[x, y]):
                mp[x, y] = 255
    # White outline: white pixels near navy. Dilate the navy mask and keep
    # the white pixels inside it.
    navy_only = Image.new('L', (w, h), 0)
    np = navy_only.load()
    for y in range(h):
        for x in range(w):
            if is_navy(px[x, y]):
                np[x, y] = 255
    dilated = navy_only.filter(ImageFilter.MaxFilter(25))
    dp = dilated.load()
    for y in range(h):
        for x in range(w):
            if dp[x, y] and px[x, y] == OUTLINE:
                mp[x, y] = 255
    return mask


def mark_rgba(src: Image.Image) -> Image.Image:
    mask = mark_mask(src)
    out = Image.new('RGBA', src.size, (0, 0, 0, 0))
    out.paste(src.convert('RGBA'), (0, 0), mask)
    return out


def fit_centred(im: Image.Image, box: float, size: int = S) -> Image.Image:
    """Scale so the mark's larger side is `box` px, centred on a transparent canvas."""
    bbox = im.getbbox()
    assert bbox is not None
    cropped = im.crop(bbox)
    k = box / max(cropped.width, cropped.height)
    scaled = cropped.resize(
        (round(cropped.width * k), round(cropped.height * k)), Image.NEAREST
    )
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(scaled, ((size - scaled.width) // 2, (size - scaled.height) // 2), scaled)
    return out


def check_background(src: Image.Image) -> Image.Image:
    """Tile a spade-free corner of the source check into a full 1024 background."""
    tile = src.crop((0, 0, 128, 128)).convert('RGB')
    bg = Image.new('RGB', (S, S))
    for y in range(0, S, 128):
        for x in range(0, S, 128):
            bg.paste(tile, (x, y))
    return bg


def main() -> None:
    if not SRC.exists():
        print(f'source icon missing: {SRC}', file=sys.stderr)
        sys.exit(1)
    src = Image.open(SRC).convert('RGB')
    assert src.size == (1024, 1024), f'unexpected source size {src.size}'

    (ROOT / 'assets').mkdir(parents=True, exist_ok=True)
    IMAGES.mkdir(parents=True, exist_ok=True)

    # The finished icon, straight copy (opaque — iOS rejects transparent icons).
    src.save(ROOT / 'assets' / 'icon.png', optimize=True)
    src.save(IMAGES / 'icon-source.png', optimize=True)

    mark = mark_rgba(src)

    # Android adaptive icon: mark inside the ~66dp safe circle -> ~58% of canvas.
    fit_centred(mark, S * 0.58).save(IMAGES / 'android-icon-foreground.png', optimize=True)
    check_background(src).save(IMAGES / 'android-icon-background.png', optimize=True)

    # Themed-icon monochrome: navy silhouette only, single colour.
    mask = mark_mask(src)
    mono = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    navy_layer = Image.new('RGBA', (S, S), NAVY + (255,))
    mono.paste(navy_layer, (0, 0), mask)
    fit_centred(mono, S * 0.58).save(IMAGES / 'android-icon-monochrome.png', optimize=True)

    # Splash: transparent mark, ~78% of the canvas.
    fit_centred(mark, S * 0.78).save(IMAGES / 'splash-icon.png', optimize=True)

    # Favicon: 64px, nearest-neighbour to keep the pixel look.
    src.resize((64, 64), Image.NEAREST).save(IMAGES / 'favicon.png', optimize=True)

    for p in [
        ROOT / 'assets' / 'icon.png',
        IMAGES / 'android-icon-foreground.png',
        IMAGES / 'android-icon-background.png',
        IMAGES / 'android-icon-monochrome.png',
        IMAGES / 'splash-icon.png',
        IMAGES / 'favicon.png',
    ]:
        im = Image.open(p)
        print(f'wrote {p.relative_to(ROOT)} {im.size} {im.mode} {p.stat().st_size} bytes')


if __name__ == '__main__':
    main()
