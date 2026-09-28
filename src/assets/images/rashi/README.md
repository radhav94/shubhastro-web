# Rashi report artwork

Only decorative furniture lives here. **Per-sign artwork is not bundled** — it comes
from the API, served from S3:

| Rendered as                  | API field (on `enriched`) |
|------------------------------|---------------------------|
| hero coin / moon-sign logo   | `signLogoUrl`             |
| landscape hero illustration  | `signIllustrationUrl`     |
| nakshatra deity portrait     | `godImageUrl`             |
| compatible-rashi logos       | `compatible_rashis[].signLogoUrl` |

The `signs/`, `coins/` and `nakshatras/` folders that used to sit here were removed.
They were ~1.7 MB shipped to every visitor as a fallback for URLs the API always
sends, and their sign-to-file mapping was inferred from the design export order
rather than confirmed. The API names its own artwork, so it is the authority.

If a hosted image fails to load, the hero coin degrades to the flat zodiac glyph the
horoscope screens already ship (so no extra download) and the other slots simply
render without an image.

## Folders

```
decor/tile-N.png              banner tiles, decorative, no sign mapping
decor/hero-flourish.png       line-art motif, hero card top-right
decor/hero-flourish-left.png  line-art motif, hero card bottom-left
decor/card-*.png              per-card swirl, bottom-left of each insight card
icons/chip-*.png              the four attribute chip icons
icons/sec-*.png               section heading icons
```

`src/utils/rashiImages.js` globs **`decor/tile-*` only**, so the one-off pieces above
can live in the same folder without being picked up as banner tiles. Everything
except the tiles is imported directly by `RashiReport.jsx`.

## Before adding files

`import.meta.glob` is eager: **every** file matching `decor/tile-*` ships in the
build whether the banner uses it or not. Resize and compress first — the design
originals are 1254x1254 at ~0.8 MB and render at 49px. Tiles went in at 96px (2x
the render size).
