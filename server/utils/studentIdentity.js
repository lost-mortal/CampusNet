// Single source of truth for the student email scheme + fake contact data.
//
// Email format: firstname.<5-letter-code><joinYY>@sinhgad.edu  (e.g. arjun.sharm25)
// The 5-letter code is GENERATED (not derived from the name) so it resembles the
// arbitrary mail-IDs the college already issues. Two generators share this format:
//   - uniqueEmail()        random codes — used by the CSV import "generate" mode
//   - deterministicEmail() reproducible codes seeded from the roll number — used by
//                          the migration script + seed files, so a dry-run preview
//                          matches exactly what --commit writes and the seeds match DB.

const crypto = require('crypto');

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

function randomCode(len = 5) {
  let s = '';
  for (let i = 0; i < len; i++) s += LETTERS[Math.floor(Math.random() * 26)];
  return s;
}

// Deterministic 5-letter code from a seed string. `attempt` perturbs the hash so
// callers can retry on the (astronomically unlikely) email collision.
function codeFromSeed(seed, attempt = 0, len = 5) {
  const hash = crypto.createHash('sha256').update(`${seed}#${attempt}`).digest();
  let s = '';
  for (let i = 0; i < len; i++) s += LETTERS[hash[i] % 26];
  return s;
}

function joinYY(joinYear) {
  return String(((Number(joinYear) % 100) + 100) % 100).padStart(2, '0');
}

function parseJoinYear(rollNumber) {
  const m = String(rollNumber || '').match(/(\d{4})/);
  return m ? parseInt(m[1], 10) : new Date().getFullYear();
}

function buildEmail(firstName, code, joinYear) {
  return `${String(firstName).toLowerCase()}.${code}${joinYY(joinYear)}@sinhgad.edu`;
}

// Random unique email for CSV import "generate" mode. takenSet holds lowercased
// emails already in use (DB + current batch); mutated as new emails are claimed.
function uniqueEmail(firstName, joinYear, takenSet) {
  let email;
  do {
    email = buildEmail(firstName, randomCode(), joinYear);
  } while (takenSet.has(email.toLowerCase()));
  takenSet.add(email.toLowerCase());
  return email;
}

// Reproducible unique email for the migration + seeds (same input → same output).
function deterministicEmail(firstName, joinYear, seed, takenSet) {
  let email, attempt = 0;
  do {
    email = buildEmail(firstName, codeFromSeed(seed, attempt), joinYear);
    attempt++;
  } while (takenSet.has(email.toLowerCase()));
  takenSet.add(email.toLowerCase());
  return email;
}

// Deterministic, realistic-looking Indian mobile number (10 digits, starts 6-9).
function fakePhone(seed) {
  const hash = crypto.createHash('sha256').update(`phone#${seed}`).digest();
  const first = 6 + (hash[0] % 4); // 6,7,8,9
  let rest = '';
  for (let i = 1; i <= 9; i++) rest += String(hash[i] % 10);
  const digits = `${first}${rest}`; // 10 digits
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

module.exports = {
  randomCode,
  codeFromSeed,
  buildEmail,
  parseJoinYear,
  uniqueEmail,
  deterministicEmail,
  fakePhone,
};
