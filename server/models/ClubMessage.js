const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  club:    { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  channel: { type: String, required: true },
  author:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body:    { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('ClubMessage', schema);
