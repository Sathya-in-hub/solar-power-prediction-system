const jwt = require('jsonwebtoken'); // You'll need to add this to package.json

// Simple API key authentication
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  // Skip API key check in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or missing API key' 
    });
  }
  
  next();
};

// User authentication (optional - for future user accounts)
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
      req.user = { id: 'anonymous', role: 'guest' };
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    req.user = { id: 'anonymous', role: 'guest' };
    next();
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Simple IP whitelist for admin endpoints
const ipWhitelist = (req, res, next) => {
  const allowedIPs = process.env.ALLOWED_IPS?.split(',') || [];
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Skip in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
    return res.status(403).json({ message: 'Access denied from this IP' });
  }
  
  next();
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
};

module.exports = {
  validateApiKey,
  authenticateUser,
  authorize,
  ipWhitelist,
  requestLogger
};