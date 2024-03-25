const jwt = require('jsonwebtoken');
const config = require('../configs/config');
const path = require('path');

// Function to verify a JWT token for Socket.IO connections
const verifySocketToken = (socket, next) => {
  const token = socket.handshake.headers.authorization;

  if (!token) {
    // If token is not provided, return 401 Unauthorized with notfound.html page
    return next(new Error('Authentication error: Token not provided'));
  }

  const tokenBearer = token.split(' ')[1];

  try {
    const decoded = jwt.verify(tokenBearer, config.JWT_SECRET);
    socket.user = decoded; // Attach user information to the socket object for future use
    next();
  } catch (error) {
    // If token is invalid, return 401 Unauthorized with notfound.html page
    
    const notFoundPage = path.join(__dirname, '..', 'public', 'notfound.html');
    return next({ status: 401, message: 'Authentication error: Invalid token', notFoundPage });
  }
};

module.exports = verifySocketToken;
