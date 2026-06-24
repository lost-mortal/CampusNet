const crypto = require('crypto');
const { GoogleGenerativeAI, SchemaType, TaskType } = require('@google/generative-ai');
const User = require('../models/User');
const Club = require('../models/Club');
const Community = require('../models/Community');

const EMPTY = { clubs: [], communities: [], students: [], message: '' };

function getGenAI() {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// gemini-2.5-flash-lite is the only generative model with working free-tier
// quota on this key (2.5-flash and 2.0-flash return 429/limit-0), and it's the
// fastest of them. Used as the default everywhere we call generateContent.
function getModel(modelName = 'gemini-2.5-flash-lite') {
  return getGenAI().getGenerativeModel({ model: modelName });
}

// ---------------------------------------------------------------------------
// Embedding-based semantic search (the reliable path).
//
// Why embeddings instead of asking a generative model to pick matches: the
// embedding endpoint doesn't "think", returns in ~200ms, has far higher free-
// tier limits, and never has to emit valid JSON — so retrieval succeeds ~always.
// We embed every entity ONCE (cached, re-embedded only when its text changes),
// embed the query per request, and rank locally by cosine similarity. A small
// non-thinking generative call then writes the human "reason" lines, but that
// is best-effort: if it fails we synthesize reasons and still return matches.
// ---------------------------------------------------------------------------

const EMBED_MODEL = 'gemini-embedding-001';
const EMBED_DIM = 768; // reduced from 3072 — plenty for ranking, cheaper to store/compute

// gemini-embedding-001 produces compressed cosine scores (related and unrelated
// items all sit ~0.5–0.7), so absolute floors don't separate signal from noise.
// What IS reliable is the ranking and the gap: a genuine match tops out ~0.65+
// and stands clear of the pack, while a query with no real match peaks ~0.56.
// So we select RELATIVELY: require the best score to clear MIN_TOP_SCORE (else
// it's noise → keyword fallback / no match), then keep everything within
// SCORE_GAP of the top. Both are tunable; calibrated against live embeddings.
const MIN_TOP_SCORE = 0.62;
const SCORE_GAP = 0.07;

function getEmbedModel() {
  return getGenAI().getGenerativeModel({ model: EMBED_MODEL });
}

// Run async fn over items with bounded concurrency (gemini-embedding-001 has no
// sync batch endpoint, so we fan out individual embedContent calls).
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx); }
  });
  await Promise.all(workers);
  return out;
}

async function embedText(text, taskType) {
  const res = await getEmbedModel().embedContent({
    content: { role: 'user', parts: [{ text }] },
    taskType,
    outputDimensionality: EMBED_DIM,
  });
  return res.embedding.values;
}

const embedQuery = (text) => embedText(text, TaskType.RETRIEVAL_QUERY);

// In-memory vector cache, keyed by `${type}:${id}`. The dataset is tiny (tens
// of entities) so this lives comfortably in process memory for the life of the
// server. An entity is re-embedded only when its searchable text changes — so
// only the first search after a (re)start or a data edit pays the embed cost;
// every later search only embeds the query (one fast call).
const embedCache = new Map();

const hashText = (text) => crypto.createHash('sha1').update(text).digest('hex');

// entries: [{ key, text }] -> Map<key, vector>. Embeds only new/changed entries.
async function ensureEmbeddings(entries) {
  const misses = entries.filter(e => {
    const c = embedCache.get(e.key);
    return !c || c.hash !== hashText(e.text);
  });

  await mapLimit(misses, 8, async (e) => {
    const vector = await embedText(e.text, TaskType.RETRIEVAL_DOCUMENT);
    embedCache.set(e.key, { hash: hashText(e.text), vector });
  });

  const out = new Map();
  for (const e of entries) out.set(e.key, embedCache.get(e.key).vector);
  return out;
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms)),
  ]);
}

// Best-effort relevance judgement + one-line reason for the embedding shortlist,
// via a fast generative model. Doubles as a precision filter on top of the
// embedding recall: `relevant: false` items are dropped. items: [{ id, name,
// text }] -> Map<id, { reason, relevant }>. Never throws.
const REASONS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    reasons: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          relevant: { type: SchemaType.BOOLEAN },
          reason: { type: SchemaType.STRING },
        },
        required: ['id', 'relevant', 'reason'],
      },
    },
  },
  required: ['reasons'],
};

