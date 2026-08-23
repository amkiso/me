const express = require('express');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { generateToken } = require('../middleware/auth');

const router = express.Router();
const BASE_URL = process.env.BASE_URL || 'http://localhost';
const ALLOWED_ADMIN_EMAILS = [
  'hoangvu2004dl@gmail.com',
  'thangcuoi1984a@gmail.com',
  'amkiso'
];

// ---- GitHub OAuth Strategy ----
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${BASE_URL}/api/auth/github/callback`,
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

  router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

  router.get('/github/callback',
    passport.authenticate('github', { failureRedirect: '/' }),
    (req, res) => {
      handleOAuthCallback(req, res);
    }
  );
}

// ---- Google OAuth Strategy ----
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${BASE_URL}/api/auth/google/callback`,
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

  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
      handleOAuthCallback(req, res);
    }
  );
}

// ---- Handle OAuth callback ----
function handleOAuthCallback(req, res) {
  const user = req.user;
  const email = (user.email || '').toLowerCase().trim();
  const username = (user.username || '').toLowerCase().trim();

  const isAllowed = ALLOWED_ADMIN_EMAILS.some(adm => adm.toLowerCase() === email || adm.toLowerCase() === username);

  if (!isAllowed) {
    req.logout(() => {});
    return res.redirect('/?access=denied');
  }

  const token = generateToken(user);
  res.redirect(`/admin/?token=${token}`);
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
