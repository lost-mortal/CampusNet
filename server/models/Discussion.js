const mongoose = require('mongoose');

// Embedded comment shape — Discussion threads are read-only in this phase,
// so comments are seeded inline rather than referenced via a separate collection.
const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorName: { type: String, default: '' }, // fallback for seed data
  body: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const discussionSchema = new mongoose.Schema({
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorName: { type: String, default: '' },
  title: { type: String, required: true },
  body: { type: String, required: true },
  upvotes: { type: Number, default: 0 },
  comments: [commentSchema],
  college: { type: String, default: 'SINHGAD_ENGINEERING' },
}, { timestamps: true });

module.exports = mongoose.model('Discussion', discussionSchema);