async function generateReasons(query, items) {
  if (items.length === 0) return new Map();
  try {
    const prompt = `A student searched: "${query}".
The entities below were pre-selected by a similarity search. For each one:
- Set "relevant" to true only if it would genuinely help the student with their search; set it to false for tenuous, stretched, or off-topic matches.
- Write "reason": ONE short sentence (max 20 words) stating the concrete connection (skill, tag, focus area). When relevant is false, briefly say why it doesn't fit.

ENTITIES:
${JSON.stringify(items.map(i => ({ id: i.id, name: i.name, info: i.text })))}`;

    const model = getModel('gemini-2.5-flash-lite');
    const call = () => withTimeout(model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
        responseSchema: REASONS_SCHEMA,
      },
    }), 6000);

    // One retry — flash-lite occasionally 503s under load; a quick retry usually
    // recovers the high-quality reasons rather than dropping to synthesized ones.
    let result;
    try {
      result = await call();
    } catch (e) {
      await new Promise(r => setTimeout(r, 600));
      result = await call();
    }

    const parsed = extractJSON(result.response.text());
    const map = new Map();
    if (parsed && Array.isArray(parsed.reasons)) {
      for (const r of parsed.reasons) {
        if (r?.id && r?.reason) map.set(String(r.id), { reason: r.reason, relevant: r.relevant !== false });
      }
    }
    return map;
  } catch (err) {
    console.error('[Gemini] generateReasons failed (synthesizing instead):', err.message);
    return new Map();
  }
}

// Fallback reason when the generative call is unavailable — derived from query
// keyword overlap so it still says something concrete.
function synthReason(query, text) {
  const qTokens = [...new Set(
    query.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2 && !STOPWORDS.has(t))
  )];
  const lower = (text || '').toLowerCase();
  const hits = qTokens.filter(t => lower.includes(t));
  return hits.length
    ? `Related to "${[...new Set(hits)].join('", "')}".`
    : 'Closely related to your search.';
}

function extractJSON(text) {
  // First try direct parse on cleaned text
  const cleaned = text.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  try { return JSON.parse(cleaned); } catch {}

  // Fallback: find the first { ... } block in the response
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

// Words that carry no search signal — stripped before keyword matching so a
// query like "i want to learn blockchain" matches on "blockchain", not "want".
const STOPWORDS = new Set([
  'i', 'a', 'an', 'the', 'to', 'in', 'on', 'of', 'for', 'with', 'and', 'or',
  'am', 'is', 'are', 'be', 'want', 'wanna', 'like', 'learn', 'learning', 'study',
  'looking', 'look', 'interested', 'interest', 'find', 'finding', 'need', 'needing',
  'someone', 'anyone', 'who', 'works', 'work', 'working', 'into', 'about', 'me',
  'my', 'some', 'help', 'connect', 'know', 'knows', 'good', 'at',
]);

// Deterministic, no-API keyword search over the same data Gemini sees. This is
// the safety net: when Gemini errors (rate-limit / quota) or returns nothing,
// we still surface direct keyword hits so a query like "blockchain" never misses
// an entity literally named "Blockchain Forums". Substring match on a combined
// text blob (name weighted highest), top 5 per category, scored by hit count.
function keywordSearch(query, { clubs, communities, students }) {
  const tokens = [...new Set(
    query.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 1 && !STOPWORDS.has(t))
  )];
  if (tokens.length === 0) return EMPTY;

  const scoreText = (name, rest) => {
    const nameL = (name || '').toLowerCase();
    const restL = (rest || '').toLowerCase();
    let score = 0;
    const hits = [];
    for (const t of tokens) {
      if (nameL.includes(t)) { score += 3; hits.push(t); }
      else if (restL.includes(t)) { score += 1; hits.push(t); }
    }
    return { score, hits };
  };

  const rank = (items, toText, toResult) =>
    items
      .map(it => ({ it, ...scoreText(toText(it).name, toText(it).rest) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ it, hits }) => toResult(it, hits));

  const reasonFrom = (hits) => `Matched "${[...new Set(hits)].join('", "')}" in the campus directory.`;

  return {
    clubs: rank(
      clubs,
      c => ({ name: c.name, rest: `${c.description || ''} ${(c.tags || []).join(' ')}` }),
      (c, hits) => ({ id: String(c._id), name: c.name, reason: reasonFrom(hits) })
    ),
    communities: rank(
      communities,
      c => ({ name: c.name, rest: `${c.description || ''} ${(c.tags || []).join(' ')}` }),
      (c, hits) => ({ id: String(c._id), name: c.name, reason: reasonFrom(hits) })
    ),
    students: rank(
      students,
      s => ({ name: `${s.firstName} ${s.lastName}`, rest: `${s.bio || ''} ${(s.skills || []).join(' ')} ${s.department || ''}` }),
      (s, hits) => ({ id: String(s._id), name: `${s.firstName} ${s.lastName}`, rollNumber: s.rollNumber, reason: reasonFrom(hits) })
    ),
    message: '',
  };
}

