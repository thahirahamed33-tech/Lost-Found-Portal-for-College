const db = require('../db/database');

// User Auth Middleware
const auth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Admin Auth Middleware
const adminOnly = (req, res, next) => {
  if (req.session.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access forbidden' });
  }
};

module.exports = { auth, adminOnly };

