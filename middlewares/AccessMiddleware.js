const checkAccess = async (Model,req, res, next) => {
    try {
      const userId = req.user.userId; // Get the user ID from the request
      const data = await Model.find({ userId: userId });
  
      if (!data || data.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
      next();
    } catch (error) {
      res.status(500).json({ error: "Internal server error!" });
    }
  };
  
  module.exports = checkAccess;
  