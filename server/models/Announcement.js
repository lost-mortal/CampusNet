const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetDepartments: [{ type: String, enum: ['COMP', 'ENTC', 'IT', 'MECH', 'ALL'] }],
  targetYears: [{ type: String, enum: ['FE', 'SE', 'TE', 'BE', 'ALL'] }],
  college: { type: String, default: 'SINHGAD_ENGINEERING' },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
