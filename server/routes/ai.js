const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const { searchEntities } = require('../services/gemini');

// POST /api/ai/search
router.post('/search', requireAuth, async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query?.trim()) return res.status(400).json({ error: 'query is required' });
    const results = await searchEntities(query.trim());
    res.json(results);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
