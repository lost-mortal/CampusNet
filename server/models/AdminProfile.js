const mongoose = require('mongoose');

// Singleton — one document per college. Identified by `scope` so we could
// later split per-college without schema changes.
const adminProfileSchema = new mongoose.Schema({
  scope: { type: String, default: 'campus', unique: true, index: true },
  name: { type: String, default: 'Campus Admin' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  designation: { type: String, default: 'Campus Administrator' },
  bio: { type: String, default: '' },
  college: { type: String, default: 'SINHGAD_ENGINEERING' },
}, { timestamps: true });

module.exports = mongoose.model('AdminProfile', adminProfileSchema);
