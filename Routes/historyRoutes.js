const express = require('express');
const router = express.Router();
const History = require('../models/History');
const checkAccess = require('../middlewares/AccessMiddleware');
const User = require("../models/User")

// Create a new history entry


// Get all history entries
router.get('/all', async (req, res) => {
  try {
   
    const user = await User.findById(req.user.userId);
    const  userId =user.id
   
    const historyEntries = await History.find({userId:userId});
    res.json(historyEntries);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete all history entries

router.delete('/clear', async (req, res) => {

  try {
    const userId = req.user.userId; // Get the user ID from the request
      const data = await History.find({ userId: userId });
  
      if (!data || data.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
  
    await History.deleteMany({ userId: userId });

    res.json({ message: "All history entries deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error!" });
  }
});

module.exports = router;
