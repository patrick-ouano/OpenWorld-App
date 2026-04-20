import jwt from 'jsonwebtoken';

export default function requireAuth(req, res, next) {
  // reads bearer token from authorization header
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'missing or invalid authorization header' });
  }

  try {
    // verifies token and stores user info for route - https://www.npmjs.com/package/jsonwebtoken
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    return next();
  } catch {
    return res.status(401).json({ message: 'invalid or expired token' });
  }
}
