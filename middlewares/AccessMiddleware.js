const checkAccess = async (req, res, next, Model) => {
    try {
      const userId = req.user.userId; // Get the user ID from the request
      const data = await Model.find({ userId: userId });
  
      if (!data || data.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
  
      req.accessData = data; // Add the data to the request for further processing
      next();
    } catch (error) {
      res.status(500).json({ error: "Internal server error 12" });
    }
  };
  
  module.exports = checkAccess;
  