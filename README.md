# nikz.in

Personal site of Nikhil John. Plain HTML, CSS and JavaScript — no framework, no build step, no dependencies.
Served by GitHub Pages from the `master` branch; pushing to `master` publishes.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The whole page. All copy lives here. |
| `assets/style.css` | Styles. Colours and fonts are variables at the top. Dark is the design; visitors on a light system setting get the same palette lifted to charcoal. |
| `assets/main.js` | Three parts, all optional. `scene()` draws the sky in raw WebGL with no library: the round brilliant as a constellation. A little way down the page its stars let go — they wind about the stone's own axis (culet to table) and fling outward into open sky, inner stars turning most, as a galaxy rotates — and near the bottom of the page they spiral back in. Scrolling only pulls the trigger; the effect then plays on its own clock, the same at any scrolling speed. `stage()` runs the scroll choreography for the page itself: hero and banner parallax, sections swinging in. `svgStone()` lights the flat facet diagram when WebGL is missing. No network calls. Visitors who ask their system for reduced motion get a still page. |
| `assets/fonts/` | Self-hosted fonts (Jost, Hanken Grotesk, IBM Plex Mono — all SIL Open Font License). |
| `assets/me.jpg` | Portrait, 1000 × 1000. |
| `assets/banner.jpg`, `assets/banner-1100.jpg` | Optional banner under the hero. Delete the `<figure class="banner">` block in `index.html` to remove it. |
| `assets/favicon.svg` | Icon. |
| `tools/diagram.py` | Regenerates the brilliant-cut SVG in the hero if you ever want different proportions. |
| `llms.txt` | Plain-text summary for language models and AI assistants, served at `/llms.txt`. Keep it in step with the page when facts change. |
| `404.html`, `robots.txt`, `sitemap.xml`, `CNAME`, `.nojekyll` | Housekeeping. |

## Common edits

- **Change any text:** edit `index.html`. Each section is marked with a comment banner.
- **Add photographs:** put images in `assets/frames/`, then uncomment the `FRAMES` block in the Practice section.
- **Add or remove a repository:** copy one `<li>` in the Open source list and set the link, name, description and language. There are no star counts and no API calls, so nothing in this section can fail to load or go stale.
- **Update the "Upcoming" line:** section `04` in `index.html`.
- **Rename a menu item:** change the link text, the section `id` it points to, and that section's `<h2>` together — the menu word and the heading it lands on should always be the same word.
- **Tune the 3D scene:** in `scene()` in `assets/main.js` — `PLAY` is how many seconds the dispersal takes; `START` and `RETURN` are the trigger lines in pixels from the top (disperse beyond `START`, re-form only above `RETURN`; keep them apart so the effect cannot flicker); `TURNS_INNER` and `TURNS_OUTER` are how many turns the stars make about the stone's axis on the way out (equal for a plain pinwheel, further apart for longer spiral arms); `density` and `starCount` set how many stars; `uDim` and `uGain` set brightness. Colours are read from `--ink` and `--accent` in the stylesheet, so a palette change needs no edit there.
- **Change the accent colour:** `--accent` (claret, used for anything readable) and `--accent-deep` (wine, solid fills only) at the top of `assets/style.css`. Keep `--accent` above about 4.5:1 contrast against `--paper`.
- **Anything factual:** change it in both `index.html` and `llms.txt`.

## Licence

Two sets of terms, see `LICENSE`. The code is MIT. The written content and the
images — including the portrait — are all rights reserved, because an MIT
licence over the whole repository would let anyone republish or sell your
likeness. The fonts in `assets/fonts/` carry the SIL Open Font License.

## Preview locally

```
python -m http.server 8000
```

then open http://localhost:8000.
