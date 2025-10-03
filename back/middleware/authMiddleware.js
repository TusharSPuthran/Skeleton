const jwt = require("jsonwebtoken");
const SECRETE_KEY = process.env.JWT_SECRET || "PRODUCTS";

// ✅ Middleware to protect routes
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer token

  if (!token) return res.status(401).json({ success: false, message: "No token provided" });

  jwt.verify(token, SECRETE_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, message: "Invalid or expired token" });

    req.user = decoded; // attach decoded info (includes role)
    next();
  });
};

// ✅ Role-based middleware - only allow admins
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: "Access denied. Admin privileges required." 
    });
  }
  next();
};

// ✅ Role-based middleware - only allow clients
const clientOnly = (req, res, next) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ 
      success: false, 
      message: "Access denied. Client privileges required." 
    });
  }
  next();
};

// ✅ Role-based middleware - allow both admin and client
const authenticatedOnly = (req, res, next) => {
  // This middleware just ensures the user is authenticated (any role)
  // The authMiddleware already handles token validation
  next();
};

module.exports = { 
  authMiddleware, 
  adminOnly, 
  clientOnly, 
  authenticatedOnly 
};