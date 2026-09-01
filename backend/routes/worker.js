const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Worker = require('../models/Worker');
const { protect, adminOnly } = require('../middleware/auth');

// @route GET /api/workers
// @desc Get all workers (active and archived)
router.get('/', protect, async (req, res) => {
  try {
    const workers = await Worker.find().sort({ isActive: -1, createdAt: -1 });
    res.json(workers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route POST /api/workers
// @desc Add a new worker and their user account
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, title, username, password, phone, joiningDate } = req.body;

    // Check if username exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create worker
    const worker = await Worker.create({
      name,
      title,
      phone: phone || '',
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      isActive: true,
      removedAt: null
    });

    // Create user account
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await User.create({
      name,
      username,
      passwordHash,
      role: 'worker',
      workerId: worker._id
    });

    res.status(201).json(worker);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route PUT /api/workers/:id
// @desc Update worker details
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, title, phone, joiningDate, isActive } = req.body;
    
    // We only update isActive here if provided. 
    // removedAt is explicitly handled by the delete/restore routes.
    const updateData = { name, title, phone, joiningDate };
    if (isActive !== undefined) updateData.isActive = isActive;

    const worker = await Worker.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    );
    
    if (!worker) return res.status(404).json({ message: 'Worker not found' });
    
    // Also update User name if worker name changed
    await User.findOneAndUpdate({ workerId: req.params.id }, { name });
    
    res.json(worker);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route DELETE /api/workers/:id
// @desc Soft delete worker
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(
      req.params.id, 
      { isActive: false, removedAt: new Date() }, 
      { new: true }
    );
    if (!worker) return res.status(404).json({ message: 'Worker not found' });
    res.json({ message: 'Worker deactivated', worker });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route POST /api/workers/:id/restore
// @desc Restore soft deleted worker
router.post('/:id/restore', protect, adminOnly, async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(
      req.params.id, 
      { isActive: true, removedAt: null }, 
      { new: true }
    );
    if (!worker) return res.status(404).json({ message: 'Worker not found' });
    res.json({ message: 'Worker restored', worker });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
