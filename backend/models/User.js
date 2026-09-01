const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'worker'], required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', default: null },
  lastChangeDate: { type: String, default: '' },
  dailyChangeCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
