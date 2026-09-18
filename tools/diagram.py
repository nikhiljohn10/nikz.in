"""Generates the crown-view facet diagram of a round brilliant cut (33 crown facets).

Run:  python3 _build/diagram.py  > prints the <svg> markup used in index.html
Geometry: table octagon, 8 stars, 8 bezels (kites), 16 upper girdle facets.
"""
from math import cos, sin, radians, atan2, degrees

R = 100.0          # girdle radius
T = 0.56 * R       # table vertex radius
S = 0.735 * R      # star tip radius


def pt(r, deg):
    a = radians(deg - 90)  # 0 deg = 12 o'clock
    return (round(r * cos(a), 2), round(r * sin(a), 2))


def poly(points, kind, extra=""):
    cx = sum(p[0] for p in points) / len(points)
    cy = sum(p[1] for p in points) / len(points)
    az = round(degrees(atan2(cy, cx)), 1)
    d = " ".join(f"{x},{y}" for x, y in points)
    return f'<polygon class="f f-{kind}" data-k="{kind}" data-az="{az}" points="{d}"{extra}/>'


out = []
table = [pt(T, 45 * k) for k in range(8)]
out.append(f'<polygon class="f f-table" data-k="table" data-az="0" points="{" ".join(f"{x},{y}" for x, y in table)}"/>')
for k in range(8):
    t0, t1 = pt(T, 45 * k), pt(T, 45 * (k + 1))
    s_prev, s = pt(S, 45 * k - 22.5), pt(S, 45 * k + 22.5)
    g0, g1 = pt(R, 45 * k), pt(R, 45 * (k + 1))
    m = pt(R, 45 * k + 22.5)
    out.append(poly([t0, s, t1], "star"))
    out.append(poly([t0, s_prev, g0, s], "bezel"))
    out.append(poly([s, g0, m], "girdle"))
    out.append(poly([s, m, g1], "girdle"))

svg = (
    '<svg class="stone" viewBox="-112 -112 224 224" role="img" '
    'aria-label="Facet diagram of a round brilliant cut diamond, seen from above">\n'
    '  <g class="stone-spin">\n    '
    + "\n    ".join(out)
    + f'\n    <circle class="stone-girdle" r="{R}"/>\n  </g>\n'
    '  <g class="stone-ticks">'
    + "".join(
        f'<line x1="{pt(104, a)[0]}" y1="{pt(104, a)[1]}" x2="{pt(108 if a % 45 else 111, a)[0]}" y2="{pt(108 if a % 45 else 111, a)[1]}"/>'
        for a in range(0, 360, 5)
    )
    + "</g>\n</svg>"
)
print(svg)
