const mongoose = require('mongoose');

// General-channel group chat. Polled every 3s by the frontend (not real-time).
const communityMessageSchema = new mongoose.Schema({
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  college: { type: String, default: 'SINHGAD_ENGINEERING' },
}, { timestamps: true });

communityMessageSchema.index({ community: 1, createdAt: 1 });

module.exports = mongoose.model('CommunityMessage', communityMessageSchema);
