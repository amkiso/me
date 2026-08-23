const express = require('express');
const fs = require('fs');
const path = require('path');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '..', 'data', 'subjects.json');

// Helper: read JSON file
function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Helper: write JSON file
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
  const srcData = path.join(__dirname, '..', '..', 'src', 'data', 'subjects.json');
  if (fs.existsSync(srcData)) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.copyFileSync(srcData, DATA_FILE);
  } else {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    writeData([]);
  }
}

// ---- GET /api/subjects - Public ----
router.get('/', (req, res) => {
  const subjects = readData();
  res.json(subjects);
});

// ---- GET /api/subjects/:id - Public ----
router.get('/:id', (req, res) => {
  const subjects = readData();
  const subject = subjects.find(s => s.id === req.params.id);
  if (!subject) return res.status(404).json({ error: 'Không tìm thấy môn học' });
  res.json(subject);
});

// ---- POST /api/subjects - Admin only ----
router.post('/', verifyToken, requireAdmin, (req, res) => {
  const subjects = readData();
  const { id, name, semester, description, icon, color, assignments } = req.body;

  if (!id || !name) {
    return res.status(400).json({ error: 'Thiếu trường bắt buộc: id, name' });
  }

  if (subjects.find(s => s.id === id)) {
    return res.status(409).json({ error: 'Môn học với ID này đã tồn tại' });
  }

  const newSubject = {
    id: id.toLowerCase().replace(/\s+/g, '-'),
    name,
    semester: semester || '',
    description: description || '',
    icon: icon || 'default',
    color: color || 'from-sky-500 to-blue-600',
    assignments: assignments || []
  };

  subjects.push(newSubject);
  writeData(subjects);
  res.status(201).json(newSubject);
});

// ---- PUT /api/subjects/:id - Admin only ----
router.put('/:id', verifyToken, requireAdmin, (req, res) => {
  const subjects = readData();
  const index = subjects.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Không tìm thấy môn học' });

  const { name, semester, description, icon, color, assignments } = req.body;
  subjects[index] = {
    ...subjects[index],
    ...(name !== undefined && { name }),
    ...(semester !== undefined && { semester }),
    ...(description !== undefined && { description }),
    ...(icon !== undefined && { icon }),
    ...(color !== undefined && { color }),
    ...(assignments !== undefined && { assignments })
  };

  writeData(subjects);
  res.json(subjects[index]);
});

// ---- DELETE /api/subjects/:id - Admin only ----
router.delete('/:id', verifyToken, requireAdmin, (req, res) => {
  let subjects = readData();
  const index = subjects.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Không tìm thấy môn học' });

  const subjectId = req.params.id;
  const deleted = subjects.splice(index, 1)[0];
  writeData(subjects);

  // Delete uploaded files folder for this subject
  const ASSIGNMENTS_DIR = fs.existsSync('/app/uploads')
    ? '/app/uploads/assignments'
    : path.resolve(__dirname, '..', '..', 'uploads', 'assignments');
  const subjectDir = path.join(ASSIGNMENTS_DIR, subjectId);
  if (fs.existsSync(subjectDir)) {
    try {
      fs.rmSync(subjectDir, { recursive: true, force: true });
    } catch (e) {
      console.error('Failed to delete subject folder:', e);
    }
  }

  res.json({ message: 'Đã xóa', subject: deleted });
});

// ---- POST /api/subjects/:id/assignments - Admin only ----
router.post('/:id/assignments', verifyToken, requireAdmin, (req, res) => {
  const subjects = readData();
  const subject = subjects.find(s => s.id === req.params.id);
  if (!subject) return res.status(404).json({ error: 'Không tìm thấy môn học' });

  const { title, github_url, demo_url } = req.body;
  if (!title) return res.status(400).json({ error: 'Thiếu trường title' });

  const assignment = { title, github_url: github_url || '', demo_url: demo_url || '' };
  subject.assignments.push(assignment);
  writeData(subjects);
  res.status(201).json(assignment);
});

// ---- PUT /api/subjects/:id/assignments/:idx - Admin only ----
router.put('/:id/assignments/:idx', verifyToken, requireAdmin, (req, res) => {
  const subjects = readData();
  const subject = subjects.find(s => s.id === req.params.id);
  if (!subject) return res.status(404).json({ error: 'Không tìm thấy môn học' });

  const idx = parseInt(req.params.idx);
  if (isNaN(idx) || idx < 0 || idx >= subject.assignments.length) {
    return res.status(404).json({ error: 'Assignment index không hợp lệ' });
  }

  const { title, github_url, demo_url } = req.body;
  subject.assignments[idx] = {
    ...subject.assignments[idx],
    ...(title !== undefined && { title }),
    ...(github_url !== undefined && { github_url }),
    ...(demo_url !== undefined && { demo_url })
  };

  writeData(subjects);
  res.json(subject.assignments[idx]);
});

// ---- DELETE /api/subjects/:id/assignments/:idx - Admin only ----
router.delete('/:id/assignments/:idx', verifyToken, requireAdmin, (req, res) => {
  const subjects = readData();
  const subjectId = req.params.id;
  const subject = subjects.find(s => s.id === subjectId);
  if (!subject) return res.status(404).json({ error: 'Không tìm thấy môn học' });

  const idx = parseInt(req.params.idx);
  if (isNaN(idx) || idx < 0 || idx >= subject.assignments.length) {
    return res.status(404).json({ error: 'Assignment index không hợp lệ' });
  }

  // Manage disk folders
  const ASSIGNMENTS_DIR = fs.existsSync('/app/uploads')
    ? '/app/uploads/assignments'
    : path.resolve(__dirname, '..', '..', 'uploads', 'assignments');
  const subjectDir = path.join(ASSIGNMENTS_DIR, subjectId);
  const targetDir = path.join(subjectDir, String(idx));

  // Delete folder of deleted assignment
  if (fs.existsSync(targetDir)) {
    try {
      fs.rmSync(targetDir, { recursive: true, force: true });
    } catch (e) {
      console.error('Failed to delete assignment dir:', e);
    }
  }

  // Shift remaining folders down by 1 index
  for (let i = idx + 1; i < subject.assignments.length; i++) {
    const oldPath = path.join(subjectDir, String(i));
    const newPath = path.join(subjectDir, String(i - 1));
    if (fs.existsSync(oldPath)) {
      try {
        fs.renameSync(oldPath, newPath);
      } catch (e) {
        console.error(`Failed to rename ${oldPath} to ${newPath}:`, e);
      }
    }
  }

  const deleted = subject.assignments.splice(idx, 1)[0];
  writeData(subjects);
  res.json({ message: 'Đã xóa', assignment: deleted });
});

module.exports = router;
