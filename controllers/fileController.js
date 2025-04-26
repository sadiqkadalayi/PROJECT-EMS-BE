const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const FileModel = require('../models/File');
const path  = require('path');
const Employee = require('../models/employee');


// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadPDFs = async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({ message: 'No files received!' });
    }

    const results = []; // Array to hold metadata for MongoDB

    for (let i = 1; i <= 5; i++) {
      const fileKey = `file${i}`;
      const dateKey = `date${i}`;
      const textKey = `text${i}`;
      const nameKey = `name${i}`;

      if (req.files[fileKey]) {
        const filePath = req.files[fileKey][0].path;
        const file = req.files[fileKey][0];

        // Upload file to Cloudinary
        const result = await cloudinary.uploader.upload(filePath, {
          resource_type: 'raw',
          folder: 'pdf-uploads',
          tags: ['pdf', 'documents'], // Add tags to organize files
          public_id: `file_${Date.now() + path.extname(file.originalname)}`, // Optional custom public ID
        });
        console.log('PDF URL:', result.secure_url);

        // Push metadata for MongoDB
        results.push({
          fileUrl: result.secure_url,
          date: req.body[dateKey],
          text: req.body[textKey],
          name: req.body[nameKey],
        });

        // // Remove file from local storage
        // fs.unlinkSync(filePath);

        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log("File deleted successfully:", filePath);
          } catch (error) {
            console.error("Error deleting file:", error.message);
          }
        } else {
          console.error("File does not exist:", filePath);
        }
      }
    }

    // Check if results array has data
    if (results.length === 0) {
      return res.status(400).json({ message: 'No valid files were uploaded!' });
    }

    // Save to MongoDB
    const savedFiles = await FileModel.insertMany(results);

    res.status(200).json({
      message: 'Files uploaded and metadata saved!',
      cloudinaryResults: results,
      savedFiles,
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ message: 'Upload failed!', error: error.message });
  }
};



const getUploadFiles = async (req, res) => {
  try {
    const { id } = req.params;

    const uploadFiles = await FileModel.find({ text: id })
      .populate("text", "employeeId")
      .lean(); // Use lean() to get plain JavaScript objects

    if (!uploadFiles || uploadFiles.length === 0) {
      return res.status(404).json({ success: false, message: 'No files found' });
    }

     // Calculate daysDifference and update status for each file
     uploadFiles.forEach(file => {
      const today = new Date();
      const date = new Date(file.date);
      const timeDifference = date.getTime() - today.getTime();
      const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));

      if (daysDifference <= 0) {
        file.status = "Expired";
      } else if (daysDifference <= 14) {
        file.status = "Expire within 2 weeks";
      } else if (daysDifference <= 30) {
        file.status = "Expire within 1 Month";
      } else {
        file.status = "Valid";
      }

      file.daysDifference = daysDifference; // Add daysDifference to the file object
    });

    return res.status(200).json({ success: true, uploadFiles });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Server Error' });
  }
};

module.exports = getUploadFiles;



module.exports = { uploadPDFs,getUploadFiles };
