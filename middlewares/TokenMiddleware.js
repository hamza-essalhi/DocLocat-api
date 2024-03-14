const jwt = require('jsonwebtoken');
const config = require('../configs/config');
const path = require('path');

// Middleware to check for a valid JWT token
const verifyToken = (req, res, next) => {
  const header = req.headers.token;
  if (!header) {
    return res.status(401).sendFile(path.join(__dirname, 'notfound.html'));
  } else {
    const token = header.split(' ')[1]
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).sendFile(path.join(__dirname, 'notfound.html'));
    }
  }
};

module.exports = verifyToken;