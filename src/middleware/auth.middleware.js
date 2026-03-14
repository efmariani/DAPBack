const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'Administrador') {
    return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
  }
  next();
};

const isTecnico = (req, res, next) => {
  if (req.user.role !== 'Técnico' && req.user.role !== 'Administrador') {
    return res.status(403).json({ message: 'Access denied. Technical privileges required.' });
  }
  next();
};

module.exports = { verifyToken, isAdmin, isTecnico };
