const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const ADMIN_USERS = (process.env.ADMIN_USERS || '').split(',').map(u => u.trim().toLowerCase());

/**
 * Verify JWT token from Authorization header or cookie
 */
function verifyToken(req, res, next) {
  let token = null;

  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // Check cookie fallback
  if (!token && req.cookies) {
    token = req.cookies.auth_token;
  }

  // Check query param fallback (for OAuth callback redirect)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Chưa đăng nhập', code: 'NO_TOKEN' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn', code: 'INVALID_TOKEN' });
  }
}

/**
 * Check if the authenticated user is an admin
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Chưa đăng nhập', code: 'NO_USER' });
  }

  const username = (req.user.username || '').toLowerCase();
  const email = (req.user.email || '').toLowerCase();

  const isAdmin = ADMIN_USERS.includes(username) || ADMIN_USERS.includes(email);

  if (!isAdmin) {
    return res.status(403).json({
      error: 'Bạn không có quyền truy cập quản trị',
      code: 'FORBIDDEN',
      user: { username, email }
    });
  }

  next();
}

/**
 * Generate JWT token for a user
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      provider: user.provider
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { verifyToken, requireAdmin, generateToken };
