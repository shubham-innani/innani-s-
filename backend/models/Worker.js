const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: { type: String, required: true }, // e.g., "G Balaji", "Watchman Balaji"
  phone: { type: String, default: '' },
  joiningDate: { type: Date, default: () => new Date('2026-08-01') },
  isActive: { type: Boolean, default: true },
  removedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Worker', workerSchema);
