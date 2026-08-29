const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: { type: String, required: true }, // e.g., "G Balaji", "Watchman Balaji"
  phone: { type: String, default: '' },
  joiningDate: { type: Date, default: () => new Date('2026-08-01') },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Worker', workerSchema);
