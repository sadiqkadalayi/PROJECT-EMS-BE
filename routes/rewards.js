

const express = require('express');
const multer = require('multer'); // Import multer
const { verifyUser } = require('../middleware/authMiddleware');
const { postMasterRecords, getAllMasterRecords, getAllMasterPoints, getAlleligibleList, postingRedumption, getAllRedeemedList } = require('../controllers/rewardsController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Store files in the 'uploads/' directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}.csv`); // Unique filename
  },
});

// File filter to accept only CSV files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

// Initialize multer with the storage and file filter
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Route for uploading records with multer middleware

router.post('/redeem', verifyUser,  postingRedumption);
router.post('/upload-records', verifyUser, upload.single('file'), postMasterRecords);
router.get('/master-records', verifyUser, getAllMasterRecords)
router.get('/get-all-master-points', verifyUser, getAllMasterPoints)
router.get('/get-eligible-list', verifyUser, getAlleligibleList)
router.get('/get-redeemed-records', verifyUser, getAllRedeemedList)

module.exports = router;