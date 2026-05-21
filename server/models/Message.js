const mongoose = require('mongoose');

// roomId is the deterministic chat-room identifier (sorted user IDs joined by '_')
const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  readAt: { type: Date },
  college: { type: String, default: 'SINHGAD_ENGINEERING' },
}, { timestamps: true });

messageSchema.index({ roomId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
