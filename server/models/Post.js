const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  type: { type: String, enum: ['Recruitment', 'Event', 'General', 'Collab'], required: true },
  title: { type: String, required: true },
  body: { type: String, default: '' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
  tag: { type: String, enum: ['Technical', 'Cultural', 'Sports', 'Recruitment', 'Creative', 'Other'] },
  // Recruitment: only one active per club at a time
  isActive: { type: Boolean, default: true },
  // Event fields
  eventDate: { type: Date },
  venue: { type: String, default: '' },
  image: { type: String, default: '' },
  paymentConfig: {
    enabled: { type: Boolean, default: false },
    recipient: { upiId: String, name: String },
    amount: { type: Number, default: 0 },
  },
  college: { type: String, default: 'SINHGAD_ENGINEERING' },
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