const isEmpty = (r) => !r || (!r.clubs?.length && !r.communities?.length && !r.students?.length);

async function searchEntities(query) {
  // Fetch outside the try so the keyword fallback can use the same data even if
  // the Gemini call throws.
  let data;
  try {
    const [clubs, communities, students] = await Promise.all([
      Club.find({}, 'name description tags').lean(),
      Community.find({ status: 'approved' }, 'name description tags').lean(),
      User.find({ role: 'student' }, 'firstName lastName rollNumber department year bio skills').lean(),
    ]);
    data = { clubs, communities, students };
  } catch (err) {
    console.error('[Gemini] searchEntities DB error:', err.message);
    return EMPTY;
  }

  const { clubs, communities, students } = data;

  // Last-resort safety net: if even the embedding API is unavailable, fall back
  // to deterministic keyword matching so direct hits still surface.
  const fallback = () => {
    const kw = keywordSearch(query, data);
    if (!isEmpty(kw)) {
      kw.message = 'Showing keyword matches — semantic ranking was unavailable, so these are based on direct text matches.';
    }
    return kw;
  };

  const displayName = (e) =>
    e.type === 'student' ? `${e.entity.firstName} ${e.entity.lastName}` : e.entity.name;

  try {
    // One searchable text blob per entity (name + the fields worth matching on).
    const entries = [
      ...clubs.map(c => ({
        type: 'club', id: String(c._id), entity: c,
        text: `${c.name}. ${c.description || ''}. Tags: ${(c.tags || []).join(', ')}`,
      })),
      ...communities.map(c => ({
        type: 'community', id: String(c._id), entity: c,
        text: `${c.name}. ${c.description || ''}. Tags: ${(c.tags || []).join(', ')}`,
      })),
      ...students.map(s => ({
        type: 'student', id: String(s._id), entity: s,
        text: `${s.firstName} ${s.lastName}. ${s.bio || ''}. Skills: ${(s.skills || []).join(', ')}. ${s.department || ''} ${s.year || ''}`,
      })),
    ];
    if (entries.length === 0) return EMPTY;

    // Embed entities (cached) and the query (per request) in parallel.
    const [vectors, queryVec] = await Promise.all([
      ensureEmbeddings(entries.map(e => ({ key: `${e.type}:${e.id}`, text: e.text }))),
      embedQuery(query),
    ]);

    const scored = entries
      .map(e => ({ ...e, score: cosine(queryVec, vectors.get(`${e.type}:${e.id}`)) }))
      .sort((a, b) => b.score - a.score);

    // Best score doesn't clear the "a real match exists" bar — the query has no
    // semantic match here. Try a literal keyword pass (catches exact-name hits)
    // before reporting nothing.
    if (scored[0].score < MIN_TOP_SCORE) return fallback();

    // Keep the cluster of best matches: everything within SCORE_GAP of the top.
    const cutoff = scored[0].score - SCORE_GAP;
    const relevant = scored.filter(e => e.score >= cutoff);

    const shortlist = [
      ...relevant.filter(e => e.type === 'club').slice(0, 5),
      ...relevant.filter(e => e.type === 'community').slice(0, 5),
      ...relevant.filter(e => e.type === 'student').slice(0, 5),
    ];

    // Best-effort relevance judgement + reasons; synthesize if it fails/times out.
    const reasonMap = await generateReasons(
      query,
      shortlist.map(e => ({ id: e.id, name: displayName(e), text: e.text }))
    );
    const reasonFor = (e) => reasonMap.get(e.id)?.reason || synthReason(query, e.text);

    // Drop items the judge marked irrelevant — but never filter down to nothing
    // (if it rejects everything, fall back to the unfiltered shortlist).
    let kept = shortlist.filter(e => reasonMap.get(e.id)?.relevant !== false);
    if (kept.length === 0) kept = shortlist;

    const out = (type) => kept.filter(e => e.type === type);

    return {
      clubs: out('club').map(e => ({ id: e.id, name: e.entity.name, reason: reasonFor(e) })),
      communities: out('community').map(e => ({ id: e.id, name: e.entity.name, reason: reasonFor(e) })),
      students: out('student').map(e => ({
        id: e.id, name: displayName(e), rollNumber: e.entity.rollNumber, reason: reasonFor(e),
      })),
      // Per-item reasons carry the relevance explanation; no banner needed for
      // semantic results. (Compressed embedding scores can't reliably tell
      // "exact" from "adjacent", so we don't label it.)
      message: '',
    };
  } catch (err) {
    // Embedding API error (rate-limit / quota / network) — don't show "no
    // matches", fall back to keyword search so direct hits still surface.
    console.error('[Gemini] searchEntities embedding error:', err.message);
    return fallback();
  }
}

