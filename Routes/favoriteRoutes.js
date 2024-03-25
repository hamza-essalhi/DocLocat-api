const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const User = require("../models/User")
const checkAccess = require('../middlewares/AccessMiddleware');

// Create a new favorite
router.post('/add', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const  userId =user.id
    const {doctorId, doctorName, doctorAddress, doctorPhone} = req.body;
   
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user already has an appointment with the same doctor
    const existingFavorite = await Favorite.findOne({
      userId: userId,
      doctorId
    });

    if (existingFavorite) {
      return res.status(400).json({ error: "You already added this doctor to the favorites" });
    }
    const newFavorite = new Favorite({
        userId,
      doctorId,
      doctorName,
      doctorAddress,
      doctorPhone,

    });
    const savedFavorite = await newFavorite.save();
    res.status(201).json(savedFavorite);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});





// Get all favorites for a specific user
router.get('/all', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const  userId =user.id
    const favorites = await Favorite.find({ userId: userId }).sort({ createdAt: -1 });
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all favorites for a specific user
router.get('/user/:id', async (req, res) => {
  const id =req.params.id
  try {
    const user = await User.findById(req.user.userId);
    const  userId =user.id
    const favorites = await Favorite.find({ userId: userId,doctorId:id });
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a favorite by ID
router.delete('/id/:id', async (req, res) => {
  try {
    const userId = req.user.userId; // Get the user ID from the request
    const data = await Favorite.find({ userId: userId });

    if (!data || data.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
   
    const deletedFavorite = await Favorite.findByIdAndDelete(req.params.id);
    if (!deletedFavorite) {
      return res.status(404).json({ error: "Favorite not found" });
    }
    res.json({ message: "Favorite deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;
