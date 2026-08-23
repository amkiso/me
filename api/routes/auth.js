const express = require('express');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// ---- Cấu hình Redirect & Callback ----
let rawBaseUrl = process.env.BASE_URL || 'https://hoangvux.me';
const BASE_URL = rawBaseUrl.replace(/\/+$/, '');

const REDIRECT_SUCCESS_URL = process.env.REDIRECT_SUCCESS_URL || `${BASE_URL}/admin/`;
const REDIRECT_FAILURE_URL = process.env.REDIRECT_FAILURE_URL || `${BASE_URL}/?access=denied`;

const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || `${BASE_URL}/api/auth/github/callback`;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `${BASE_URL}/api/auth/google/callback`;

const ALLOWED_ADMIN_EMAILS = [
  'hoangvu2004dl@gmail.com',
  'thangcuoi1984a@gmail.com',
  'amkiso'
];

// ---- Setup Passport GitHub Strategy ----
const githubId = process.env.GITHUB_CLIENT_ID ? process.env.GITHUB_CLIENT_ID.trim() : '';
const githubSecret = process.env.GITHUB_CLIENT_SECRET ? process.env.GITHUB_CLIENT_SECRET.trim() : '';

if (githubId && githubSecret) {
  passport.use(new GitHubStrategy({
    clientID: githubId,
    clientSecret: githubSecret,
    callbackURL: GITHUB_CALLBACK_URL,
    scope: ['user:email']
  }, (accessToken, refreshToken, profile, done) => {
    const email = profile.emails?.[0]?.value || '';
    const user = {
      id: profile.id,
      username: profile.username,
      email: email,
      displayName: profile.displayName || profile.username,
      avatar: profile.photos?.[0]?.value || '',
      provider: 'github'
    };
    done(null, user);
  }));
}

// ---- Setup Passport Google Strategy ----
const googleId = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : '';
const googleSecret = process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET.trim() : '';

if (googleId && googleSecret) {
  passport.use(new GoogleStrategy({
    clientID: googleId,
    clientSecret: googleSecret,
    callbackURL: GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email']
  }, (accessToken, refreshToken, profile, done) => {
    const email = profile.emails?.[0]?.value || '';
    const user = {
      id: profile.id,
      username: email.split('@')[0],
      email: email,
      displayName: profile.displayName || '',
      avatar: profile.photos?.[0]?.value || '',
      provider: 'google'
    };
    done(null, user);
  }));
}

// ---- GitHub Routes ----
router.get('/github', (req, res, next) => {
  if (!githubId || !githubSecret) {
    return res.status(400).send(`
      <div style="font-family:sans-serif; padding:40px; text-align:center;">
        <h2 style="color:#e11d48;">Chưa cấu hình GitHub OAuth Credentials</h2>
        <p>Vui lòng điền <b>GITHUB_CLIENT_ID</b> và <b>GITHUB_CLIENT_SECRET</b> vào file <code>api/.env</code> trên máy chủ EC2.</p>
        <br>
        <a href="/" style="color:#0ea5e9; font-weight:bold;">Quay lại trang chủ</a>
      </div>
    `);
  }
  passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});

router.get('/github/callback', (req, res, next) => {
  if (!githubId || !githubSecret) {
    return res.redirect(REDIRECT_FAILURE_URL);
  }
  passport.authenticate('github', { failureRedirect: REDIRECT_FAILURE_URL })(req, res, () => {
    handleOAuthCallback(req, res);
  });
});

// ---- Google Routes ----
router.get('/google', (req, res, next) => {
  if (!googleId || !googleSecret) {
    return res.status(400).send(`
      <div style="font-family:sans-serif; padding:40px; text-align:center;">
        <h2 style="color:#e11d48;">Chưa cấu hình Google OAuth Credentials</h2>
        <p>Vui lòng điền <b>GOOGLE_CLIENT_ID</b> và <b>GOOGLE_CLIENT_SECRET</b> vào file <code>api/.env</code> trên máy chủ EC2.</p>
        <br>
        <a href="/" style="color:#0ea5e9; font-weight:bold;">Quay lại trang chủ</a>
      </div>
    `);
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!googleId || !googleSecret) {
    return res.redirect(REDIRECT_FAILURE_URL);
  }
  passport.authenticate('google', { failureRedirect: REDIRECT_FAILURE_URL })(req, res, () => {
    handleOAuthCallback(req, res);
  });
});

// ---- Handle OAuth Callback ----
function handleOAuthCallback(req, res) {
  const user = req.user;
  if (!user) {
    return res.redirect(REDIRECT_FAILURE_URL);
  }

  const email = (user.email || '').toLowerCase().trim();
  const username = (user.username || '').toLowerCase().trim();

  const isAllowed = ALLOWED_ADMIN_EMAILS.some(adm => adm.toLowerCase() === email || adm.toLowerCase() === username);

  if (!isAllowed) {
    req.logout(() => {});
    return res.redirect(REDIRECT_FAILURE_URL);
  }

  const token = generateToken(user);
  const separator = REDIRECT_SUCCESS_URL.includes('?') ? '&' : '?';
  return res.redirect(`${REDIRECT_SUCCESS_URL}${separator}token=${token}`);
}

// ---- Verify current token ----
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(
      authHeader.substring(7),
      process.env.JWT_SECRET || 'dev-secret-change-in-production'
    );
    res.json({ user: decoded });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ---- Logout ----
router.post('/logout', (req, res) => {
  req.logout(() => {});
  res.json({ message: 'Logged out' });
});

module.exports = router;
