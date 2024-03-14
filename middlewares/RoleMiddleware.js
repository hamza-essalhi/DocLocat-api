const adminAccess = async (req, res, Model) => {
    try {
      // Check if the user has the necessary role for access
      if (req.user.role !== 'user' || req.user.role !== 'doctor') {
        return res.status(403).json({ error: 'Access denied' });
      }
      next();
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  };
  
  module.exports = adminAccess;
  