// One-shot script to fix UTF-8 → CP1252 → UTF-8 double-encoding corruption
// introduced by a PowerShell bulk replace. Reads the current file as UTF-8,
// reinterprets each char's CP1252 byte value, then re-decodes as UTF-8.
// Only run against files known to contain the mojibake pattern.

const fs = require('fs');
const path = require('path');

// CP1252 -> Unicode mapping for the C1 range (0x80-0x9F).
// All other CP1252 bytes (0x00-0x7F, 0xA0-0xFF) map identically to Unicode.
const CP1252_C1 = {
  0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84,
  0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88,
  0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C,
  0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93,
  0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B,
  0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F,
};

function unicodeToCp1252Byte(cp) {
  if (cp <= 0x7F) return cp;
  if (cp >= 0xA0 && cp <= 0xFF) return cp;
  if (CP1252_C1.hasOwnProperty(cp)) return CP1252_C1[cp];
  // CP1252 has undefined slots at 0x81, 0x8D, 0x8F, 0x90, 0x9D — when PowerShell
  // read those, it preserved them as raw codepoints. Map them back to their byte values.
  if (cp === 0x81 || cp === 0x8D || cp === 0x8F || cp === 0x90 || cp === 0x9D) return cp;
  return null; // not representable in CP1252 — leave char as-is
}

function fixMojibake(text) {
  const bytes = [];
  let suspicious = false;
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    const byte = unicodeToCp1252Byte(cp);
    if (byte === null) {
      // Char isn't a CP1252 char — emit its UTF-8 bytes directly (preserves clean emoji etc)
      const buf = Buffer.from(ch, 'utf8');
      for (const b of buf) bytes.push(b);
    } else {
      bytes.push(byte);
      if (cp > 0x7F) suspicious = true;
    }
  }
  if (!suspicious) return text; // No CP1252 chars at all — nothing to fix
  // Reinterpret the CP1252 byte stream as UTF-8
  return Buffer.from(bytes).toString('utf8');
}

const filesArg = process.argv.slice(2);
if (filesArg.length === 0) {
  console.error('Usage: node fix-mojibake.js <file> [<file> ...]');
  process.exit(1);
}

let changed = 0;
let unchanged = 0;
let errored = 0;
for (const f of filesArg) {
  try {
    const orig = fs.readFileSync(f, 'utf8');
    const fixed = fixMojibake(orig);
    if (fixed === orig) {
      unchanged++;
      continue;
    }
    if (fixed.includes('�')) {
      console.warn(`SKIP ${f} — round-trip produced replacement chars, not safe`);
      errored++;
      continue;
    }
    fs.writeFileSync(f, fixed, 'utf8');
    changed++;
    console.log(`fixed: ${f}`);
  } catch (e) {
    console.error(`ERROR ${f}: ${e.message}`);
    errored++;
  }
}
console.log(`\n--- ${changed} fixed, ${unchanged} unchanged, ${errored} skipped ---`);
