import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Express middleware that authenticates requests using a Bearer token
 * or an HttpOnly cookie named `jwt`.
 * On success `req.user` is populated with the decoded token payload.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function authMiddleware(req, res, next) {
  let token = null;
  const auth = req.headers['authorization'];
  if (auth) {
    const parts = auth.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token && req.headers && req.headers.cookie) {
    const cookieHeader = req.headers.cookie;
    const jwtCookie = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('jwt='));
    if (jwtCookie) token = decodeURIComponent(jwtCookie.split('=')[1]);
  }

  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export default authMiddleware;
