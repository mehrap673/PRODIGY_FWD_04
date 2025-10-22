// middleware/upload.middleware.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = 'uploads/temp';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  console.log('📎 File filter check:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
  });

  // Images
  if (file.mimetype.startsWith('image/')) {
    console.log('✅ Image file accepted');
    cb(null, true);
  }
  // Audio files
  else if (
    file.mimetype.startsWith('audio/') ||
    file.mimetype === 'video/webm' || // For recorded audio
    file.mimetype === 'video/mp4'
  ) {
    console.log('✅ Audio file accepted');
    cb(null, true);
  } else {
    console.log('❌ File type rejected:', file.mimetype);
    cb(new Error('Invalid file type. Only images and audio files are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// Log middleware configuration
console.log('📤 Multer upload middleware configured:', {
  uploadDir: uploadsDir,
  maxFileSize: '10MB',
});
