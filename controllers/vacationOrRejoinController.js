const VacationOrRejoin = require("../models/VacationRejoin");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const multer = require("multer");
const path = require('path')


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer configuration for temporary local storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads'); // Temporarily store files locally
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
    },
  });
  
  const upload = multer({ storage });

const addVacationOrRejoin = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    console.log("Received file:", req.file);  // <-- Check if file exists

    const { employeeId, lastDutyDate, joinDate, type } = req.body;
    let fileUrl = "";

    if (req.file) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "employee_vacation_rejoin",
      });

      if (result && result.secure_url) {
        fileUrl = result.secure_url;
        fs.unlinkSync(req.file.path); // Delete temporary file
      }
    }

    const newEntry = new VacationOrRejoin({
      employeeId,
      lastDutyDate: type === "vacation" ? lastDutyDate || null : null,
      joinDate: type === "rejoin" ? joinDate || null : null,
      type,
      fileUrl,
    });

    await newEntry.save();
    res.status(201).json({ success: true, message: "Record added successfully!", data: newEntry });

  } catch (error) {
    console.error("Error in addVacationOrRejoin:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};





const getAllRecords = async (req, res) => {
    try {
      const records = await VacationRejoin.find().populate("employeeId", "employeeId");
      res.status(200).json({ success:true, records });
    } catch (error) {
      res.status(500).json({ message: "Error fetching records", error });
    }
  };

  const getOneRecords = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Fetch all vacation and rejoin entries for the employee, sorted by creation date
      const records = await VacationOrRejoin.find({ employeeId: id })
        .sort({ createdAt: -1 }) // Sort by createdAt to get the latest first
        .populate("employeeId", "employeeId name fileUrl"); // Ensure 'employeeId', 'name', and 'fileUrl' are populated
  
      // If no records found, return an empty array
      if (!records || records.length === 0) {
        return res.status(404).json({ success: false, message: "No records found for this employee" });
      }
  
      // Format the response data
      const formattedRecords = records.map((record, index) => {
        const isRejoin = record.type === "rejoin";
        return {
          slaNumber: index + 1, // Sequential number
          employeeId: record.employeeId.employeeId,
          employeeName: record.employeeId.name ? record.employeeId.name.toUpperCase() : "N/A", // Add fallback if name is undefined
          fileUrl: record.fileUrl || "N/A", // Add fallback if fileUrl is undefined
          entryDate: new Date(record.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          joinDate: isRejoin ? new Date(record.joinDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }) : "", // Blank for vacation
          lastDutyDate: isRejoin ? "" : new Date(record.lastDutyDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }), // Blank for rejoin
          totalVacationDays: record.totalVacationDays || 0,
          type: isRejoin ? "REJOIN" : "VACATION",
        };
      });
  
      res.status(200).json({ success: true, records: formattedRecords });
    } catch (error) {
      console.error("Error fetching records: ", error); // Log the error for debugging
      res.status(500).json({ success: false, message: "Error fetching records", error: error.message });
    }
  };
  
  
 const getAllVacationList = async (req, res) => {
  try {
    const vacations = await VacationOrRejoin.find({ type: 'vacation' })
      .populate({
        path: 'employeeId',
        select: 'employeeId userId department',
        populate: [
          {
            path: 'userId',
            select: 'name',
            model: 'User'
          },
          {
            path: 'department',
            select: 'dep_name'
          }
        ]
      })
      .lean();

    const formattedVacations = vacations.map(vacation => ({
      employeeId: vacation.employeeId.employeeId,
      employeeName: vacation.employeeId.userId.name,
      department: vacation.employeeId.department.dep_name,
      startDate: vacation.lastDutyDate,
      createdAt: vacation.createdAt,
      doc: vacation.fileUrl
    }));

    res.status(200).json({ success: true, vacations: formattedVacations });
  } catch (error) {
    console.error('Error fetching vacation list:', error);
    res.status(500).json({ success: false, message: 'Error fetching vacation list', error: error.message });
  }
};


const getAllrejoinList = async (req, res) => {
  try {
    const rejoins = await VacationOrRejoin.find({ type: 'rejoin' })
      .populate({
        path: 'employeeId',
        select: 'employeeId userId department',
        populate: [
          {
            path: 'userId',
            select: 'name',
            model: 'User'
          },
          {
            path: 'department',
            select: 'dep_name'
          }
        ]
      })
      .lean();

    const formattedRejoins = rejoins.map(rejoin => ({
      employeeId: rejoin.employeeId.employeeId,
      employeeName: rejoin.employeeId.userId.name,
      department: rejoin.employeeId.department.dep_name,
      joinDate: rejoin.joinDate,
      createdAt: rejoin.createdAt,
      doc: rejoin.fileUrl
    }));

    res.status(200).json({ success: true, rejoins: formattedRejoins });
  } catch (error) {
    console.error('Error fetching rejoin list:', error);
    res.status(500).json({ success: false, message: 'Error fetching rejoin list', error: error.message });
  }
};


  
module.exports = {getAllrejoinList,getAllVacationList,addVacationOrRejoin, getAllRecords,getOneRecords,upload}