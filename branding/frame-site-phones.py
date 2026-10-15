#!/usr/bin/env python3
"""Render the website's app screenshots inside a real 3D titanium iPhone (transparent WebP).
Same renderer as MindRest's store-screenshots/frame-shots-ios.py: drawn metal rim + side buttons,
body extruded in perspective, glass glare. Shadow is added in CSS, so the output stays transparent.
Usage: python3 branding/frame-site-phones.py   (reads legal/screens/*.png, writes legal/screens/3d/*.webp)"""
import math
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "legal", "screens")
OUT = os.path.join(SRC, "3d")
os.makedirs(OUT, exist_ok=True)

NAMES = ["01-home", "02-library", "03-cards", "04-quiz", "05-ai", "06-profile"]
OUT_W = 800                  # final width: 2x the largest CSS phone (400px)

SCREEN_W = 900               # screenshot width inside the frame
BEZEL = 26                   # frame thickness around the screen
SCREEN_R = 150               # display corner radius at this scale
DEPTH = 96                   # body thickness in px
LAYERS = 48                  # slices used to extrude the body
CAM = 3600                   # camera distance (smaller = stronger perspective)
POSE = (0, 0, 0)             # yaw, pitch, roll in degrees — straight-on
STATUS_H = 96                # Android status-bar band at SCREEN_W (ink ends at 57/720 px)
F_TIME = ImageFont.truetype(os.path.join(HERE, "..", "frontend", "assets", "fonts", "Inter-SemiBold.ttf"), 38)


def ios_status_bar(shot):
    """The raw shots come from Android (1:09 · 3G); paint over that band with a clean iOS bar."""
    d = ImageDraw.Draw(shot)
    ink = (0x11, 0x11, 0x18)
    d.rectangle([0, 0, shot.width, STATUS_H], fill=shot.getpixel((shot.width // 2, 5)))
    d.text((150, 58), "9:41", font=F_TIME, fill=ink, anchor="mm")
    d.rounded_rectangle([shot.width / 2 - 125, 20, shot.width / 2 + 125, 92], 36, fill=(0, 0, 0))  # Dynamic Island
    x, base = 668, 70                                    # signal: 4 rising bars
    for i in range(4):
        d.rounded_rectangle([x + i * 13, base - 10 - i * 6, x + i * 13 + 8, base], 2, fill=ink)
    cx, cy = 744, 74                                     # wifi: 3 arcs + dot
    for r in (30, 20):
        d.arc([cx - r, cy - r, cx + r, cy + r], 225, 315, fill=ink, width=6)
    d.pieslice([cx - 10, cy - 10, cx + 10, cy + 10], 225, 315, fill=ink)
    d.rounded_rectangle([786, 45, 836, 71], 8, outline=ink, width=3)  # battery
    d.rounded_rectangle([791, 50, 831, 66], 4, fill=ink)
    d.rounded_rectangle([839, 53, 843, 63], 2, fill=ink)
    return shot


def phone(shot):
    """Screenshot inside a drawn titanium iPhone frame, as RGBA with side buttons."""
    shot = shot.resize((SCREEN_W, round(shot.height * SCREEN_W / shot.width)), Image.LANCZOS)
    shot = ios_status_bar(shot)
    sw, sh = shot.size
    pad = 12                                             # room for side buttons
    w, h = sw + 2 * BEZEL + 2 * pad, sh + 2 * BEZEL
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    R = SCREEN_R + BEZEL
    for y0, y1 in ((330, 420), (500, 650), (690, 840)):  # action + volume (left)
        d.rounded_rectangle([2, y0, pad + 6, y1], 6, fill=(0x3A, 0x3A, 0x42))
    d.rounded_rectangle([w - pad - 6, 560, w - 2, 780], 6, fill=(0x3A, 0x3A, 0x42))  # power (right)
    d.rounded_rectangle([pad, 0, w - pad - 1, h - 1], R, fill=(0x8E, 0x8C, 0x96))     # light rim
    d.rounded_rectangle([pad + 4, 4, w - pad - 5, h - 5], R - 4, fill=(0x2C, 0x2B, 0x31))  # dark band
    d.rounded_rectangle([pad + 10, 10, w - pad - 11, h - 11], R - 10, fill=(0x05, 0x05, 0x07))  # bezel
    mask = Image.new("L", shot.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, sw - 1, sh - 1], SCREEN_R, fill=255)
    img.paste(shot, (pad + BEZEL, BEZEL), mask)
    return img


def glare(img):
    """Soft diagonal reflection across the glass (screen area only)."""
    w, h = img.size
    band = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(band)
    for k in range(0, 260, 4):
        a = int(38 * (1 - abs(k - 130) / 130))
        off = int(w * 0.15) + k
        d.polygon([(off, 0), (off + 6, 0), (off + 6 - int(h * 0.55), h), (off - int(h * 0.55), h)], fill=a)
    band = band.filter(ImageFilter.GaussianBlur(18))
    screen = Image.new("L", (w, h), 0)
    ImageDraw.Draw(screen).rounded_rectangle([12 + BEZEL, BEZEL, w - 13 - BEZEL, h - 1 - BEZEL], SCREEN_R, fill=255)
    band = Image.composite(band, Image.new("L", (w, h), 0), screen)
    white = Image.new("RGBA", (w, h), (255, 255, 255, 0))
    white.putalpha(band)
    return Image.alpha_composite(img, white)


def solve(a, b):
    """Gaussian elimination for the 8x8 perspective system (no numpy needed)."""
    n = len(b)
    m = [row[:] + [b[i]] for i, row in enumerate(a)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(m[r][c]))
        m[c], m[p] = m[p], m[c]
        for r in range(n):
            if r != c:
                f = m[r][c] / m[c][c]
                m[r] = [x - f * y for x, y in zip(m[r], m[c])]
    return [m[i][n] / m[i][i] for i in range(n)]


def project(pw, ph, z, center):
    """Project the 4 corners of the phone plane at depth z; returns canvas points."""
    yaw, pitch, roll = (math.radians(v) for v in POSE)
    pts = []
    for u, v in ((0, 0), (pw, 0), (pw, ph), (0, ph)):
        x, y, z0 = u - pw / 2, v - ph / 2, z
        x, y = x * math.cos(roll) - y * math.sin(roll), x * math.sin(roll) + y * math.cos(roll)
        y, zz = y * math.cos(pitch) - z0 * math.sin(pitch), y * math.sin(pitch) + z0 * math.cos(pitch)
        x, zz = x * math.cos(yaw) + zz * math.sin(yaw), -x * math.sin(yaw) + zz * math.cos(yaw)
        k = CAM / (CAM - zz)
        pts.append((center[0] + x * k, center[1] + y * k))
    return pts


def homography(dst, pw, ph):
    """PIL PERSPECTIVE coeffs mapping canvas (dst quad) -> source image rect."""
    A, B = [], []
    for (x, y), (u, v) in zip(dst, [(0, 0), (pw, 0), (pw, ph), (0, ph)]):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.append(u)
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y]); B.append(v)
    return solve(A, B)


