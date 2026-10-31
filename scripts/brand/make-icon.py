"""Draws the Shiftseal icon: a wax seal pressed onto a time card.

The seal's clock reads ten past ten, which is also a check mark: time, verified.
The seal is drawn as a height map and lit, so the rim, the pressed well and the
raised clock catch light like real wax.

Writes the SVG variants to public/brand/ (rounded, full-bleed, maskable, the
Android adaptive foreground and background, and the seal alone). The PNGs in
public/, public/brand/, store/ and the Android mipmaps are rendered from these
at their sizes. Run: python3 scripts/brand/make-icon.py
"""
import math
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]


def blob(cx, cy, r, wobble, bulges, n=240):
    """A wax puddle: a circle with an uneven edge and a few spreads."""
    pts = []
    for i in range(n):
        t = i / n * math.tau
        rr = r
        for amp, freq, phase in wobble:
            rr += amp * math.sin(freq * t + phase)
        for ang, amp, width in bulges:
            d = math.atan2(math.sin(t - ang), math.cos(t - ang))
            rr += amp * math.exp(-(d / width) ** 2)
        pts.append((cx + rr * math.cos(t), cy + rr * math.sin(t)))
    return "M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z"


def ticks(cx, cy, r_in, r_out_major, r_out_minor):
    out = []
    for i in range(12):
        a = i / 12 * math.tau - math.pi / 2
        ro = r_out_major if i % 3 == 0 else r_out_minor
        out.append((cx + r_in * math.cos(a), cy + r_in * math.sin(a),
                    cx + ro * math.cos(a), cy + ro * math.sin(a), i % 3 == 0))
    return out


def hand(cx, cy, clock_minutes, length):
    a = clock_minutes / 60 * math.tau - math.pi / 2
    return cx + length * math.cos(a), cy + length * math.sin(a)


CX, CY, R = 318, 326, 136
WAX = blob(CX, CY, R, [(5.5, 3, 0.7), (3.5, 5, 2.1), (1.6, 11, 0.4), (0.7, 23, 1.3)],
           [(math.radians(205), 14, 0.42), (math.radians(68), 9, 0.3), (math.radians(318), 7, 0.22),
            (math.radians(140), -5, 0.3)])

# Hands: ten past ten. The hour hand sits a little past 10, the minute hand on 2.
HOUR = hand(CX, CY, 50.8, 46)   # ~10:10 hour position, short
MINUTE = hand(CX, CY, 10.5, 78)  # 2 o'clock, long
TICKS = ticks(CX, CY, 84, 102, 96)


def emblem(dx=0.0, dy=0.0, color="#000", width_scale=1.0):
    parts = []
    for x1, y1, x2, y2, major in TICKS:
        w = (9 if major else 6) * width_scale
        parts.append(f'<line x1="{x1+dx:.1f}" y1="{y1+dy:.1f}" x2="{x2+dx:.1f}" y2="{y2+dy:.1f}" '
                     f'stroke="{color}" stroke-width="{w:.1f}" stroke-linecap="round"/>')
    for (hx, hy), w in ((HOUR, 17), (MINUTE, 15)):
        parts.append(f'<line x1="{CX+dx:.1f}" y1="{CY+dy:.1f}" x2="{hx+dx:.1f}" y2="{hy+dy:.1f}" '
                     f'stroke="{color}" stroke-width="{w*width_scale:.1f}" stroke-linecap="round"/>')
    parts.append(f'<circle cx="{CX+dx:.1f}" cy="{CY+dy:.1f}" r="{12*width_scale:.1f}" fill="{color}"/>')
    return "\n    ".join(parts)


ROWS = [("MON", "08:02", "17:31", "16:30", "9.5"),
        ("TUE", "07:58", "17:04", None, "9.1"),
        ("WED", "07:55", "18:40", None, "10.7"),
        ("THU", "08:00", "17:02", None, "9.0"),
        ("FRI", "07:57", "17:10", None, "9.2")]


