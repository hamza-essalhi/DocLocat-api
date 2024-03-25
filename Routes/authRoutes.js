const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import your User model
const config = require('../configs/config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer")
const { v4: uuidv4 } = require("uuid")
const History = require('../models/History');
// Middleware to verify JWT token
const verifyToken = require('../middlewares/TokenMiddleware');
const geoip = require('geoip-lite');
const ip = require('ip');
const Favorite = require('../models/Favorite');
const Appointment = require('../models/Appointment');
const Verification = require('../models/Verification');
const rateLimit = require("express-rate-limit");

// Define your dynamic max value (e.g., from a configuration)


// Create a rate limiter using the dynamic max value
const limiter = (maxRequestsPerWindow) => {
  return rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes in milliseconds
    max: maxRequestsPerWindow, // limit each IP to maxRequestsPerWindow requests per windowMs
    message: `Too many requests from this IP, please try again later. Max limit: ${maxRequestsPerWindow}`,
  });
};


let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.EMAIL,
    pass: config.EMAIL_AUTH
  }
})


const verificationEmailSender = async ({ type, id, email, name, verificationLink, verificationToken, subject, message }, res) => {
  try {
    const mailOptions = {
      from: config.EMAIL,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; font-size: 24px; margin:20px;">${subject}</h2>
          <p style="color: #666; font-size: 16px; margin:20px;">
            Hello ${name},Please click the following link to ${message}:
            <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;margin:20px;">${message}</a>
          </p>
          <p style="color: #999; font-size: 14px;">If the above button doesn't work, you can also click <a href="${verificationLink}" style="color: #007bff; text-decoration: none;">here</a> ${message}.</p>
          <p style="color: #999; font-size: 14px;">This link will expire in 1 hour.</p>
        </div>
      `,
    };

    // Check if there is an existing verification for the email and type
    const oldVerification = await Verification.findOne({ userId: id, type: type });
    const hashedVerificationToken = await bcrypt.hash(verificationToken, parseInt(config.NUMBE));
    if (oldVerification) {
      // Update the existing verification
      await oldVerification.updateOne({
        token: hashedVerificationToken,
        createdAt: Date.now()
      });
    } else {
      // Create a new verification if none exists
      const newVerification = new Verification({
        userId: id,
        token: hashedVerificationToken,
        type: type
      });
      await newVerification.save();
    }

    // Send the email
    await transporter.sendMail(mailOptions);

    // Send success response

  } catch (err) {
    // Send error response
    res.status(500).json({ error: err.message });
  }
};


router.post('/register',limiter(6) ,async (req, res) => {
 
  try {
    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(req.body.password, parseInt(config.NUMBE));

    // Create a new user instance with the provided data
    const newUser = new User({ ...req.body, password: hashedPassword });

    // Save the new user to the database
    const savedUser = await newUser.save();
    // Send verification email
    const verificationToken = uuidv4() + savedUser.id;
    const verificationLink = `${config.REACT_URL}/verification/${savedUser.id}/${verificationToken}`;
    verificationEmailSender(
      {
        type: "email",
        id: savedUser.id,
        email: savedUser.email,
        name: `${savedUser.firstName} ${savedUser.lastName}`,
        verificationLink: verificationLink,
        verificationToken: verificationToken,
        subject: "Email Verification",
        message: "verify your email"
      }, res)

    await savedUser.save();
    // Respond with a success message and the saved user data
    res.status(201).json({
      user: savedUser,
      message: 'User registered successfully. Please check your email for verification.',
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({ error: error.message });
  }
});

router.post('/login',limiter(5), async (req, res) => {
  
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
      return res.status(401).json({ error: "Invalid Data" });
    }

    // Check if the user is verified
    if (!user.verified) {
      return res.status(404).json({ error: 'User is not verified. Please check your email for verification.Or request a new verification', emailVerification: true });
    }

    // Compare the provided password with the stored hashed password
    const passwordMatch = await bcrypt.compare(req.body.password, user.password);

    // Check if passwords match
    if (!passwordMatch) {
      // Passwords do not match, return unauthorized status
      return res.status(401).json({ error: "Invalid Data" });
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
      delete newUser.category;
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
        return res.status(401).json({ error: "Old Password Not Correct" });
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
    res.status(200).json({ notice: "done", user: userWithoutPassword });
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
    if (req.user.role == "user") {
      await Appointment.deleteMany({ userId: userId });
    } else {
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

router.post('/verification/',limiter(3), async (req, res) => {
  try {
    const { id, token } = req.body;

    // Find the verification document
    const verification = await Verification.findOne({ userId: id, type: "email" });
  
    
    if (!verification) {
      return res.status(404).json({ error: 'Invalid verification token' });
    }

    // Compare the hashed token from the request with the hashed token stored in the Verification document
    const tokenMatch = await bcrypt.compare(token, verification.token);

    if (!verification || !tokenMatch) {
      // If verification document or token doesn't match, return error
      return res.status(404).json({ error: 'Invalid verification token' });
    }

    // Check if the verification token has expired
    const currentTime = new Date();
    if (verification.createdAt.getTime() + 3600 * 1000 < currentTime.getTime()) {
      // Token has expired, delete the verification document
      await Verification.deleteOne({ _id: verification._id });
      return res.status(400).json({ error: 'Verification token has expired' });
    }

    

    // Verification token is valid, mark the user as verified
    await User.findByIdAndUpdate(id, { verified: true }, { new: true });

    // Delete the verification document from the database
    await Verification.deleteOne({ _id: verification._id });

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/reset-password',limiter(3), async (req, res) => {
  try {
    const { id, token, password } = req.body;

    // Find the verification document
    const verification = await Verification.findOne({ userId: id, type: "password" });

    if (!verification) {
      return res.status(404).json({ error: 'Invalid verification token' });
    }

    // Compare the hashed token from the request with the hashed token stored in the Verification document
    const tokenMatch = await bcrypt.compare(token, verification.token);

    if (!verification || !tokenMatch) {
      // If verification document or token doesn't match, return error
      return res.status(404).json({ error: 'Invalid verification token' });
    }

    // Check if the verification token has expired
    const currentTime = new Date();
    if (verification.createdAt.getTime() + 3600 * 1000 < currentTime.getTime()) {
      // Token has expired, delete the verification document
      await Verification.deleteOne({ _id: verification._id });
      return res.status(400).json({ error: 'Verification token has expired' });
    }

 
    const hashedPassword = await bcrypt.hash(password, parseInt(config.NUMBE));

    // Verification token is valid, mark the user as verified
    await User.findByIdAndUpdate(id, { password: hashedPassword }, { new: true });

    // Delete the verification document from the database
    await Verification.deleteOne({ _id: verification._id });

    res.status(200).json({ message: 'Your password has been changed successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/send-password-verification', limiter(3), async (req, res) => {
  try {
    const { email } = req.body;

    // Find the verification document
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ error: 'This user not exist' });
    }
    if (!user.verified) {
      return res.status(404).json({ error: 'User is not verified. Please check your email for verification.Or request a new verification', emailVerification: true });
    }
    const verificationToken = uuidv4() + user.id;
  
    
    const verificationLink = `${config.REACT_URL}/reset-password/${user.id}/${verificationToken}`;
    verificationEmailSender(
      {
        type: "password",
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        verificationLink: verificationLink,
        verificationToken: verificationToken,
        subject: "Change or reset your password",
        message: "Change or reset your password"
      }, res)

    res.status(201).json({
      message: 'Password reset link has been sent to your email. Please check your email to change or reset your password.',
    });


  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.post('/send-email-verification', limiter(3), async (req, res) => {
  try {
    const { email } = req.body;
    // Find the verification document
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ error: 'This user not exist' });
    }
    if (user.verified) {
      return res.status(404).json({ error: 'This user earldy verified' });
    }
    const verificationToken = uuidv4() + user.id;
    const verificationLink = `${config.REACT_URL}/verification/${user.id}/${verificationToken}`;
    verificationEmailSender(
      {
        type: "email",
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        verificationLink: verificationLink,
        verificationToken: verificationToken,
        subject: "Email Verification",
        message: "verify your email"
      }, res)

    res.status(201).json({
      message: 'Verification link has been sent to your email. Please check your email for verification.',
    });


  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });

  }
});
module.exports = router;
