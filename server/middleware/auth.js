const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const SECRET_KEY = process.env.JWT_SECRET || 'blood_bank_secret_key_2024';

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET_KEY,
    { expiresIn: '24h' }
  );
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : null;

  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录，请先登录' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
  }
};

module.exports = {
  generateToken,
  authMiddleware,
  SECRET_KEY
};
