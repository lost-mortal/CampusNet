const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  registrant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
  // Optional: not generated for paid events until payment is approved by a club member
  ticketId: { type: String, unique: true, sparse: true },
  attended: { type: Boolean, default: false },
  attendedAt: { type: Date },
  // free  — free event, ticket issued immediately
  // pending_verification — paid event, awaiting club approval; no ticket yet
  // approved — paid event, payment approved by club; ticket issued
  paymentStatus: {
    type: String,
    enum: ['free', 'pending_verification', 'approved'],
    default: 'free',
  },
  paymentScreenshot: { type: String, default: '' },
  college: { type: String, default: 'SINHGAD_ENGINEERING' },
}, { timestamps: true });

registrationSchema.index({ post: 1, registrant: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
