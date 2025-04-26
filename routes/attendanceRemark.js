const express = require('express');
const { verifyUser } = require('../middleware/authMiddleware');
const { submitRemark, upload, getRemarkById, updateRemarkStatus, getAllRemarks, submitRemarkOnlyStatus, sendNotification } = require('../controllers/attendanceRemarkController');

const router = express.Router();

// 📌 **Submit Remark (with File Upload)**
router.post('/submit-remark', verifyUser, upload.single('reasonDoc'), submitRemark);
router.post('/submit-remark-status/:id', verifyUser,  submitRemarkOnlyStatus);


router.post('/send-notification/:id', verifyUser,  sendNotification);


router.get('/', verifyUser, getAllRemarks);

// 📌 **Get Remark by ID** (For viewing remark details)
router.get('/:id', verifyUser, getRemarkById);

// 📌 **Update Remark Status (Accept/Reject)** (For admin to accept or reject the remark)
router.patch('/:id', verifyUser, updateRemarkStatus);

module.exports = router;
