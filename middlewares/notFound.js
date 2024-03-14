const path = require('path');

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404).sendFile(path.join(__dirname, '..', 'public', 'notfound.html'));
};

module.exports = notFound;
