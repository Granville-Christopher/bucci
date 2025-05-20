

const multer = require("multer");
const path = require("path");

// Use memoryStorage to avoid EPERM issues and allow direct buffer access for Sharp
const fileStorage = multer.memoryStorage();

// Add file filter to accept only image files
function checkFileType(file, cb) {
  // Allowed extensions: jpeg, jpg, png, gif, webp
  const filetypes = /jpeg|jpg|png|gif|webp/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

const upload = multer({
  storage: fileStorage,
  limits: { fileSize: 8 * 1024 * 1024 }, // Example: 8MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

module.exports = upload; // Export the Multer instance