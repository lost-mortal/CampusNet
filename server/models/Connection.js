const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['collab', 'general'], default: 'general' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  // Only set for collab connections originating from a Collab post
  sourcePost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  college: { type: String, default: 'SINHGAD_ENGINEERING' },
}, { timestamps: true });

connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

module.exports = mongoose.model('Connection', connectionSchema);