def card_rows():
    rows = []
    y = 168
    for day, tin, tout, was, h in ROWS:
        rows.append(f'<text x="94" y="{y}" class="day">{day}</text>')
        rows.append(f'<text x="150" y="{y}" class="t">{tin}</text>')
        if was:
            rows.append(f'<text x="232" y="{y}" class="t was">{was}</text>')
            rows.append(f'<line x1="230" y1="{y-7}" x2="290" y2="{y-7}" stroke="#d8391a" stroke-width="3"/>')
            rows.append(f'<text x="296" y="{y}" class="t">{tout}</text>')
        else:
            rows.append(f'<text x="232" y="{y}" class="t">{tout}</text>')
        rows.append(f'<line x1="86" y1="{y+16}" x2="372" y2="{y+16}" stroke="#13213f" stroke-opacity=".16" stroke-width="2" stroke-dasharray="5 6"/>')
        y += 44
    return "\n      ".join(rows)


CARD = f'''    <g transform="rotate(-9 230 230)">
      <rect x="58" y="92" width="330" height="290" rx="14" fill="#000" opacity=".35" filter="url(#soft)" transform="translate(6 14)"/>
      <rect x="58" y="92" width="330" height="290" rx="14" fill="url(#paper)"/>
      <rect x="58" y="92" width="330" height="40" rx="14" fill="#13213f" opacity=".06"/>
      <line x1="78" y1="92" x2="78" y2="382" stroke="#d8391a" stroke-opacity=".5" stroke-width="2.5"/>
      <rect x="96" y="106" width="22" height="16" rx="4" fill="#13213f"/>
      <circle cx="107" cy="114" r="3.5" fill="#d8391a"/>
      <text x="370" y="120" text-anchor="end" class="no">No. 0044</text>
      <line x1="86" y1="136" x2="372" y2="136" stroke="#13213f" stroke-width="4"/>
      {card_rows()}
    </g>
'''


