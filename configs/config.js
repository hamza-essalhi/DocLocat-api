require('dotenv').config();

module.exports = {
  MONGODB_URI: process.env.MONGODB_URI,
  NUMBER:process.env.NUMBER,
  JWT_SECRET:process.env.JWT_SECRET,
  PORT:process.env.PORT
};