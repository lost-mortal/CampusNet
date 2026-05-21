const mongoose = require('mongoose');

// Announcements channel posts. Only the community manager can create.
const communityAnnouncementSchema = new mongoose.Schema({
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  college: { type: String, default: 'SINHGAD_ENGINEERING' },
}, { timestamps: true });

module.exports = mongoose.model('CommunityAnnouncement', communityAnnouncementSchema);