def build(variant):
    clip = variant == 'rounded'
    bg = variant not in ('foreground', 'seal')
    content = variant != 'background'
    scale = {'rounded': 1, 'full': 1, 'maskable': 0.8, 'foreground': 0.64, 'seal': 1, 'background': 1}[variant]
    view = '0 0 512 512' if variant != 'seal' else f'{CX-R-28} {CY-R-28} {2*R+80} {2*R+84}'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}">
  <defs>
    <style>
      .t {{ font: 600 19px 'JetBrains Mono', ui-monospace, monospace; fill: #13213f; }}
      .t.was {{ fill: #d8391a; opacity: .85; }}
      .no {{ font: 600 13px 'JetBrains Mono', monospace; letter-spacing: .12em; fill: #13213f; opacity: .45; }}
      .day {{ font: 700 13px 'Figtree', sans-serif; letter-spacing: .08em; fill: #13213f; opacity: .5; }}
    </style>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1d3060"/>
      <stop offset="1" stop-color="#0a1226"/>
    </linearGradient>
    <radialGradient id="lamp" cx="0.22" cy="0.08" r="0.75">
      <stop offset="0" stop-color="#e8c58a" stop-opacity=".28"/>
      <stop offset="1" stop-color="#e8c58a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fbf6ea"/>
      <stop offset="1" stop-color="#ece2cb"/>
    </linearGradient>
    <radialGradient id="wax" cx="0.36" cy="0.3" r="0.78">
      <stop offset="0" stop-color="#ff6a3f"/>
      <stop offset="0.45" stop-color="#e2401a"/>
      <stop offset="0.85" stop-color="#b42a0e"/>
      <stop offset="1" stop-color="#8a1d07"/>
    </radialGradient>
    <radialGradient id="well" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0.82" stop-color="#c7330f"/>
      <stop offset="1" stop-color="#9c230a"/>
    </radialGradient>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="4"/>
      <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .07 0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
    <filter id="waxtex" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="9" result="n"/>
      <feDiffuseLighting in="n" surfaceScale="2.2" lighting-color="#fff" result="lit">
        <feDistantLight azimuth="225" elevation="52"/>
      </feDiffuseLighting>
      <feComposite in="lit" in2="SourceGraphic" operator="in" result="tex"/>
      <feBlend in="SourceGraphic" in2="tex" mode="multiply"/>
    </filter>
    <filter id="waxlight" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
      <feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="h0"/>
      <feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="2" seed="11" result="n"/>
      <feColorMatrix in="n" type="luminanceToAlpha" result="na"/>
      <feComposite in="h0" in2="na" operator="arithmetic" k2="1" k3="0" k4="0" result="h1"/>
      <feComposite in="h1" in2="SourceAlpha" operator="in" result="h2"/>
      <feGaussianBlur in="h2" stdDeviation="2.2" result="h"/>
      <feDiffuseLighting in="h" surfaceScale="9" diffuseConstant="1.15" lighting-color="#fff" result="diff">
        <feDistantLight azimuth="235" elevation="36"/>
      </feDiffuseLighting>
      <feSpecularLighting in="h" surfaceScale="9" specularConstant=".9" specularExponent="30" lighting-color="#ffe2d4" result="spec">
        <feDistantLight azimuth="235" elevation="36"/>
      </feSpecularLighting>
      <feFlood flood-color="#a81d09" result="red"/>
      <feComposite in="red" in2="SourceAlpha" operator="in" result="base"/>
      <feComposite in="base" in2="diff" operator="arithmetic" k1="1.5" result="shaded"/>
      <feComposite in="spec" in2="SourceAlpha" operator="in" result="specm"/>
      <feComposite in="shaded" in2="specm" operator="arithmetic" k2="1" k3=".85"/>
    </filter>
    <filter id="blur6" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="blur2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2"/></filter>
    <filter id="blur1"><feGaussianBlur stdDeviation="1.1"/></filter>
    <clipPath id="tile"><rect width="512" height="512" rx="112"/></clipPath>
    <clipPath id="sealclip"><path d="{WAX}"/></clipPath>
  </defs>

  <g {'clip-path="url(#tile)"' if clip else ''}>
    {'<rect width="512" height="512" fill="url(#bg)"/><rect width="512" height="512" fill="url(#lamp)"/>' if bg else ''}
    <g transform="translate(256 256) scale({scale}) translate(-256 -256)" {'' if content else 'display="none"'}>

    {'' if variant == 'seal' else CARD}
    <!-- the time card (see CARD) -->

    <!-- the wax seal: drawn as a height map, then lit -->
    <path d="{WAX}" fill="#000" opacity=".6" filter="url(#soft)" transform="translate(12 18)"/>
    <g filter="url(#waxlight)">
      <path d="{WAX}" fill="#c4c4c4"/>
      <g clip-path="url(#sealclip)">
        <circle cx="{CX}" cy="{CY}" r="{R-14}" fill="none" stroke="#fff" stroke-width="20" filter="url(#blur6)"/>
        <circle cx="{CX}" cy="{CY}" r="110" fill="#7a7a7a" filter="url(#blur1)"/>
        <g filter="url(#blur1)">
    {emblem(0, 0, "#c8c8c8")}
        </g>
      </g>
    </g>

    </g>
    {'<rect width="512" height="512" filter="url(#grain)" fill="#fff"/>' if bg else ''}
  </g>
</svg>
'''



def mono():
    """Android 13 themed icon: one colour, the seal with its clock cut out."""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <mask id="m">
      <path d="{WAX}" fill="#fff"/>
      <circle cx="{CX}" cy="{CY}" r="110" fill="none" stroke="#000" stroke-width="6"/>
      {emblem(0, 0, "#000")}
    </mask>
  </defs>
  <g transform="translate(256 256) scale(0.6) translate({-CX} {-CY})">
    <rect width="1024" height="1024" fill="#fff" mask="url(#m)"/>
  </g>
</svg>
'''


(ROOT / "public" / "brand").mkdir(exist_ok=True)
(ROOT / "public" / "brand" / "icon-monochrome.svg").write_text(mono())

for name, variant in [("icon.svg", "rounded"), ("icon-full.svg", "full"), ("icon-maskable.svg", "maskable"),
                      ("icon-foreground.svg", "foreground"), ("seal.svg", "seal"), ("icon-background.svg", "background")]:
    (ROOT / "public" / "brand").mkdir(exist_ok=True)
    (ROOT / "public" / "brand" / name).write_text(build(variant))
print("wrote public/brand/*.svg")
