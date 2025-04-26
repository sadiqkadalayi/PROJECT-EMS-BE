const express = require('express');
const { verifyUser } = require('../middleware/authMiddleware');
const { uploadVehicleDoc, uploadVehicleDocMiddleware, getallVehicleDoc, removeVehicleDoc } = require('../controllers/vehicleDocController');

const router = express.Router();

// Configure multer to handle multiple files
const upload = uploadVehicleDocMiddleware.fields([
  { name: 'fileInsurance', maxCount: 1 }, // Field for insurance document
  { name: 'fileRegistration', maxCount: 1 }, // Field for registration document
]);

// Routes
router.post('/add-records', verifyUser, upload, uploadVehicleDoc); // Updated to handle multiple files
router.get('/get-records', verifyUser, getallVehicleDoc);
router.delete('/remov-doc/:id', verifyUser, removeVehicleDoc);

module.exports = router;