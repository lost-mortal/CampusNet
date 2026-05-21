const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  tags: [{ type: String, enum: ['Technical', 'Cultural', 'Sports', 'Recruitment', 'Creative', 'Other'] }],
  president: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  logoUrl: { type: String, default: '' },
  logoEmoji: { type: String, default: '🏆' },
  profilePhoto: { type: String, default: '' },
  bannerImage: { type: String, default: '' },
  college: { type: String, default: 'SINHGAD_ENGINEERING' },
  channels: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Club', clubSchema);
