const mongoose = require('mongoose');

const clubInsightSchema = new mongoose.Schema({
  clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true, unique: true, index: true },
  generatedAt: { type: Date, default: Date.now },
  statsSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
  insightText: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('ClubInsight', clubInsightSchema);
