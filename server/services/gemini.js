const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const Club = require('../models/Club');
const Community = require('../models/Community');

const EMPTY = { clubs: [], communities: [], students: [] };

function getModel() {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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

async function searchEntities(query) {
  try {
    const [clubs, communities, students] = await Promise.all([
      Club.find({}, 'name description tags').lean(),
      Community.find({ status: 'approved' }, 'name description tags').lean(),
      User.find({ role: 'student' }, 'firstName lastName rollNumber department year bio skills').lean(),
    ]);

    const context = JSON.stringify({
      clubs: clubs.map(c => ({ id: c._id, name: c.name, description: c.description, tags: c.tags })),
      communities: communities.map(c => ({ id: c._id, name: c.name, description: c.description, tags: c.tags })),
      students: students.map(s => ({
        id: s._id,
        name: `${s.firstName} ${s.lastName}`,
        rollNumber: s.rollNumber,
        department: s.department,
        year: s.year,
        bio: s.bio || '',
        skills: s.skills || [],
      })),
    });

    const prompt = `You are a campus search engine for Sinhgad Engineering College.
Given this campus data: ${context}

Find the best matches for the student's query: "${query}"

Return ONLY a raw JSON object — no markdown, no backticks, no explanation — in this exact shape:
{"clubs":[{"id":"...","name":"...","reason":"..."}],"communities":[{"id":"...","name":"...","reason":"..."}],"students":[{"id":"...","name":"...","rollNumber":"...","reason":"..."}]}

Rules:
- Only use IDs and names from the provided data. Never invent entities.
- Each "reason" must be one sentence explaining why this entity matches the query, referencing the matching skill/bio detail when possible.
- Match students by their bio AND skills array — a student knowing the relevant tech, having related experience, or running a related club/community is a good match.
- Always try to return at least 2-3 student matches when any student's bio or skills relate to the query, even loosely. Students are the most valuable matches for collaboration queries.
- Return at most 5 per category. Return an empty array [] only if literally nothing in that category relates to the query.`;

    const model = getModel();
    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    const parsed = extractJSON(raw);
    if (!parsed) {
      console.error('[Gemini] Failed to parse response. Raw:', raw.slice(0, 500));
      return EMPTY;
    }

    return {
      clubs: Array.isArray(parsed.clubs) ? parsed.clubs : [],
      communities: Array.isArray(parsed.communities) ? parsed.communities : [],
      students: Array.isArray(parsed.students) ? parsed.students : [],
    };
  } catch (err) {
    console.error('[Gemini] searchEntities error:', err.message);
    return EMPTY;
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
