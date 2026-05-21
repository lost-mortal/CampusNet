const mongoose = require('mongoose');

// Single global doc — campus-wide community analysis. We keep it as a regular
// collection (not a singleton) because a `scope` field could later be used to
// store per-department or per-college reports.
const communityInsightSchema = new mongoose.Schema({
  scope: { type: String, default: 'campus', unique: true, index: true },
  generatedAt: { type: Date, default: Date.now },
  insightText: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('CommunityInsight', communityInsightSchema);
