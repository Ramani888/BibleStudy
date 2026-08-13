#!/usr/bin/env node
/**
 * nav-lint.js — enforces navigation rules from CLAUDE.md.
 * Run: node scripts/nav-lint.js
 * Or:  npm run lint:nav
 *
 * Checks:
 *  1. useNavigation<any>() — always wrong; use typed screen props
 *  2. navigate(X as any)  — hidden type error; fix composite nav props
 *  3. Tab screens missing edges={['top']}         — double bottom inset gap
 *  4. Modal/root screens using edges={['top']} only — footer hides behind home indicator
 *  5. Modal ScreenHeader has `handle` but no `onClose` — user stuck if keyboard open
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT    = path.join(__dirname, '..');
const SRC     = path.join(ROOT, 'src');
const NAV_DIR = path.join(SRC, 'navigation');
const SCR_DIR = path.join(SRC, 'screens');

let errors = 0;
const rel = f => path.relative(ROOT, f);

function fail(msg) { console.error(`  ❌  ${msg}`); errors++; }
function ok(msg)   { console.log (`  ✅  ${msg}`); }
function read(f)   { return fs.readFileSync(f, 'utf8'); }

function findScreenFile(component) {
  try {
    const out = execSync(
      `grep -rl "export function ${component}\\b" "${SCR_DIR}"`,
      { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }
    ).trim();
    return out.split('\n')[0] || null;
  } catch { return null; }
}

// Parse a navigator file and return [{name, component, isModal}]
function parseNavigator(navFile) {
  const content = read(navFile);
  const results = [];
  // Match multi-line <Stack.Screen ... /> blocks
  const re = /<Stack\.Screen[\s\S]*?\/>/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const block = m[0];
    const name  = (block.match(/name="([^"]+)"/)   || [])[1];
    const comp  = (block.match(/component=\{([A-Za-z]+)/))[1] ?? null;
    if (!name || !comp) continue;
    results.push({ name, component: comp, isModal: block.includes("presentation: 'modal'") });
  }
  return results;
}

// ─── Collect screen lists ────────────────────────────────────────────────────

const TAB_NAV_FILES = ['LibraryNavigator','QuizNavigator','AINavigator','ProfileNavigator']
  .map(n => path.join(NAV_DIR, `${n}.tsx`))
  .filter(f => fs.existsSync(f));

const ROOT_NAV_FILE = path.join(NAV_DIR, 'RootNavigator.tsx');

const tabScreens   = [];   // non-modal inside tab stacks  → must have edges={['top']}
const modalScreens = [];   // modal inside tab stacks       → must have bottom edge
const rootScreens  = [];   // inside RootNavigator          → must have bottom edge

TAB_NAV_FILES.forEach(f => {
  parseNavigator(f).forEach(s => (s.isModal ? modalScreens : tabScreens).push(s));
});
if (fs.existsSync(ROOT_NAV_FILE)) {
  parseNavigator(ROOT_NAV_FILE).forEach(s => rootScreens.push(s));
}

// ─── Check 1: useNavigation<any>() ───────────────────────────────────────────

console.log('\n── 1. useNavigation<any>() ──────────────────────────────────────');
const navAny = execSync(
  `grep -rn "useNavigation<any>" "${SCR_DIR}" 2>/dev/null || true`,
  { encoding: 'utf8' }
).trim();
if (navAny) navAny.split('\n').filter(Boolean).forEach(l => fail(l));
else ok('No useNavigation<any>() found');

// ─── Check 2: navigate(X as any) ─────────────────────────────────────────────

console.log('\n── 2. navigate() as any casts ───────────────────────────────────');
const navCast = execSync(
  `grep -rn "navigate(.*as any\\|\\.navigate.*as any" "${SCR_DIR}" 2>/dev/null || true`,
  { encoding: 'utf8' }
).trim();
if (navCast) navCast.split('\n').filter(Boolean).forEach(l => fail(l));
else ok('No navigate() as any casts');

// ─── Check 3: Tab screens missing edges={['top']} ────────────────────────────

console.log(`\n── 3. Tab screens: must have edges={['top']} (${tabScreens.length} screens) ──`);

// HomeScreen is a direct tab screen (not in a nested stack)
const homeFile = path.join(SCR_DIR, 'home/HomeScreen.tsx');
if (fs.existsSync(homeFile)) {
  const c = read(homeFile);
  if (/SafeAreaView/.test(c) && !/edges=\{\s*\['top'\]/.test(c))
    fail(`${rel(homeFile)}: HomeScreen SafeAreaView missing edges={['top']}`);
}

tabScreens.forEach(({ component }) => {
  const file = findScreenFile(component);
  if (!file) return;
  const c = read(file);
  if (!/<Screen\b/.test(c) && !/SafeAreaView/.test(c)) return;

  // Accept static edges={['top']} OR dynamic screenEdges with context-aware ternary
  // (dual-registered screens that live in both LibraryNavigator and RootNavigator)
  const hasTopEdge = /edges=\{\s*\['top'\]/.test(c) ||
    (/edges=\{screenEdges\}/.test(c) && /getState\(\)\?\.type\s*===\s*'tab'/.test(c));
  if (!hasTopEdge)
    fail(`${rel(file)}: "${component}" — <Screen> missing edges={['top']} (tab bar owns bottom; double inset creates gap)`);
});

if (!errors) ok(`All ${tabScreens.length + 1} tab screens have correct edges`);

// ─── Check 4: Modal/root screens using edges={['top']} alone ─────────────────

console.log(`\n── 4. Modal/root screens: must NOT use edges={['top']} only (${modalScreens.length + rootScreens.length} screens) ──`);
const edgeErrors = errors;

[...modalScreens, ...rootScreens].forEach(({ component }) => {
  const file = findScreenFile(component);
  if (!file) return;
  const c = read(file);
  // Wrong: edges={['top']} present, and no ['top','bottom'] variant
  if (/edges=\{\s*\['top'\]/.test(c) && !/edges=\{\s*\['top',\s*'bottom'\]/.test(c))
    fail(`${rel(file)}: "${component}" — edges={['top']} only; home indicator overlaps footer. Remove edges prop or use ['top','bottom'].`);
});

if (errors === edgeErrors) ok(`All ${modalScreens.length + rootScreens.length} modal/root screens have correct edges`);

// ─── Check 5: Modal ScreenHeader with `handle` but no `onClose` ──────────────

console.log(`\n── 5. Modal screens: handle requires onClose (${modalScreens.length} screens) ──`);
const closeErrors = errors;

modalScreens.forEach(({ component }) => {
  const file = findScreenFile(component);
  if (!file) return;
  const c = read(file);
  if (/\bhandle\b/.test(c) && !/\bonClose\b/.test(c))
    fail(`${rel(file)}: "${component}" — ScreenHeader has 'handle' but no 'onClose'. Add onClose={() => navigation.goBack()}.`);
});

if (errors === closeErrors) ok('All modal screens with handle also have onClose');

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('\n─────────────────────────────────────────────────────────────────');
if (errors === 0) {
  console.log('✅  All nav-lint checks passed\n');
  process.exit(0);
} else {
  console.log(`❌  ${errors} issue(s) found — fix before committing\n`);
  process.exit(1);
}
