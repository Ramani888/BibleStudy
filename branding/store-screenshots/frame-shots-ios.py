#!/usr/bin/env python3
"""Frame raw emulator screenshots into store-ready marketing shots.
Gradient bg (Verdance violet->indigo) + caption + rounded device + shadow."""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SRC = os.path.join(os.path.dirname(__file__), "raw-ios")
OUT = os.path.join(os.path.dirname(__file__), "framed-ios")
os.makedirs(OUT, exist_ok=True)

CANVAS = (1284, 2778)          # App Store 6.5" slot (also valid 6.7")
G_TOP  = (0x8B, 0x5C, 0xF6)    # violet500
G_BOT  = (0x63, 0x66, 0xF1)    # indigo500
RADIUS = 56
SHOT_W = 1040                  # scaled device width
CAP_H  = 300                   # caption band at top

BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
REG  = "/System/Library/Fonts/Supplemental/Arial.ttf"
f_head = ImageFont.truetype(BOLD, 78)
f_sub  = ImageFont.truetype(REG, 46)

# headline, subtitle per screenshot
CAPTIONS = {
    "01-home":          ("Build a daily Bible habit", "Streaks that keep you coming back"),
    "02-library":       ("Organize your study",       "Card sets for every book & topic"),
    "03-cards":         ("Learn with smart flashcards","AI-generated question & answer"),
    "04-quiz":          ("Test what you know",         "7 quiz modes to master any set"),
    "04-quiz-activity": ("Track your progress",        "Every score, every session"),
    "05-ai":            ("Study with AI",              "Your Bible companion, powered by Claude"),
    "06-profile":       ("Grow with friends",          "Streaks, achievements & leaderboards"),
}

def gradient(size):
    w, h = size
    base = Image.new("RGB", size)
    px = base.load()
    for y in range(h):
        t = y / (h - 1)
        r = int(G_TOP[0] + (G_BOT[0] - G_TOP[0]) * t)
        g = int(G_TOP[1] + (G_BOT[1] - G_TOP[1]) * t)
        b = int(G_TOP[2] + (G_BOT[2] - G_TOP[2]) * t)
        for x in range(w):
            px[x, y] = (r, g, b)
    return base

def rounded(img, rad):
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, img.size[0], img.size[1]], rad, fill=255)
    out = img.convert("RGBA")
    out.putalpha(mask)
    return out

def centered(draw, text, font, y, fill, w):
    tw = draw.textlength(text, font=font)
    draw.text(((w - tw) / 2, y), text, font=font, fill=fill)

# gradient is identical for every canvas -> build once
BG = gradient(CANVAS)

for name, (head, sub) in CAPTIONS.items():
    src_path = os.path.join(SRC, f"{name}.png")
    if not os.path.exists(src_path):
        print("skip (missing):", name); continue

    canvas = BG.copy()
    draw = ImageDraw.Draw(canvas)

    # caption
    centered(draw, head, f_head, 96, (255, 255, 255), CANVAS[0])
    centered(draw, sub,  f_sub, 200, (255, 255, 255, 230), CANVAS[0])

    # device shot scaled to SHOT_W
    shot = Image.open(src_path).convert("RGB")
    scale = SHOT_W / shot.width
    shot = shot.resize((SHOT_W, int(shot.height * scale)), Image.LANCZOS)
    shot = rounded(shot, RADIUS)

    x = (CANVAS[0] - SHOT_W) // 2
    y = CAP_H + 40

    # drop shadow
    shadow = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    sh = Image.new("RGBA", shot.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([0, 0, shot.size[0], shot.size[1]], RADIUS, fill=(0, 0, 0, 120))
    shadow.paste(sh, (x, y + 24), sh)
    shadow = shadow.filter(ImageFilter.GaussianBlur(40))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), shadow)

    canvas.paste(shot, (x, y), shot)
    canvas.convert("RGB").save(os.path.join(OUT, f"{name}.png"), "PNG")
    print("wrote", name, canvas.size)

print("\nDone ->", OUT)
