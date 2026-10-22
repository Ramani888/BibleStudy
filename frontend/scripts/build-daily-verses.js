/**
 * Builds src/data/dailyVerses.json — a year+ of short verses (one per day, cycled), World English Bible
 * (public domain), text fetched verbatim from bible-api.com so nothing is
 * typed from memory. Re-run only to change the list:
 *   node scripts/build-daily-verses.js
 */
const fs = require('fs');
const path = require('path');

const REFS = `
Lamentations 3:22-23; Psalm 23:1; Psalm 46:1; Psalm 34:18; Psalm 55:22; Psalm 27:1; Psalm 37:4; Psalm 37:5; Psalm 46:10; Psalm 91:1-2;
Psalm 119:105; Psalm 121:1-2; Psalm 139:14; Psalm 16:8; Psalm 18:2; Psalm 19:14; Psalm 28:7; Psalm 30:5; Psalm 31:24; Psalm 32:8;
Psalm 34:8; Psalm 40:1; Psalm 42:11; Psalm 51:10; Psalm 56:3; Psalm 62:1; Psalm 63:1; Psalm 73:26; Psalm 84:11; Psalm 86:5;
Psalm 90:12; Psalm 94:19; Psalm 100:4-5; Psalm 103:2; Psalm 103:12; Psalm 107:1; Psalm 118:24; Psalm 119:11; Psalm 119:114; Psalm 121:7-8;
Psalm 126:5; Psalm 136:1; Psalm 138:8; Psalm 143:8; Psalm 145:18; Psalm 147:3; Psalm 150:6; Psalm 4:8; Psalm 5:3; Psalm 9:10;
Psalm 25:4-5; Psalm 29:11; Psalm 33:20; Psalm 36:5; Psalm 57:10; Psalm 61:2; Psalm 68:19; Psalm 71:5; Psalm 116:1; Psalm 130:5;
Proverbs 3:5-6; Proverbs 3:9; Proverbs 4:23; Proverbs 16:3; Proverbs 16:9; Proverbs 18:10; Proverbs 17:17; Proverbs 15:1; Proverbs 22:6; Proverbs 27:17;
Proverbs 11:25; Proverbs 12:25; Proverbs 14:30; Proverbs 19:21; Proverbs 30:5; Proverbs 1:7; Proverbs 2:6; Proverbs 9:10; Proverbs 10:12; Proverbs 31:25;
Isaiah 40:31; Isaiah 41:10; Isaiah 26:3; Isaiah 43:2; Isaiah 40:8; Isaiah 9:6; Isaiah 53:5; Isaiah 55:8-9; Isaiah 54:10; Isaiah 30:15;
Isaiah 40:29; Isaiah 41:13; Isaiah 43:18-19; Isaiah 49:15; Isaiah 58:11; Isaiah 60:1; Isaiah 61:1; Isaiah 64:8; Isaiah 12:2; Isaiah 25:1;
Jeremiah 29:11; Jeremiah 17:7; Jeremiah 31:3; Jeremiah 33:3; Jeremiah 32:17; Joshua 1:9; Joshua 24:15; Deuteronomy 31:6; Deuteronomy 31:8; Deuteronomy 6:5;
Numbers 6:24-26; Exodus 14:14; Exodus 15:2; Genesis 1:1; Genesis 28:15; Genesis 50:20; 1 Samuel 16:7; 2 Samuel 22:31; 1 Chronicles 16:11; 2 Chronicles 7:14;
Nehemiah 8:10; Job 19:25; Ecclesiastes 3:1; Ecclesiastes 3:11; Micah 6:8; Micah 7:7; Zephaniah 3:17; Habakkuk 3:19; Nahum 1:7; Zechariah 4:6;
Malachi 3:10; Hosea 6:3; Joel 2:13; Ruth 1:16; Song of Solomon 8:7; Daniel 2:20; Jonah 2:2; Haggai 2:4; Lamentations 3:25; Esther 4:14;
Matthew 5:3; Matthew 5:4; Matthew 5:5; Matthew 5:6; Matthew 5:7; Matthew 5:8; Matthew 5:9; Matthew 5:14; Matthew 5:16; Matthew 5:44;
Matthew 6:33; Matthew 6:34; Matthew 6:19-20; Matthew 6:26; Matthew 7:7; Matthew 7:12; Matthew 11:28; Matthew 11:29-30; Matthew 19:26; Matthew 22:37;
Matthew 22:39; Matthew 28:19-20; Matthew 18:20; Matthew 17:20; Matthew 4:4; Matthew 10:31; Matthew 24:35; Matthew 25:40; Matthew 9:37; Matthew 16:24;
Mark 9:23; Mark 10:27; Mark 11:24; Mark 12:30; Mark 10:45; Mark 1:35; Mark 4:39; Mark 16:15; Mark 5:36; Mark 8:36;
Luke 1:37; Luke 6:31; Luke 6:38; Luke 12:34; Luke 11:9; Luke 2:10-11; Luke 18:27; Luke 19:10; Luke 6:27-28; Luke 1:45;
John 3:16; John 3:17; John 1:5; John 8:12; John 8:32; John 10:10; John 10:11; John 11:25; John 13:34; John 13:35;
John 14:1; John 14:6; John 14:27; John 15:5; John 15:12; John 15:13; John 16:33; John 1:14; John 6:35; John 4:24;
John 14:15; John 15:7; John 20:29; John 1:12; John 6:37; John 10:27-28; John 12:46; John 17:17; John 21:17; John 15:16;
Acts 1:8; Acts 2:38; Acts 4:12; Acts 16:31; Acts 20:35; Acts 17:28; Acts 3:19; Acts 2:42; Acts 10:34; Acts 5:29;
Romans 1:16; Romans 3:23; Romans 5:1; Romans 5:3-4; Romans 5:8; Romans 6:23; Romans 8:1; Romans 8:18; Romans 8:28; Romans 8:31;
Romans 8:38-39; Romans 10:9; Romans 10:17; Romans 12:1; Romans 12:2; Romans 12:10; Romans 12:12; Romans 12:21; Romans 15:13; Romans 13:8;
1 Corinthians 2:9; 1 Corinthians 10:13; 1 Corinthians 13:4; 1 Corinthians 13:7; 1 Corinthians 13:13; 1 Corinthians 15:58; 1 Corinthians 16:13-14; 1 Corinthians 6:19; 1 Corinthians 10:31; 1 Corinthians 15:57;
2 Corinthians 4:16; 2 Corinthians 4:18; 2 Corinthians 5:7; 2 Corinthians 5:17; 2 Corinthians 9:7; 2 Corinthians 12:9; 2 Corinthians 1:3-4; 2 Corinthians 3:17; 2 Corinthians 9:8; 2 Corinthians 4:8-9;
Galatians 2:20; Galatians 5:1; Galatians 5:13; Galatians 5:22-23; Galatians 6:2; Galatians 6:9; Galatians 3:28; Galatians 6:10; Galatians 5:14; Galatians 1:10;
Ephesians 2:8-9; Ephesians 2:10; Ephesians 3:20; Ephesians 4:2; Ephesians 4:29; Ephesians 4:32; Ephesians 6:10; Ephesians 1:7; Ephesians 5:2; Ephesians 3:17-18;
Philippians 1:6; Philippians 2:3; Philippians 2:4; Philippians 3:13-14; Philippians 4:4; Philippians 4:6; Philippians 4:7; Philippians 4:8; Philippians 4:13; Philippians 4:19;
Colossians 1:17; Colossians 2:6-7; Colossians 3:2; Colossians 3:12; Colossians 3:13; Colossians 3:14; Colossians 3:15; Colossians 3:17; Colossians 3:23; Colossians 4:2;
1 Thessalonians 5:11; 1 Thessalonians 5:16-18; 1 Thessalonians 4:11; 2 Thessalonians 3:3; 2 Thessalonians 3:16; 1 Timothy 4:12; 1 Timothy 6:6; 1 Timothy 6:12; 2 Timothy 1:7; 2 Timothy 3:16;
2 Timothy 4:7; 2 Timothy 2:15; Titus 3:5; Philemon 1:6; Hebrews 4:12; Hebrews 4:16; Hebrews 10:23; Hebrews 10:24; Hebrews 11:1; Hebrews 11:6;
Hebrews 12:1; Hebrews 12:2; Hebrews 13:5; Hebrews 13:8; Hebrews 13:16; Hebrews 6:19; Hebrews 13:2; Hebrews 10:35; Hebrews 12:11; Hebrews 2:18;
James 1:2-3; James 1:5; James 1:12; James 1:17; James 1:19; James 1:22; James 4:7; James 4:8; James 4:10; James 5:16;
1 Peter 2:9; 1 Peter 3:15; 1 Peter 4:8; 1 Peter 4:10; 1 Peter 5:6-7; 1 Peter 5:10; 1 Peter 1:3; 1 Peter 1:8; 2 Peter 1:3; 2 Peter 3:9;
1 John 1:9; 1 John 3:1; 1 John 3:18; 1 John 4:4; 1 John 4:7; 1 John 4:8; 1 John 4:10; 1 John 4:18; 1 John 4:19; 1 John 5:14;
3 John 1:2; Jude 1:24-25; Revelation 3:20; Revelation 21:4; Revelation 21:5; Revelation 22:13; Revelation 1:8; Revelation 4:11; Revelation 7:17; Revelation 22:20
`.split(';').map(s => s.trim()).filter(Boolean);

const OUT = path.join(__dirname, '..', 'src', 'data', 'dailyVerses.json');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const dupes = REFS.filter((r, i) => REFS.indexOf(r) !== i);
  if (dupes.length) throw new Error(`duplicate refs: ${dupes.join(', ')}`);
  console.log(`${REFS.length} refs`);
  const out = [];
  for (const ref of REFS) {
    for (let attempt = 0; ; attempt++) {
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=web`);
      if (res.status === 429 && attempt < 5) { await sleep(15000); continue; }
      if (!res.ok) throw new Error(`${ref}: HTTP ${res.status}`);
      const j = await res.json();
      out.push({ ref: j.reference, text: j.text.replace(/\s+/g, ' ').trim() });
      break;
    }
    await sleep(2200); // bible-api.com allows ~15 requests / 30s
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 0).replace(/},{/g, '},\n{') + '\n');
  console.log(`wrote ${out.length} verses`);
})().catch(e => { console.error(e.message); process.exit(1); });
