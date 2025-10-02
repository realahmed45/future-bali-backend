const jwt = require("jsonwebtoken");

module.exports = (JWT_SECRET) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          message: "Access denied. No token provided.",
        });
      }

      const decoded = jwt.verify(token, JWT_SECRET);

      // You can add user lookup here if needed
      // const user = await User.findById(decoded.userId);
      // if (!user) return res.status(401).json({ message: "Invalid token." });
      // req.user = user;

      req.user = decoded; // Attach decoded token to request
      next();
    } catch (error) {
      res.status(401).json({
        message: "Invalid token.",
        error: error.message,
      });
    }
  };
};
