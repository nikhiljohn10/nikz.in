# nikz.in

Personal site of Nikhil John. Plain HTML, CSS and JavaScript — no framework, no build step, no dependencies.
Served by GitHub Pages from the `master` branch; pushing to `master` publishes.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The whole page. All copy lives here. |
| `assets/style.css` | Styles. Colours and fonts are variables at the top. Dark is the design; visitors on a light system setting get the same palette lifted to charcoal. |
| `assets/main.js` | Optional extras: the facet light, scroll reveal, live GitHub star counts. The page works without it. |
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
- **Add or remove a repository:** copy one `<li>` in the Open source list; set `data-repo` to the repository name and the star count fills itself in.
- **Update the "Now" line:** section `04` in `index.html`.
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
