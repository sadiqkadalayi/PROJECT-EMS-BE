const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs');
const mongoose = require('mongoose');
const VehicleDoc = require('../models/vehicleDocs/vehicleDocs'); // Import the vehicleDoc model

// ✅ Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Multer Storage (Local Storage)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// ✅ File Filter for Multer
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPEG, and PNG are allowed.'));
  }
};

// ✅ Multer Middleware
const uploadVehicleDocMiddleware = multer({ storage, fileFilter });

// 📌 **Upload Vehicle Document**
const uploadVehicleDoc = async (req, res) => {
  try {
    const {
      vehicleName,
      vehicleNumber,
      registrationExpiryDate,
      insuranceExpiryDate,
      depUsing,
      ownershipName,
    } = req.body;

    // Validate required fields
    if (
      !vehicleName ||
      !vehicleNumber ||
      !registrationExpiryDate ||
      !insuranceExpiryDate ||
      !depUsing ||
      !ownershipName ||
      !req.files.fileInsurance ||
      !req.files.fileRegistration
    ) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Step 1: Upload files to Cloudinary
    const insuranceResult = await cloudinary.uploader.upload(req.files.fileInsurance[0].path, {
      folder: 'vehicle-documents/insurance',
    });

    const registrationResult = await cloudinary.uploader.upload(req.files.fileRegistration[0].path, {
      folder: 'vehicle-documents/registration',
    });

    // Step 2: Create a new document record in the database
    const newDoc = new VehicleDoc({
      vehicleName,
      vehicleNumber,
      registrationExpiryDate,
      insuranceExpiryDate,
      depUsing,
      ownershipName,
      insuranceDocumentUrl: insuranceResult.secure_url, // Store the Cloudinary URL for insurance
      insuranceCloudinaryId: insuranceResult.public_id, // Store the Cloudinary public ID for insurance
      registrationDocumentUrl: registrationResult.secure_url, // Store the Cloudinary URL for registration
      registrationCloudinaryId: registrationResult.public_id, // Store the Cloudinary public ID for registration
    });

    await newDoc.save();

    // Step 3: Remove the temporary local files
    if (fs.existsSync(req.files.fileInsurance[0].path)) {
      fs.unlinkSync(req.files.fileInsurance[0].path);
    }
    if (fs.existsSync(req.files.fileRegistration[0].path)) {
      fs.unlinkSync(req.files.fileRegistration[0].path);
    }

    // Step 4: Respond with success
    res.status(201).json({
      success: true,
      message: 'Vehicle documents uploaded successfully.',
      data: newDoc,
    });
  } catch (error) {
    console.error('Error uploading vehicle documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload vehicle documents.',
      error: error.message,
    });
  }
};


const getallVehicleDoc = async (req, res) => {
    try {
        const vehicleDocs = await VehicleDoc.find({});
        res.status(200).json({
        success: true,
        message: 'Vehicle documents retrieved successfully.',
        data: vehicleDocs,
        });
    } catch (error) {
        console.error('Error retrieving vehicle documents:', error);
        res.status(500).json({
        success: false,
        message: 'Failed to retrieve vehicle documents.',
        error: error.message,
        });
    }
}


const removeVehicleDoc = async (req, res) => {
  try {
    const { id } = req.params; // Assuming the ID is sent as a URL parameter

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid document ID format.' });
    }

    // Find the document by ID
    const vehicleDoc = await VehicleDoc.findOne({ _id: id });
    if (!vehicleDoc) {
      console.error(`Document with ID ${id} not found.`);
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Delete the insurance file from Cloudinary
    if (vehicleDoc.insuranceCloudinaryId) {
      await cloudinary.uploader.destroy(vehicleDoc.insuranceCloudinaryId);
    }

    // Delete the registration file from Cloudinary
    if (vehicleDoc.registrationCloudinaryId) {
      await cloudinary.uploader.destroy(vehicleDoc.registrationCloudinaryId);
    }

    // Delete the document from the database
    await VehicleDoc.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Vehicle document deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting vehicle document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vehicle document.',
      error: error.message,
    });
  }
};

module.exports = {
  uploadVehicleDoc,getallVehicleDoc,removeVehicleDoc,
  uploadVehicleDocMiddleware, // Export the multer middleware
};