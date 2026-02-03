import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cbjdVCQVE;OCLQ CBMASBCVICVQOFQefkbkjwebv;w';

export const authenticateToken = (req, res, next) => {
  // Try to get token from HttpOnly cookie first, then fallback to Authorization header
  const token = req.cookies?.access_token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification error:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
