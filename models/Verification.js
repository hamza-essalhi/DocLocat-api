const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../configs/config');

const verificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type:{
    type: String,
    enum: ['password', 'email'],
    default: 'email'
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600, // Token expires in 1 hour (3600 seconds)
  },
});



const Verification = mongoose.model('Verification', verificationSchema);

module.exports = Verification;
