// Generates all launch icon + store assets from the Verdance theme SVG.
// Run from frontend/: `node ../branding/build-icons.mjs`  (sharp lives in frontend/node_modules)
import { mkdirSync } from 'fs';
import { createRequire } from 'module';
const sharp = createRequire('/Volumes/DevSSD/Work/BibleStudy/frontend/')('sharp');

const ROOT = '/Volumes/DevSSD/Work/BibleStudy';
const AND = `${ROOT}/frontend/android/app/src/main/res`;
const IOS = `${ROOT}/frontend/ios/frontend/Images.xcassets/AppIcon.appiconset`;
const STORE = `${ROOT}/branding/store`;
mkdirSync(STORE, { recursive: true });

const GRAD = `<linearGradient id="g" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
  <stop stop-color="#8B5CF6"/><stop offset="1" stop-color="#6366F1"/></linearGradient>`;
const MARK = `
  <path d="M360 372 L512 690 L664 372" stroke="#fff" stroke-width="40" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M512 690 C452 566 452 452 512 336 C572 452 572 566 512 690 Z" fill="#fff"/>`;

// full-bleed square (iOS, store, legacy launcher)
const square = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>${GRAD}</defs><rect width="1024" height="1024" fill="url(#g)"/>${MARK}</svg>`;
// round (Android ic_launcher_round) — transparent corners
const round = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>${GRAD}</defs><circle cx="512" cy="512" r="512" fill="url(#g)"/>${MARK}</svg>`;
// adaptive foreground — transparent, mark enlarged into safe zone
const fg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g transform="translate(512,513) scale(1.5) translate(-512,-513)">${MARK}</g></svg>`;
// Play feature graphic 1024x500
const feature = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1024" y2="500" gradientUnits="userSpaceOnUse">
    <stop stop-color="#8B5CF6"/><stop offset="1" stop-color="#6366F1"/></linearGradient></defs>
  <rect width="1024" height="500" fill="url(#g)"/>
  <g transform="translate(232,110) scale(0.78)">
    <path d="M0 0 L92 200 L184 0" stroke="#fff" stroke-width="26" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M92 200 C55 122 55 50 92 -22 C129 50 129 122 92 200 Z" fill="#fff"/>
  </g>
  <text x="470" y="240" font-family="Georgia, 'Times New Roman', serif" font-size="104"
        font-weight="500" letter-spacing="10" fill="#fff">Verdance</text>
  <text x="472" y="300" font-family="Helvetica, Arial, sans-serif" font-size="34"
        letter-spacing="6" fill="#EEF0FF" opacity="0.92">GROW IN THE WORD</text>
</svg>`;

const buf = (svg) => Buffer.from(svg);
const opaque = (b, size) => sharp(buf(b)).resize(size, size).flatten({ background: '#6366F1' }).png();
const alpha  = (b, size) => sharp(buf(b)).resize(size, size).png();

const FG = { 'mdpi': 108, 'hdpi': 162, 'xhdpi': 216, 'xxhdpi': 324, 'xxxhdpi': 432 };
const LN = { 'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192 };

const jobs = [
  // iOS single 1024, no alpha
  opaque(square, 1024).toFile(`${IOS}/icon-1024.png`),
  // store
  opaque(square, 1024).toFile(`${STORE}/appstore-icon-1024.png`),
  opaque(square, 512).toFile(`${STORE}/playstore-icon-512.png`),
  sharp(buf(feature)).resize(1024, 500).flatten({ background: '#6366F1' }).png().toFile(`${STORE}/play-feature-graphic-1024x500.png`),
];
for (const [d, s] of Object.entries(FG))
  jobs.push(alpha(fg, s).toFile(`${AND}/mipmap-${d}/ic_launcher_foreground.png`));
for (const [d, s] of Object.entries(LN)) {
  jobs.push(opaque(square, s).toFile(`${AND}/mipmap-${d}/ic_launcher.png`));
  jobs.push(alpha(round, s).toFile(`${AND}/mipmap-${d}/ic_launcher_round.png`));
}

// Android notification icon — white silhouette, transparent (system tints it)
const NOTIF = { 'mdpi': 24, 'hdpi': 36, 'xhdpi': 48, 'xxhdpi': 72, 'xxxhdpi': 96 };
for (const [d, s] of Object.entries(NOTIF)) {
  mkdirSync(`${AND}/drawable-${d}`, { recursive: true });
  jobs.push(alpha(fg, s).toFile(`${AND}/drawable-${d}/ic_stat_notification.png`));
}

// Android splash logo — white mark, transparent (centered on gradient windowBackground)
const SPLASH = { 'xhdpi': 256, 'xxhdpi': 384, 'xxxhdpi': 512 };
for (const [d, s] of Object.entries(SPLASH)) {
  mkdirSync(`${AND}/drawable-${d}`, { recursive: true });
  jobs.push(alpha(fg, s).toFile(`${AND}/drawable-${d}/splash_logo.png`));
}

// iOS launch logo imageset (white mark, transparent)
const LAUNCH = `${ROOT}/frontend/ios/frontend/Images.xcassets/LaunchLogo.imageset`;
mkdirSync(LAUNCH, { recursive: true });
jobs.push(alpha(fg, 160).toFile(`${LAUNCH}/launch-logo.png`));
jobs.push(alpha(fg, 320).toFile(`${LAUNCH}/launch-logo@2x.png`));
jobs.push(alpha(fg, 480).toFile(`${LAUNCH}/launch-logo@3x.png`));

// Web: favicon + social-share (OG) image for the hosted privacy/terms pages
const LEGAL = `${ROOT}/legal`;
mkdirSync(LEGAL, { recursive: true });
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
    <stop stop-color="#8B5CF6"/><stop offset="1" stop-color="#6366F1"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <g transform="translate(510,150) scale(0.62)">
    <path d="M0 0 L150 318 L300 0" stroke="#fff" stroke-width="40" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M150 318 C90 194 90 80 150 -36 C210 80 210 194 150 318 Z" fill="#fff"/>
  </g>
  <text x="600" y="470" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
        font-size="96" font-weight="500" letter-spacing="10" fill="#fff">Verdance</text>
  <text x="600" y="530" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="30" letter-spacing="6" fill="#EEF0FF" opacity="0.9">GROW IN THE WORD</text>
</svg>`;
await Promise.all([
  sharp(buf(og)).resize(1200, 630).flatten({ background: '#6366F1' }).png().toFile(`${LEGAL}/og-image.png`),
  opaque(square, 512).toFile(`${LEGAL}/favicon-512.png`),
  opaque(square, 180).toFile(`${LEGAL}/apple-touch-icon.png`),
  opaque(square, 48).toFile(`${LEGAL}/favicon-48.png`),
  opaque(square, 32).toFile(`${LEGAL}/favicon-32.png`),
]);

console.log(`OK: generated ${jobs.length} app PNGs + 5 web assets`);
