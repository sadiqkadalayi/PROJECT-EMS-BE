// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const { uploadPDFs } = require('../controllers/fileController');

// // Configure multer for file uploads
// const upload = multer({ dest: 'public/images' });

// router.post('/add', upload.array('files', 5), uploadPDFs);

// module.exports = router;



const express = require('express');
const router = express.Router();
const multer = require('multer');
const {uploadPDFs, getUploadFiles} = require('../controllers/fileController');
const { verifyUser } = require('../middleware/authMiddleware');


// Multer configuration for handling multiple fields
const upload = multer({ dest: 'public/uploads' });

router.post(
  '/add',
  upload.fields([
    { name: 'file1', maxCount: 1 },
    { name: 'file2', maxCount: 1 },
    { name: 'file3', maxCount: 1 },
    { name: 'file4', maxCount: 1 },
    { name: 'file5', maxCount: 1 },
  ]),
  uploadPDFs
);


router.get('/:id', verifyUser, getUploadFiles )

module.exports = router;

