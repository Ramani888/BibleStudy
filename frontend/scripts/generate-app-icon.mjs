/**
 * Regenerate every Android + iOS app-icon asset from a single SVG source.
 *
 *   npm run app-icon
 *
 * To change the logo: replace assets/branding/icon.svg (full icon) and
 * assets/branding/icon-foreground.svg (mark only, transparent), adjust
 * ICON_BACKGROUND if the brand colour changes, then re-run this script.
 */
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const ICON_BACKGROUND = '#6366F1'; // indigo — matches BRAND_BG in SplashScreen
const SRC_FULL = join(ROOT, 'assets/branding/icon.svg');
const SRC_FG   = join(ROOT, 'assets/branding/icon-foreground.svg');

const fullSvg = readFileSync(SRC_FULL, 'utf8');
const fgSvg   = readFileSync(SRC_FG,   'utf8');

function render(svg, width, background) {
  const opts = { fitTo: { mode: 'width', value: width } };
  if (background) opts.background = background;
  return new Resvg(svg, opts).render().asPng();
}

function write(file, buf) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, buf);
  console.log('  ✓', relative(ROOT, file).replace(/\\/g, '/'));
}

// ── Android ──────────────────────────────────────────────────────────────────
const ANDROID_RES = join(ROOT, 'android/app/src/main/res');

const LEGACY = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
for (const [dpi, size] of Object.entries(LEGACY)) {
  const png = render(fullSvg, size);
  write(join(ANDROID_RES, `mipmap-${dpi}/ic_launcher.png`), png);
  write(join(ANDROID_RES, `mipmap-${dpi}/ic_launcher_round.png`), png);
}

const FOREGROUND = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
for (const [dpi, size] of Object.entries(FOREGROUND)) {
  write(join(ANDROID_RES, `mipmap-${dpi}/ic_launcher_foreground.png`), render(fgSvg, size));
}

const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;
write(join(ANDROID_RES, 'mipmap-anydpi-v26/ic_launcher.xml'),       Buffer.from(adaptiveXml));
write(join(ANDROID_RES, 'mipmap-anydpi-v26/ic_launcher_round.xml'), Buffer.from(adaptiveXml));
write(join(ANDROID_RES, 'values/ic_launcher_background.xml'), Buffer.from(
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${ICON_BACKGROUND}</color>\n</resources>\n`
));

// ── iOS ───────────────────────────────────────────────────────────────────────
const IOS_SET = join(ROOT, 'ios/frontend/Images.xcassets/AppIcon.appiconset');
const ios1024 = await sharp(render(fullSvg, 1024, ICON_BACKGROUND))
  .flatten({ background: ICON_BACKGROUND })
  .png({ compressionLevel: 9 })
  .toBuffer();
write(join(IOS_SET, 'icon-1024.png'), ios1024);
write(join(IOS_SET, 'Contents.json'), Buffer.from(JSON.stringify({
  images: [{ filename: 'icon-1024.png', idiom: 'universal', platform: 'ios', size: '1024x1024' }],
  info: { author: 'xcode', version: 1 },
}, null, 2) + '\n'));

console.log('\n✅ App icons regenerated for Android + iOS.');
