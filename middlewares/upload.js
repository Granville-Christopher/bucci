const multer = require("multer");
const path = require("path");

// Custom name for the storage variable

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploadedimages");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-image-${file.originalname}`);
  },
});

// Add file filter to accept only image files
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}
const upload = multer({
  storage: fileStorage,
  limits: { fileSize: 800000000 }, // Limit file size to 1MB
  fileFilters: function (req, file, cb) {
    checkFileType(file, cb);
  },
});
module.exports = upload;

// // File filter to allow only specific file types
// const fileFilter = (req, file, cb) => {
//     // Allowed file extensions
//     const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpeg', '.jpg', ];
//     const ext = path.extname(file.originalname).toLowerCase();

//     if (allowedExtensions.includes(ext)) {
//         cb(null, true); // Accept the file
//     } else {
//         cb(new Error('Only .pdf, .doc, and .docx files are allowed!'), false); // Reject the file
//     }
// };

// // Multer configuration with size limit and file filter
// const uploads = multer({
//     storage: fileStorage,
//     limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10GB size limit
//     fileFilter: fileFilter
// });

// module.exports = uploads;
