"""Extract the real Van Gogh drawing's ink; never render an opaque paper layer."""
from pathlib import Path
import argparse
import hashlib

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'model/art/starry-night-drawing.jpg'
SOURCE_SHA256 = 'b986e87daacaf7b28574ed194484a8606de6683b80eeb21d56b9e0ebecc3afaf'
OUTPUT = ROOT / 'public/textures'
SIZES = [('starry-night-ink-v1.webp', 1600), ('starry-night-ink-mobile-v1.webp', 960)]


def ink_layer(width):
    with Image.open(SOURCE) as source:
        height = round(source.height * width / source.width)
        gray = source.convert('L').resize((width, height), Image.Resampling.LANCZOS)
    # Discard light paper and scan texture, retaining the artist's actual pen marks.
    # Quantized, partial alpha keeps the existing WebGL visible even through dark ink.
    lut = [round((max(0, min(1, (174 - value) / 122)) ** 1.15) * 14) * 12 for value in range(256)]
    alpha = gray.point(lut)
    image = Image.new('RGBA', gray.size, (218, 218, 218, 0))
    image.putalpha(alpha)
    return image


def check():
    # The source scan is not stored in the repository; verify it only when present.
    if SOURCE.exists():
        assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == SOURCE_SHA256, 'Original drawing source changed'
    for filename, width in SIZES:
        with Image.open(OUTPUT / filename) as image:
            image = image.convert('RGBA')
            assert image.size == (width, round(2892 * width / 3852))
            alpha = image.getchannel('A')
            # Fully transparent RGB is immaterial and may be optimized by WebP.
            for r, g, b, a in image.getdata():
                if a:
                    assert r == g == b == 218, 'Artwork must contain neutral ink only'
            assert alpha.getextrema() == (0, 168), 'No opaque paper or solid background'
            histogram = alpha.histogram()
            assert histogram[0] / (image.width * image.height) > .45
            assert (OUTPUT / filename).stat().st_size < 600_000
            print(f'OK {filename}: monochrome, transparent, correct source aspect ratio')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if args.check:
        check()
    else:
        OUTPUT.mkdir(parents=True, exist_ok=True)
        for filename, width in SIZES:
            image = ink_layer(width)
            image.save(OUTPUT / filename, format='WEBP', lossless=True, method=6, exact=True)
            print(f'{filename}: {image.width} × {image.height}, {(OUTPUT / filename).stat().st_size} bytes')
        print('Source SHA-256:', hashlib.sha256(SOURCE.read_bytes()).hexdigest())
        check()
