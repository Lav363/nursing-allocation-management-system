const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: 'Access Denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hospital_nursing_jwt_secret_token_key_2026');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
  }
};

const isNurse = (req, res, next) => {
  if (req.user && req.user.role === 'nurse') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Nurse privileges required.' });
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  isNurse
};
