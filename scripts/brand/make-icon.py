"""Draws the Shiftseal mark and every icon variant as SVG.

The mark is a landscape time card with a red stamp pressed on its corner: the record, and
the seal that makes it final. Flat shapes only, so it stays sharp from a 16 px
favicon to the 512 px store icon.

    python3 scripts/brand/make-icon.py                 # classic colours
    python3 scripts/brand/make-icon.py --season xmas   # or any name in PALETTES
    node scripts/brand/render-icons.mjs                # renders the PNGs (needs Playwright)

The chosen season becomes the app's icon everywhere (web, Android, store icon).
Every season's store icon is also written to public/brand/seasons/ for previews.
"""

import argparse
import math
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "brand"

# Colour styles. bg: tile; card and ink: the time card; seal: the stamp;
# mark: the check and the stamp's inner ring.
PALETTES = {
    "classic": dict(bg="#13213f", card="#f4efe3", ink="#13213f", seal="#f2441d", mark="#ffffff"),
    "halloween": dict(bg="#1c1326", card="#efe2c8", ink="#1c1326", seal="#ff7a1a", mark="#1c1326"),
    "xmas": dict(bg="#0f3b2c", card="#fbf6ec", ink="#0f3b2c", seal="#c8102e", mark="#f6d27a"),
    "lunar": dict(bg="#b3121b", card="#fff4dc", ink="#7a0b10", seal="#e8b647", mark="#7a0b10"),
    "spring": dict(bg="#f2bfce", card="#ffffff", ink="#3d6b55", seal="#e0527a", mark="#ffffff"),
}

# The mark is drawn on a 512 grid: a landscape time card, tilted, with the stamp on its corner.
CARD_RECT = 'x="96" y="120" width="290" height="250" rx="22"'
CARD_TILT = 'rotate(-6 236 236)'
LINES = [(178, 190, 0.85), (226, 150, 0.25), (274, 190, 0.25), (322, 150, 0.25)]  # y, width, opacity
STAMP = (340, 334, 88)  # cx, cy, r


def check(cx: float, cy: float) -> str:
    """Two clock hands at five past ten, which together make a check mark."""
    vx, vy = cx - 6, cy + 22
    hx, hy = vx + 32 * math.sin(math.radians(300)), vy - 32 * math.cos(math.radians(300))
    mx, my = vx + 66 * math.sin(math.radians(32)), vy - 66 * math.cos(math.radians(32))
    return f"{hx:.1f},{hy:.1f} {vx:.1f},{vy:.1f} {mx:.1f},{my:.1f}"


def card_lines(ink: str) -> str:
    return "".join(
        f'<rect x="128" y="{y}" width="{w}" height="14" rx="7" fill="{ink}" fill-opacity="{o}"/>'
        for y, w, o in LINES
    )


def mark(p: dict) -> str:
    cx, cy, r = STAMP
    return f'''<g transform="{CARD_TILT}"><rect {CARD_RECT} fill="{p["card"]}"/>{card_lines(p["ink"])}</g>
  <circle cx="{cx}" cy="{cy}" r="{r}" fill="{p["seal"]}"/>
  <circle cx="{cx}" cy="{cy}" r="70" fill="none" stroke="{p["mark"]}" stroke-opacity=".45" stroke-width="4"/>
  <polyline points="{check(cx, cy)}" fill="none" stroke="{p["mark"]}" stroke-width="20"
    stroke-linecap="round" stroke-linejoin="round"/>'''


# ---- Occasion details: small flat motifs in the tile's empty corners ----------

def _bat(x: float, y: float, w: float, fill: str) -> str:
    k = w / 100
    return (f'<path transform="translate({x - 50 * k:.1f} {y - 24 * k:.1f}) scale({k:.3f})" fill="{fill}" '
            'd="M50 16 L46 6 L44 15 C38 9 30 6 22 8 C14 9 6 14 0 22 C9 20 15 24 16 32 '
            'C22 26 30 27 33 35 C38 30 45 32 50 42 C55 32 62 30 67 35 C70 27 78 26 84 32 '
            'C85 24 91 20 100 22 C94 14 86 9 78 8 C70 6 62 9 56 15 L54 6 Z"/>')


def _moon(x: float, y: float, r: float, fill: str) -> str:
    return (f'<path fill="{fill}" d="M{x:.1f},{y - r:.1f} A{r},{r} 0 1 0 {x:.1f},{y + r:.1f} '
            f'A{r * 0.72:.1f},{r} 0 1 1 {x:.1f},{y - r:.1f} Z"/>')


def _leaf(x: float, y: float, angle: float, fill: str) -> str:
    return (f'<path transform="translate({x} {y}) rotate({angle})" fill="{fill}" '
            'd="M0 0 L8 -8 L14 -4 L20 -12 L27 -6 L34 -11 L40 0 L34 11 L27 6 L20 12 L14 4 L8 8 Z"/>')


