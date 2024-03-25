require('dotenv').config();

module.exports = {
  MONGODB_URI: process.env.MONGODB_URI,
  NUMBER:process.env.NUMBER,
  JWT_SECRET:process.env.JWT_SECRET,
  PORT:process.env.PORT,
  EMAIL_AUTH:process.env.EMAIL_AUTH,
  EMAIL:process.env.EMAIL,
  REACT_URL:process.env.REACT_URL,
  SESSION_KEY:process.env.SESSION_KEY
};