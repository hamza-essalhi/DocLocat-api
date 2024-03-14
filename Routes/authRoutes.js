const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import your User model
const config = require('../configs/config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const History = require('../models/History');
// Middleware to verify JWT token
const verifyToken = require('../middlewares/TokenMiddleware');
const geoip = require('geoip-lite');
const ip = require('ip');
const Favorite = require('../models/Favorite');
const Appointment = require('../models/Appointment');
// Route for updating user details
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      // User not found, return not found status
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the user ID matches the request ID
    if (userId !== req.params.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update the user details
    let updatedUser = { ...req.body };

    // Check if a new password was provided
    if (req.body.password) {
      const passwordMatch = await bcrypt.compare(req.body.oldPassword, user.password);
      // Check if passwords match
    if (!passwordMatch) {
      // Passwords do not match, return unauthorized status
      return res.status(401).json({error:"Old Password Not Correct"});
    }

      const hashedPassword = await bcrypt.hash(req.body.password, parseInt(config.NUMBE)); // Using 10 salt rounds
      updatedUser.password = hashedPassword;
    }

    updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatedUser },
      { new: true }
    );

    // Check if user was updated
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Exclude sensitive data like password from response
    const { password, ...userWithoutPassword } = updatedUser.toObject();

    // Respond with updated user data
    res.status(200).json({notice:"done",user:userWithoutPassword});
  } catch (error) {
    // Handle errors
    res.status(500).json({ error: error.message });
  }
});
// Route for deleting a user
router.delete('/delete', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Delete user's appointments
    if (req.user.role =="user"){
      await Appointment.deleteMany({ userId: userId });
    }else{
      await Appointment.deleteMany({ doctorId: userId });
    }

    // Delete user's favorites
    await Favorite.deleteMany({ userId: userId });

    // Delete user's history
    await History.deleteMany({ userId: userId });

    // Find the user by ID and delete
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      // User not found, return not found status
      return res.status(404).json({ error: 'User not found' });
    }

    // Respond with success message
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    // Handle errors
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post('/register', async (req, res) => {
  try {
    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(req.body.password, parseInt(config.NUMBE));

    // Create a new user instance with the provided data
    const newUser = new User({ ...req.body,password: hashedPassword });

    // Save the new user to the database
    const savedUser = await newUser.save();

    // Respond with a success message and the saved user data
    res.status(201).json({
      user: savedUser,
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    // Find the user by email
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ error: 'Please provide username and password' });
    }
    const user = await User.findOne({ email: req.body.email });
    const userId = user.id
    
    // Check if the user exists
    if (!user) {
      // User not found, return unauthorized status
      return res.status(401).json({error:"Invalide Data"});
    }

    // Compare the provided password with the stored hashed password
    const passwordMatch = await bcrypt.compare(req.body.password, user.password);

    // Check if passwords match
    if (!passwordMatch) {
      // Passwords do not match, return unauthorized status
      return res.status(401).json();
    }
    const ipAddress = ip.address();
    const location = geoip.lookup(ip.address());

    // Passwords match, user is authenticated
    // Exclude the password from the user object
    const newHistory = new History({
      userId,
      ipAddress, 
      location: location ? location.city : 'Unknown'
    
    });
  await newHistory.save();
    let newUser;
    if (user.role == "user") {
      newUser = { ...user._doc };
      delete newUser.password;
      delete newUser.categorie;
      delete newUser.availableDate;
      delete newUser.availableHour;
    } else {
      newUser = { ...user._doc };
      delete newUser.password;
    }



    // Generate a JWT token for authentication
    const token = jwt.sign({ userId: user.id, role: user.role }, config.JWT_SECRET, {
      expiresIn: req.body.remember ? '15d' : '1d',
    });

    // Respond with success and include the token and user details
    res.status(200).json({ token, user: newUser });
  } catch (error) {
    // Internal server error, return 500 status
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