def _snowflake(x: float, y: float, r: float, stroke: str) -> str:
    out = ""
    for a in range(0, 180, 60):
        t = math.radians(a)
        dx, dy = r * math.cos(t), r * math.sin(t)
        out += f'<line x1="{x - dx:.1f}" y1="{y - dy:.1f}" x2="{x + dx:.1f}" y2="{y + dy:.1f}"/>'
    for a in range(0, 360, 60):
        t = math.radians(a)
        bx, by = x + 0.6 * r * math.cos(t), y + 0.6 * r * math.sin(t)
        for side in (-1, 1):
            u = t + side * math.radians(40)
            out += f'<line x1="{bx:.1f}" y1="{by:.1f}" x2="{bx + 0.3 * r * math.cos(u):.1f}" y2="{by + 0.3 * r * math.sin(u):.1f}"/>'
    return f'<g stroke="{stroke}" stroke-width="5" stroke-linecap="round">{out}</g>'


def _lantern(x: float, y: float, body: str, rib: str) -> str:
    return f'''<g>
    <line x1="{x}" y1="{y - 78}" x2="{x}" y2="{y - 36}" stroke="{body}" stroke-width="4"/>
    <rect x="{x - 14}" y="{y - 40}" width="28" height="9" rx="3" fill="{body}"/>
    <ellipse cx="{x}" cy="{y}" rx="30" ry="33" fill="{body}"/>
    <path d="M{x - 12} {y - 31} Q{x - 22} {y} {x - 12} {y + 31} M{x + 12} {y - 31} Q{x + 22} {y} {x + 12} {y + 31} M{x} {y - 33} V{y + 33}"
      fill="none" stroke="{rib}" stroke-width="3.5" stroke-opacity=".7"/>
    <rect x="{x - 14}" y="{y + 31}" width="28" height="9" rx="3" fill="{body}"/>
    <path d="M{x - 6} {y + 42} V{y + 64} M{x} {y + 42} V{y + 68} M{x + 6} {y + 42} V{y + 64}"
      stroke="{body}" stroke-width="3" stroke-linecap="round"/>
  </g>'''


def _sparkle(x: float, y: float, r: float, fill: str) -> str:
    q = r * 0.28
    return (f'<path fill="{fill}" d="M{x} {y - r} Q{x + q} {y - q} {x + r} {y} Q{x + q} {y + q} {x} {y + r} '
            f'Q{x - q} {y + q} {x - r} {y} Q{x - q} {y - q} {x} {y - r} Z"/>')


def _blossom(x: float, y: float, r: float, petal: str, centre: str) -> str:
    petals = "".join(
        f'<ellipse cx="{x}" cy="{y - r * 0.55:.1f}" rx="{r * 0.42:.1f}" ry="{r * 0.55:.1f}" '
        f'transform="rotate({a} {x} {y})" fill="{petal}"/>'
        for a in range(0, 360, 72)
    )
    return f'{petals}<circle cx="{x}" cy="{y}" r="{r * 0.22:.1f}" fill="{centre}"/>'


def _pumpkin(x: float, y: float, r: float, fill: str, line: str, stem: str) -> str:
    return f'''<g>
    <rect x="{x - r * 0.12:.1f}" y="{y - r * 1.25:.1f}" width="{r * 0.24:.1f}" height="{r * 0.5:.1f}" rx="{r * 0.08:.1f}" fill="{stem}"/>
    <ellipse cx="{x - r * 0.42:.1f}" cy="{y}" rx="{r * 0.62:.1f}" ry="{r * 0.88:.1f}" fill="{fill}" stroke="{line}" stroke-width="3"/>
    <ellipse cx="{x + r * 0.42:.1f}" cy="{y}" rx="{r * 0.62:.1f}" ry="{r * 0.88:.1f}" fill="{fill}" stroke="{line}" stroke-width="3"/>
    <ellipse cx="{x}" cy="{y}" rx="{r * 0.58:.1f}" ry="{r * 0.94:.1f}" fill="{fill}" stroke="{line}" stroke-width="3"/>
    {_carved_face(x, y, r)}
  </g>'''


def _carved_face(x: float, y: float, r: float, glow: str = "#ffd34d") -> str:
    """A jack-o'-lantern's face, lit from inside."""
    def tri(cx, cy, w, h, up=True):
        tip = cy - h / 2 if up else cy + h / 2
        base = cy + h / 2 if up else cy - h / 2
        return f"M{cx:.1f},{tip:.1f} L{cx + w / 2:.1f},{base:.1f} L{cx - w / 2:.1f},{base:.1f} Z"
    eyes = tri(x - r * 0.42, y - r * 0.22, r * 0.42, r * 0.34) + tri(x + r * 0.42, y - r * 0.22, r * 0.42, r * 0.34)
    nose = tri(x, y + r * 0.06, r * 0.2, r * 0.18)
    m = [(-0.7, 0.26), (-0.48, 0.4), (-0.34, 0.3), (-0.17, 0.44), (0, 0.32), (0.17, 0.44), (0.34, 0.3),
         (0.48, 0.4), (0.7, 0.26), (0.5, 0.66), (0.2, 0.58), (0, 0.7), (-0.2, 0.58), (-0.5, 0.66)]
    mouth = "M" + " L".join(f"{x + dx * r:.1f},{y + dy * r:.1f}" for dx, dy in m) + " Z"
    return f'<path d="{eyes} {nose} {mouth}" fill="{glow}"/>'


