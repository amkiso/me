require('dotenv').config();

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/auth');
const subjectsRoutes = require('./routes/subjects');
const profileRoutes = require('./routes/profile');
const assignmentsRoutes = require('./routes/assignments');
const contactRoutes = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve uploads static folder
const uploadsStaticDir = fs.existsSync('/app/uploads')
  ? '/app/uploads'
  : path.resolve(__dirname, '..', '..', 'uploads');
app.use('/uploads', express.static(uploadsStaticDir));

// Trust proxy (behind Nginx)
app.set('trust proxy', 1);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('short'));
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session (for OAuth flow)
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/contact', contactRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`);
  console.log(`Admin users: ${process.env.ADMIN_USERS || '(none configured)'}`);
});
