const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '🌐' },
  profilePhoto: { type: String, default: '' },
  bannerImage: { type: String, default: '' },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  joinRequests: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  }],
  tags: [{ type: String }],
  isPrivate: { type: Boolean, default: false },
  reason: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  college: { type: String, default: 'SINHGAD_ENGINEERING' },
}, { timestamps: true });

module.exports = mongoose.model('Community', communitySchema);
