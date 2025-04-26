const Resignation = require('../models/resignation');
const Employee = require('../models/employee');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const FileModel = require('../models/File'); // Import the FileModel
const VacationRejoin = require('../models/VacationRejoin'); // Import the VacationRejoin model




const addResignation = async (req, res) => {
  try {
    const { employeeId, lastDutyDate, type } = req.body;

    // Log the received data
    console.log("Received employeeId:", employeeId);
    console.log("Received lastDutyDate:", lastDutyDate);
    console.log("Received type:", type);

    // Find the employee by employeeId
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      console.log("Employee not found for employeeId:", employeeId);
      return res.status(404).json({ success: false, error: "Employee Not Found" });
    }

    let settlementDocUrl = "";

    // Check if a file is uploaded
    if (req.file) {
      // Get the uploaded file details
      const file = req.file;

      // Generate the new file name
      const fileName = `${file.originalname.split('.')[0]}_${Date.now()}.${file.originalname.split('.').pop()}`;

      // Upload the settlement document to Cloudinary
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "settlement-documents",
        resource_type: "raw",
        public_id: fileName
      });

      // Remove the temporary local file
      if (fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
          console.log("Temporary file deleted:", file.path);
        } catch (error) {
          console.error("Error deleting temporary file:", error.message);
        }
      }

      settlementDocUrl = result.secure_url;
    }

    // Create a new resignation entry
    const resignation = new Resignation({
      employeeId: employee._id,
      lastDutyDate,
      type,
      settlementDoc: settlementDocUrl
    });

    // Save the resignation entry
    await resignation.save();

    // Update the employee status to "inactive"
    employee.status = 'inactive';
    await employee.save();

    return res.status(200).json({ success: true, message: "Resignation submitted successfully" });
  } catch (error) {
    console.error("Error submitting resignation:", error);
    return res.status(500).json({ success: false, error: "Server Error" });
  }
};




const getAllResignedEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ status: "inactive" })
      .populate("userId", { password: 0 })
      .populate("department")
      .lean();

    if (!employees || employees.length === 0) {
      return res.status(404).json({ success: false, message: "No resigned employees found" });
    }

    for (const employee of employees) {
      const files = await FileModel.find({ text: employee._id }).lean();

      files.forEach((file) => {
        const today = new Date();
        const fileDate = new Date(file.date);
        const timeDifference = fileDate - today;
        const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

        file.status =
          daysDifference <= 0
            ? "Expired"
            : daysDifference <= 14
            ? "Exp in 2 weeks"
            : daysDifference <= 30
            ? "Exp. in 1 Month"
            : "Valid";

        file.daysDifference = daysDifference;
      });

      employee.files = files;

      const fetchLatestDocument = async (docName) => {
        const doc = await FileModel.findOne({ text: employee._id, name: docName })
          .sort({ date: -1 })
          .lean();
        return { name: doc ? doc.name : null, expDate: doc ? doc.date : null };
      };

      const qid = await fetchLatestDocument("QID");
      const passport = await fetchLatestDocument("PASSPORT");
      const medical = await fetchLatestDocument("MEDICAL");

      employee.QID = qid.name;
      employee.qidExp = qid.expDate;
      employee.PASSPORT = passport.name;
      employee.passportExp = passport.expDate;
      employee.MEDICAL = medical.name;
      employee.medicalExp = medical.expDate;

      const latestRejoin = await VacationRejoin.findOne({
        employeeId: employee._id,
        type: "rejoin",
        joinDate: { $ne: null },
      })
        .sort({ joinDate: -1 })
        .lean();

      const latestVacation = await VacationRejoin.findOne({
        employeeId: employee._id,
        type: "vacation",
        lastDutyDate: { $ne: null },
      })
        .sort({ lastDutyDate: -1 })
        .lean();

      let totalWorkingDays = 0;
      let totalVacationDays = 0;

      if (latestVacation && (!latestRejoin || new Date(latestVacation.lastDutyDate) > new Date(latestRejoin.joinDate))) {
        const lastDutyDate = new Date(latestVacation.lastDutyDate);
        const today = new Date();
        
        if (!isNaN(lastDutyDate.getTime())) {
          totalVacationDays = Math.floor((today - lastDutyDate) / (1000 * 60 * 60 * 24));
        }
      } else if (latestRejoin) {
        const rejoinDate = new Date(latestRejoin.joinDate);
        const today = new Date();
        
        if (!isNaN(rejoinDate.getTime())) {
          totalWorkingDays = Math.floor((today - rejoinDate) / (1000 * 60 * 60 * 24));
        }
      }

      employee.totalWorkingDays = totalWorkingDays > 0 ? totalWorkingDays : 0;
      employee.totalVacationDays = totalVacationDays > 0 ? totalVacationDays : 0;
    }

    return res.status(200).json({ success: true, employees });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Server Error" });
  }
};


const getResignedEmployeeDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the resignation documents for the employee and populate the employeeId field
    const records = await Resignation.find({ employeeId: id })
      .populate('employeeId', 'employeeId name') // Populate employeeId with employeeId and name fields
      .lean();

    if (!records || records.length === 0) {
      return res.status(404).json({ success: false, message: "No resignation documents found" });
    }

    return res.status(200).json({ success: true, records });
  } catch (error) {
    console.error("Error fetching resignation documents:", error);
    return res.status(500).json({ success: false, error: "Server Error" });
  }
};

  

module.exports = { addResignation, getAllResignedEmployees,getResignedEmployeeDocument };