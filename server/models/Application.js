const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  college: { type: String, default: 'SINHGAD_ENGINEERING' },
}, { timestamps: true });

applicationSchema.index({ post: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
