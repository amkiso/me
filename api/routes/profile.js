const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '..', 'data', 'profile.json');
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

// Ensure data directory and file exist
function getProfileData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading profile.json:', e.message);
  }
  // Fallback to src/data/profile.json if available
  const srcData = path.join(__dirname, '..', '..', 'src', 'data', 'profile.json');
  if (fs.existsSync(srcData)) {
    try {
      const raw = fs.readFileSync(srcData, 'utf-8');
      const data = JSON.parse(raw);
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
      return data;
    } catch {}
  }
  return {};
}

function writeProfileData(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Multer storage for avatar
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `avatar_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, webp, gif, svg)'));
    }
  }
});

// GET /api/profile - Public
router.get('/', (req, res) => {
  const profile = getProfileData();
  res.json(profile);
});

// PUT /api/profile - Admin only
router.put('/', verifyToken, requireAdmin, (req, res) => {
  const current = getProfileData();
  const updated = {
    ...current,
    ...req.body
  };
  writeProfileData(updated);
  res.json(updated);
});

// POST /api/profile/avatar - Admin only
router.post('/avatar', verifyToken, requireAdmin, upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Chưa chọn file ảnh' });
  }

  const avatarUrl = `/uploads/${req.file.filename}`;
  const profile = getProfileData();
  profile.avatar_url = avatarUrl;
  writeProfileData(profile);

  res.json({ message: 'Đã tải lên ảnh đại diện thành công', avatar_url: avatarUrl });
});

module.exports = router;