def render_phone3d(front):
    """Extrude the phone silhouette back-to-front (metal body), then the glass face on top."""
    pw, ph = front.size
    size = (pw + 80, ph + 80)
    center = (size[0] / 2, size[1] / 2)
    sil = front.split()[3]
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    for i in range(LAYERS, 0, -1):                     # back -> front
        t = 1 - i / LAYERS
        c = tuple(int(a + (b - a) * t) for a, b in zip((0x1E, 0x1D, 0x24), (0x7A, 0x78, 0x84)))
        if i <= 2:
            c = (0xB8, 0xB6, 0xC2)                      # bright chamfer right behind the glass
        m = sil.transform(size, Image.PERSPECTIVE, homography(project(pw, ph, -DEPTH * i / LAYERS, center), pw, ph), Image.BILINEAR)
        out.paste(Image.new("RGBA", size, c + (255,)), (0, 0), m)
    face = glare(front).transform(size, Image.PERSPECTIVE, homography(project(pw, ph, 0, center), pw, ph), Image.BICUBIC)
    out = Image.alpha_composite(out, face)
    return out.crop(out.getbbox())


for name in NAMES:
    ph3d = render_phone3d(phone(Image.open(os.path.join(SRC, f"{name}.png")).convert("RGB")))
    ph3d = ph3d.resize((OUT_W, round(ph3d.height * OUT_W / ph3d.width)), Image.LANCZOS)
    out = os.path.join(OUT, f"{name}.webp")
    ph3d.save(out, "WEBP", quality=88, method=6)
    print("wrote", os.path.relpath(out), ph3d.size, f"{os.path.getsize(out) // 1024}K")
