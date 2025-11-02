const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function authMiddleware(req, res, next) {
  const bearer = req.headers.authorization || '';
  const token =
    req.cookies?.token ||
    (bearer.startsWith('Bearer ') ? bearer.slice(7) : null);

  if (!token) {
    return res.status(401).json({ message: 'Brak autoryzacji' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Nieprawidłowy token' });
  }
}

module.exports = { authMiddleware, JWT_SECRET };