// Stub — Phase 2.5
async function summarizeStats(stats, prompt) {
  return null;
}

// Phase 3.4 — Club AI Insights (Gemini-powered analysis of club stats snapshot)
async function generateClubInsights(snapshot) {
  try {
    const club = snapshot.club || {};
    const prompt = `You are analyzing data for a college club. Return ONLY valid JSON, no markdown.

Club: ${club.name || ''}, Tags: ${(club.tags || []).join(', ')}, Description: ${club.description || ''}

DATA:
${JSON.stringify(snapshot)}

Return this exact JSON shape — omit any key where data is insufficient to say something non-obvious:
{
  "healthSummary": "2-3 honest sentences about overall club trajectory",
  "departmentInsights": "which dept is most/least engaged, is it expected given club focus",
  "yearInsights": "which year dominates, are freshers being reached",
  "eventInsights": "best/worst performing event, hackathon vs workshop if both exist",
  "paidVsFree": "only if club has both — revenue per head, attendance difference",
  "recruitmentFunnel": "who applies vs who gets in, any surprising patterns",
  "loyaltyInsight": "are same students returning or each event brings new people",
  "recommendations": ["specific data-driven recommendation 1", "rec 2", "rec 3"]
}
Note: recommendations must reference actual event names or dept names from the data — no generic advice. Skip any section where the data is flat, identical, or too sparse to say something meaningful.`;

    const model = getModel();
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const parsed = extractJSON(raw);
    if (!parsed) {
      console.error('[Gemini] generateClubInsights parse failed. Raw:', raw.slice(0, 500));
      return { error: 'parse_failed' };
    }
    return parsed;
  } catch (err) {
    console.error('[Gemini] generateClubInsights error:', err.message);
    return { error: err.message };
  }
}

// Admin-level community analysis. Receives pre-shaped arrays of communities
// and collab posts grouped by community; returns parsed JSON insight.
async function generateCommunityInsights({ communities, collabsByCommunity }) {
  try {
    const prompt = `You are analyzing student community activity at a college campus.
Return ONLY valid JSON, no markdown.

COMMUNITIES DATA:
${JSON.stringify(communities)}

COLLAB REQUESTS DATA:
${JSON.stringify(collabsByCommunity)}

Return this exact JSON shape:
{
  "interestMap": "2-3 sentences on dominant student interests campus-wide",
  "topicClusters": [
    { "theme": "Technology", "communities": ["name1", "name2"], "totalMembers": 0 }
  ],
  "adminSuggestions": [
    "Specific suggestion referencing actual community names and member counts"
  ],
  "underservedInterests": "communities with high engagement but no official club equivalent"
}`;

    const model = getModel();
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const parsed = extractJSON(raw);
    if (!parsed) {
      console.error('[Gemini] generateCommunityInsights parse failed. Raw:', raw.slice(0, 500));
      return { error: 'parse_failed' };
    }
    return parsed;
  } catch (err) {
    console.error('[Gemini] generateCommunityInsights error:', err.message);
    return { error: err.message };
  }
}

module.exports = { searchEntities, summarizeStats, generateClubInsights, generateCommunityInsights };