def _holly(x: float, y: float, k: float) -> str:
    leaves = _leaf(0, 0, -150, "#3f9a63") + _leaf(0, 0, -60, "#2f7d4f")
    berries = "".join(
        f'<circle cx="{cx}" cy="{cy}" r="9" fill="#d61f3a" stroke="#8f0f22" stroke-width="2"/>'
        for cx, cy in ((-2, 6), (12, 0), (6, 16))
    )
    return f'<g transform="translate({x} {y}) scale({k})">{leaves}{berries}</g>'


def details(season: str) -> str:
    if season == "halloween":
        return (_bat(420, 120, 132, "#efe2c8")
                + _pumpkin(100, 440, 44, "#ff7a1a", "#c4560c", "#5b8a3c"))
    if season == "xmas":
        return (_holly(104, 128, 1.5)
                + _snowflake(438, 132, 40, "#fbf6ec")
                + _sparkle(96, 446, 26, "#f6d27a"))
    if season == "lunar":
        return (f'<g transform="translate(440 160) scale(1.3) translate(-440 -160)">'
                f'{_lantern(440, 160, "#e8b647", "#7a0b10")}</g>'
                + _sparkle(92, 440, 28, "#e8b647") + _sparkle(140, 474, 14, "#fff4dc")
                + _sparkle(470, 300, 13, "#fff4dc"))
    if season == "spring":
        return (_blossom(384, 108, 48, "#f7a8bf", "#e0527a")
                + _blossom(96, 440, 36, "#ffffff", "#e0527a")
                + '<ellipse cx="456" cy="236" rx="12" ry="18" transform="rotate(35 456 236)" fill="#ffffff"/>'
                + '<ellipse cx="156" cy="474" rx="9" ry="14" transform="rotate(-25 156 474)" fill="#f7a8bf"/>')
    return ""


def scaled(body: str, k: float) -> str:
    return f'<g transform="translate(256 256) scale({k}) translate(-256 -256)">{body}</g>'


def svg(body: str, bg: str | None = None, radius: int = 0) -> str:
    back = f'<rect width="512" height="512" rx="{radius}" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">{back}{body}</svg>\n'


def mono() -> str:
    """Android 13 themed icon: one colour; the stamp is set apart from the card by a thin gap."""
    cx, cy, r = STAMP
    body = f'''<defs><mask id="m">
    <rect width="512" height="512" fill="#000"/>
    <g transform="{CARD_TILT}"><rect {CARD_RECT} fill="#fff"/>{card_lines("#000")}</g>
    <circle cx="{cx}" cy="{cy}" r="{r + 12}" fill="#000"/>
    <circle cx="{cx}" cy="{cy}" r="{r}" fill="#fff"/>
    <polyline points="{check(cx, cy)}" fill="none" stroke="#000" stroke-width="20"
      stroke-linecap="round" stroke-linejoin="round"/>
  </mask></defs>
  <rect width="512" height="512" fill="#fff" mask="url(#m)"/>'''
    return svg(scaled(body, 0.62))


def variants(p: dict, season: str) -> dict[str, str]:
    bg = p["bg"]
    tile = mark(p) + details(season)  # app icons carry the occasion's details; the logo stays plain
    return {
        # The mark alone: in-app logo.
        "mark.svg": svg(scaled(mark(p), 1.12)),
        # Rounded tile: favicon, docs.
        "icon.svg": svg(scaled(tile, 0.9), bg, 112),
        # Full bleed: store icon, web app icons, apple-touch-icon (the platform rounds it).
        "icon-full.svg": svg(scaled(tile, 0.9), bg),
        # Maskable web icon: inside the 80 % safe circle.
        "icon-maskable.svg": svg(scaled(tile, 0.72), bg),
        # Android adaptive icon layers: inside the 66 % safe zone.
        "icon-foreground.svg": svg(scaled(tile, 0.62)),
        "icon-background.svg": svg("", bg),
        "icon-monochrome.svg": mono(),
    }


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--season", default="classic", choices=sorted(PALETTES))
    season = ap.parse_args().season

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "seal.svg").unlink(missing_ok=True)
    for name, text in variants(PALETTES[season], season).items():
        (OUT / name).write_text(text)
    (OUT / "season.txt").write_text(season + "\n")

    seasons = OUT / "seasons"
    seasons.mkdir(exist_ok=True)
    for key, p in PALETTES.items():
        (seasons / f"{key}.svg").write_text(variants(p, key)["icon-full.svg"])
    print(f"wrote public/brand/*.svg in the {season} colours, and public/brand/seasons/*.svg")
