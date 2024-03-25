const User = require('../models/User');
const express = require('express');
const router = express.Router();

// Get all doctors
router.get('/all', async (req, res) => {
  try {
    // Use projection to exclude the password field
    const doctors = await User.find({ role: 'doctor' }, { password: 0 }).sort({ createdAt: -1 });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get doctor by ID
router.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Search doctors based on criteria
router.get('/search', async (req, res) => {
  try {
    const { name, city, category } = req.query;

    let query = { role: 'doctor' };

    // Add search criteria if provided
    if (name) {
      query = { ...query, $or: [{ firstName: { $regex: name, $options: 'i' } }, { lastName: { $regex: name, $options: 'i' } }] };
    }
    if (city) {
      query = { ...query, city: { $regex: city, $options: 'i' } };
    }
    if (category) {
      query = { ...query, category: { $regex: category, $options: 'i' } };
    }

    const doctors = await User.find(query, { password: 0 }).sort({ createdAt: -1 });

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
