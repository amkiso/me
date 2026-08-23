const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const SUBJECTS_FILE = path.join(__dirname, '..', 'data', 'subjects.json');
const ASSIGNMENTS_DIR = fs.existsSync('/app/uploads')
  ? '/app/uploads/assignments'
  : path.resolve(__dirname, '..', '..', 'uploads', 'assignments');

// Helper to read subjects.json
function readSubjects() {
  try {
    const raw = fs.readFileSync(SUBJECTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Helper to write subjects.json
function writeSubjects(data) {
  fs.writeFileSync(SUBJECTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Multer storage configuration for assignment files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { subjectId, assignmentIdx } = req.params;
    const dest = path.join(ASSIGNMENTS_DIR, subjectId, String(assignmentIdx));
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    // Retain original filename, sanitized
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, safeName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.php', '.docx', '.css', '.js', '.json', '.html', '.png', '.jpg', '.jpeg', '.pdf', '.txt', '.sql'];
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Định dạng file ${ext} không được hỗ trợ.`));
    }
  }
});

// Helper to get assignment dir
function getAssignmentPath(subjectId, assignmentIdx) {
  return path.join(ASSIGNMENTS_DIR, subjectId, String(assignmentIdx));
}

// GET /api/assignments/:subjectId/:assignmentIdx/files - List files
router.get('/:subjectId/:assignmentIdx/files', (req, res) => {
  const { subjectId, assignmentIdx } = req.params;
  const dirPath = getAssignmentPath(subjectId, assignmentIdx);

  if (!fs.existsSync(dirPath)) {
    return res.json([]);
  }

  try {
    const files = fs.readdirSync(dirPath).map(filename => {
      const stats = fs.statSync(path.join(dirPath, filename));
      const ext = path.extname(filename).toLowerCase();
      let type = 'other';
      if (ext === '.php') type = 'php';
      else if (ext === '.docx') type = 'docx';
      else if (['.css', '.js', '.html', '.json', '.sql', '.txt'].includes(ext)) type = 'code';

      return {
        filename,
        type,
        size: stats.size,
        updatedAt: stats.mtime.toISOString(),
        url: `/uploads/assignments/${subjectId}/${assignmentIdx}/${filename}`
      };
    });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Không thể đọc danh sách file' });
  }
});

// POST /api/assignments/:subjectId/:assignmentIdx/upload - Upload file (Admin only)
router.post('/:subjectId/:assignmentIdx/upload', verifyToken, requireAdmin, upload.any(), (req, res) => {
  const { subjectId, assignmentIdx } = req.params;
  const subjects = readSubjects();
  const subject = subjects.find(s => s.id === subjectId);
  const idx = parseInt(assignmentIdx);

  if (!subject || isNaN(idx) || idx < 0 || idx >= subject.assignments.length) {
    return res.status(404).json({ error: 'Không tìm thấy bài tập' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Không có file nào được tải lên' });
  }

  const uploadedFiles = req.files.map(f => {
    const ext = path.extname(f.filename).toLowerCase();
    const relUrl = `/uploads/assignments/${subjectId}/${idx}/${f.filename}`;
    
    // Update assignment metadata in subjects.json
    const assignment = subject.assignments[idx];
    if (ext === '.docx') {
      assignment.docx_file = relUrl;
    }
    if (!assignment.files) assignment.files = [];
    if (!assignment.files.includes(f.filename)) {
      assignment.files.push(f.filename);
    }
    if (ext === '.php' && !assignment.entry_file) {
      assignment.entry_file = f.filename;
    }

    return {
      filename: f.filename,
      size: f.size,
      url: relUrl
    };
  });

  writeSubjects(subjects);

  res.status(201).json({
    message: `Đã upload ${uploadedFiles.length} file thành công`,
    files: uploadedFiles,
    assignment: subject.assignments[idx]
  });
});

// GET /api/assignments/:subjectId/:assignmentIdx/files/:filename - Get source code
router.get('/:subjectId/:assignmentIdx/files/:filename', (req, res) => {
  const { subjectId, assignmentIdx, filename } = req.params;
  const safeFilename = path.basename(filename);
  const filePath = path.join(getAssignmentPath(subjectId, assignmentIdx), safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File không tồn tại' });
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ filename: safeFilename, content });
  } catch (err) {
    res.status(500).json({ error: 'Không thể đọc nội dung file' });
  }
});

// PUT /api/assignments/:subjectId/:assignmentIdx/files/:filename - Update source code (Admin only)
router.put('/:subjectId/:assignmentIdx/files/:filename', verifyToken, requireAdmin, (req, res) => {
  const { subjectId, assignmentIdx, filename } = req.params;
  const safeFilename = path.basename(filename);
  const dirPath = getAssignmentPath(subjectId, assignmentIdx);
  const filePath = path.join(dirPath, safeFilename);

  const { content } = req.body;
  if (content === undefined) {
    return res.status(400).json({ error: 'Nội dung file không được trống' });
  }

  try {
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
    res.json({ message: 'Đã lưu file thành công', filename: safeFilename });
  } catch (err) {
    res.status(500).json({ error: 'Không thể lưu file' });
  }
});

// DELETE /api/assignments/:subjectId/:assignmentIdx/files/:filename - Delete file (Admin only)
router.delete('/:subjectId/:assignmentIdx/files/:filename', verifyToken, requireAdmin, (req, res) => {
  const { subjectId, assignmentIdx, filename } = req.params;
  const safeFilename = path.basename(filename);
  const filePath = path.join(getAssignmentPath(subjectId, assignmentIdx), safeFilename);

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      return res.status(500).json({ error: 'Lỗi khi xóa file khỏi đĩa' });
    }
  }

  // Update subjects.json
  const subjects = readSubjects();
  const subject = subjects.find(s => s.id === subjectId);
  const idx = parseInt(assignmentIdx);
  if (subject && subject.assignments[idx]) {
    const assignment = subject.assignments[idx];
    if (assignment.files) {
      assignment.files = assignment.files.filter(f => f !== safeFilename);
    }
    if (assignment.docx_file && assignment.docx_file.endsWith(safeFilename)) {
      assignment.docx_file = '';
    }
    if (assignment.entry_file === safeFilename) {
      assignment.entry_file = assignment.files && assignment.files.length > 0 ? assignment.files[0] : '';
    }
    writeSubjects(subjects);
  }

  res.json({ message: 'Đã xóa file thành công' });
});

module.exports = router;
