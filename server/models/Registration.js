const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  registrant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ticketId: { type: String, unique: true, required: true },
  attended: { type: Boolean, default: false },
  attendedAt: { type: Date },
  paymentStatus: { type: String, enum: ['free', 'pending', 'paid'], default: 'free' },
  college: { type: String, default: 'SINHGAD_ENGINEERING' },
}, { timestamps: true });

registrationSchema.index({ post: 1, registrant: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
