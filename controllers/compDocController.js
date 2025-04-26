const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs');
const CompanyDoc = require('../models/companyDocs/companyDocs'); // Import the companyDoc model
const mongoose = require('mongoose');

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
const uploadCompDoc = multer({ storage, fileFilter });

// 📌 **Upload Company Document**
const uploadCompanyDoc = async (req, res) => {
  try {
    const { companyName, documentType, documentNumber, expiryDate } = req.body;

    // Validate required fields
    if (!companyName || !documentType || !documentNumber || !expiryDate || !req.file) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Step 1: Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'company-documents',
    });

    // Step 2: Create a new document record in the database
    const newDoc = new CompanyDoc({
      companyName,
      documentType,
      documentNumber,
      expiryDate,
      documentUrl: result.secure_url, // Store the Cloudinary URL
      cloudinaryId: result.public_id, // Store the Cloudinary public ID
    });

    await newDoc.save();

    // Step 3: Remove the temporary local file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Step 4: Respond with success
    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully.',
      data: newDoc,
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document.',
      error: error.message,
    });
  }
};



const getAllDocuments = async (req, res) => {
    try {
        const documents = await CompanyDoc.find({}).sort({ createdAt: -1 });
        res.status(200).json({
        success: true,
        message: 'Documents retrieved successfully.',
        data: documents,
        });
    } catch (error) {
        console.error('Error retrieving documents:', error);
        res.status(500).json({
        success: false,
        message: 'Failed to retrieve documents.',
        error: error.message,
        });
    }
}


const removeDocuments = async (req, res) => {
  try {
    const { id } = req.params; // Assuming the ID is sent as a URL parameter

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid document ID format.' });
    }

    // Find the document by ID
    const document = await CompanyDoc.findById(id);
    if (!document) {
      console.error(`Document with ID ${id} not found.`);
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Delete the file from Cloudinary
    await cloudinary.uploader.destroy(document.cloudinaryId);

    // Delete the document from the database
    await CompanyDoc.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document.',
      error: error.message,
    });
  }
};



module.exports = {
    uploadCompanyDoc,getAllDocuments,removeDocuments,
  uploadCompDoc, // Export the multer middleware
};