const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  rollNumber: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['admin', 'student'], default: 'student' },
  department: { type: String, enum: ['COMP', 'ENTC', 'IT', 'MECH'] },
  year: { type: String, enum: ['FE', 'SE', 'TE', 'BE'] },
  joinYear: { type: Number },
  mustChangePassword: { type: Boolean, default: true },
  motherName: { type: String, default: '' },
  birthDate: { type: String, default: '' }, // DDMMYY
  bio: { type: String, default: '' },
  profilePic: { type: String, default: '' },
  college: { type: String, default: 'SINHGAD_ENGINEERING' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
