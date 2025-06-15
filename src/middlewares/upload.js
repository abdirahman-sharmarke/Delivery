const multer = require('multer');

// Configure multer for memory storage (since we're uploading to Supabase)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_IMAGE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
    files: 1 // Only allow single file upload
  },
  fileFilter: fileFilter
});

// Middleware for single image upload
const uploadSingle = (fieldName = 'image') => {
  return (req, res, next) => {
    const uploadHandler = upload.single(fieldName);
    
    uploadHandler(req, res, (error) => {
      if (error) {
        if (error instanceof multer.MulterError) {
          switch (error.code) {
            case 'LIMIT_FILE_SIZE':
              return res.status(400).json({
                success: false,
                message: 'File too large',
                maxSize: `${(parseInt(process.env.MAX_FILE_SIZE) || 5242880) / 1024 / 1024}MB`
              });
            case 'LIMIT_FILE_COUNT':
              return res.status(400).json({
                success: false,
                message: 'Too many files'
              });
            case 'LIMIT_UNEXPECTED_FILE':
              return res.status(400).json({
                success: false,
                message: 'Unexpected field name'
              });
            default:
              return res.status(400).json({
                success: false,
                message: 'Upload error',
                error: error.message
              });
          }
        } else {
          return res.status(400).json({
            success: false,
            message: error.message
          });
        }
      }
      next();
    });
  };
};

// Middleware for profile picture upload
const uploadProfilePicture = uploadSingle('profile_picture');

module.exports = {
  upload,
  uploadSingle,
  uploadProfilePicture
}; 