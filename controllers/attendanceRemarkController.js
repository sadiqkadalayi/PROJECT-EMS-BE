const AttendanceRemark = require('../models/attendanceRemark');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs');
const Attendance = require('../models/attendance');
const SetSchedule = require('../models/setSchedule');
const axios = require('axios');
const Employee = require('../models/employee'); // Adjust path
const User = require('../models/user'); // Adjust path
const mongoose = require('mongoose'); // Import mongoose for ObjectId conversion
const redis = require('../config/redisClient'); // adjust the path if needed



// ✅ Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
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
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only PDF, JPG, and PNG files are allowed'), false);
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

const submitRemark = async (req, res) => {
  try {
    console.log('Submitting Remark...');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);

    const { reason, attendanceId } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Reason is required' });
    }

    if (!attendanceId) {
      return res.status(400).json({ message: 'Attendance ID is required' });
    }

    // Find the attendance record based on the provided attendanceId
    const attendanceRecord = await Attendance.findOne({ _id: attendanceId });

    if (!attendanceRecord) {
      return res.status(404).json({ message: 'Attendance record not found for the given ID' });
    }

    // Get employeeId from the found attendance record
    const employeeId = attendanceRecord.Emp_id;

    let documentUrl = null;

    // If a file is provided, upload it to Cloudinary
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'attendance_remarks',
      });
      console.log('File uploaded:', result.secure_url);
      documentUrl = result.secure_url;

      // Remove the temporary local file
      if (fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
          console.log("Temporary file deleted:", req.file.path);
        } catch (error) {
          console.error("Error deleting temporary file:", error.message);
        }
      }
    }

    // Create the remark entry and save it
    const newRemark = new AttendanceRemark({
      employeeId,  // Use the fetched employeeId
      attendanceId,  // Store the attendanceId
      reason,
      documentUrl,
      status: 'Submitted',
    });

    await newRemark.save();

    // Invalidate Redis cache for this attendance date
    const formatDate = (date) => new Date(date).toISOString().split("T")[0];
    const affectedDate = formatDate(attendanceRecord.date);

    // Delete specific day cache
    await redis.del(`attendance:${affectedDate}:${affectedDate}`);

    // Optionally delete bigger range if you know common usage
    await redis.del(`attendance:2025-04-01:2025-04-15`);



    res.status(201).json({ message: 'Remark submitted successfully', remark: newRemark });
  } catch (error) {
    console.error('Error submitting remark:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};





const submitRemarkOnlyStatus = async (req, res) => {
  console.log('Controller reached! ID:', req.params.id, 'Body:', req.body);
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    // Step 1: Fetch the attendance record
    const attendanceRecord = await Attendance.findOne({ _id: id });
    console.log('Found Attendance Record:', attendanceRecord);
    if (!attendanceRecord) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Step 2: Fetch the employee
    const employee = await Employee.findOne({ _id: attendanceRecord.Emp_id });
    console.log('Found Employee:', employee);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Step 3: Convert employeeId to ObjectId
    const employeeObjectId = mongoose.Types.ObjectId.isValid(employee._id)
      ? new mongoose.Types.ObjectId(employee._id) // Use `new` here
      : null;

    if (!employeeObjectId) {
      return res.status(400).json({ message: 'Invalid employeeId format' });
    }

    // Step 4: Handle "Notification" status
    if (status === "Notification") {
      try {
        // Fetch supervisor from User model
        const supervisorUser = await Employee.findOne({ _id: employee.supervisor });
        console.log('Supervisor User:', supervisorUser);
        if (!supervisorUser) {
          console.error('Supervisor not found for ID:', employee.supervisor.toString());
          return res.status(404).json({ message: 'Supervisor not found' });
        }

        // Fetch supervisor's Employee document for mobQatar
        const supervisorEmployee = await Employee.findOne({ _id: supervisorUser._id });
        const supervisorUserId = await User.findOne({ _id: supervisorEmployee.userId });

            // Step 3: Fetch employee name from User model
        const employeeUser = await User.findOne({ _id: employee.userId });
        console.log('Employee User:', employeeUser);
        if (!employeeUser) {
          console.warn('Employee user not found for ID:', employee.userId.toString());
          return res.status(404).json({ message: 'Employee user not found' });
        }
        const employeeName = employeeUser.name;


        console.log('Supervisor Employee:', supervisorEmployee);
        if (!supervisorEmployee || !supervisorEmployee.mobQatar) {
          console.error('Supervisor employee or mobile number not found for User ID:', supervisorUser._id.toString());
          return res.status(404).json({ message: 'Supervisor mobile number not found' });
        }

        // Construct the WhatsApp message
        const formattedDate = new Date(attendanceRecord.date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        const messageVariables = {
          "{{1}}": supervisorUserId.name , // Supervisor name
          "{{2}}": employeeName, // Employee name
          "{{3}}": formattedDate, // Attendance date
          "{{4}}": employee.employeeId , // Employee ID
        };

        const formattedNumber = supervisorEmployee.mobQatar.startsWith("+") 
          ? supervisorEmployee.mobQatar.slice(1) 
          : supervisorEmployee.mobQatar;

        const whatsappPayload = {
          appkey: process.env.WHATSAPP_APP_KEY,
          authkey: process.env.WHATSAPP_AUTH_KEY,
          to: formattedNumber,
          template_id: "attendance_followup_reminder",
          language: "en_us",
          variables: messageVariables,
        };

        // Send the WhatsApp message
        const whatsappResponse = await axios.post(
          "https://waba.bulkymarketing.com/api/create-message",
          whatsappPayload,
          { headers: { "Content-Type": "application/json" } }
        );

        console.log("WhatsApp Response:", whatsappResponse.data);

        // Respond with success
        return res.status(200).json({ message: "Notification sent successfully" });
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError.message);
        return res.status(500).json({
          message: "Failed to send notification",
          error: notificationError.message,
        });
      }
    }

    // Step 5: Create a new remark for other statuses
    const newRemark = new AttendanceRemark({
      employeeId: employeeObjectId, // Use the converted ObjectId
      attendanceId: id,
      status,
      reason: null,
      documentUrl: null,
    });

    await newRemark.save();

    // ✅ Invalidate Redis by frontend-passed date range
      const { startDate, endDate } = req.body;
      if (startDate && endDate) {
        const redisKey = `attendance:${startDate}:${endDate}`;
        const delResult = await redis.del(redisKey);
        console.log("🧹 Redis key deleted by frontend range:", redisKey, "→", delResult);
      }

      // ✅ Also clear some known large ranges if you want to be safe
      const formatDate = (date) => new Date(date).toISOString().split("T")[0];
      const affectedDate = formatDate(attendanceRecord.date);
      const deleteKeys = [
        `attendance:${affectedDate}:${affectedDate}`,
        `attendance:2025-04-01:2025-04-15`,
        `attendance:2025-04-01:2025-04-30`,
      ];

      for (const key of deleteKeys) {
        const delResult = await redis.del(key);
        console.log(`🗑️ Deleted Redis key: ${key} → Result:`, delResult);
      }


    res.status(201).json({ message: 'Remark created with status', remark: newRemark });
  } catch (error) {
    console.error('Error in submitRemarkOnlyStatus:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};








const getAllRemarks = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    console.log('Query Params:', { status, startDate, endDate });

    let query = {};
    if (startDate && endDate) {
      query = {
        createdAt: { // Changed from 'attendanceId.date' to 'createdAt'
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
      console.log('Date Range Query:', query);
    } else if (status) {
      query.status = status;
      console.log('Status Query:', query);
    }

    const remarks = await AttendanceRemark.find(query)
      .populate({
        path: 'employeeId',
        select: 'employeeId department userId',
        populate: [
          { path: 'department', select: 'dep_name' },
          { path: 'userId', select: 'name' },
        ],
      })
      .populate('attendanceId', 'Emp_id totalInTime date');

    console.log('Raw Remarks:', JSON.stringify(remarks, null, 2));
    console.log('Remarks Count:', remarks.length);

    const mappedRemarks = remarks.map((remark) => ({
      _id: remark._id,
      employeeId: remark.employeeId.employeeId,
      department: remark.employeeId.department.dep_name,
      employeeName: remark.employeeId.userId.name,
      totalWorkTime: remark.attendanceId ? remark.attendanceId.totalInTime : 'N/A',
      attendanceDate: remark.attendanceId ? remark.attendanceId.date : null,
      status: remark.status,
      createdAt: remark.createdAt,
    }));

    res.status(200).json({ remarks: mappedRemarks });
  } catch (error) {
    console.error('Error fetching remarks:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};


const getRemarkById = async (req, res) => {
  try {
    const remark = await AttendanceRemark.findById(req.params.id).populate('attendanceId');
    if (!remark) {
      return res.status(404).json({ message: 'Remark not found' });
    }

    const attendanceRecord = await Attendance.findById(remark.attendanceId).populate({
      path: 'Emp_id',
      select: 'employeeId name department',
      populate: {
        path: 'department',
        select: 'dep_name'
      }
    });

    const setSchedules = await SetSchedule.find({ employeeId: attendanceRecord.Emp_id._id }).populate({
      path: 'scheduleId',
      select: 'scheduleName scheduleA scheduleB scheduleC breakTimePeriod setType totalScheduleTime',
      model: 'Schedule'
    });

    const setScheduleMap = setSchedules.reduce((map, setSchedule) => {
      const { startDate, endDate, scheduleId } = setSchedule;
      if (!map[attendanceRecord.Emp_id._id]) map[attendanceRecord.Emp_id._id] = [];
      map[attendanceRecord.Emp_id._id].push({ startDate, endDate, schedule: scheduleId });
      return map;
    }, {});

    const employeeSchedules = setScheduleMap[attendanceRecord.Emp_id._id.toString()];
    const applicableSetSchedule = employeeSchedules?.find(sch => attendanceRecord.date >= sch.startDate && attendanceRecord.date <= sch.endDate);
    const schedule = applicableSetSchedule ? applicableSetSchedule.schedule : null;

    res.json({
      remark,
      attendance: {
        ...attendanceRecord._doc,
        scheduleName: schedule?.scheduleName || "No schedule assigned",
        setType: schedule?.setType || "N/A",
        scheduleTimes: {
          A: schedule?.scheduleA || { in: "N/A", out: "N/A" },
          B: schedule?.scheduleB || { in: "N/A", out: "N/A" },
          C: schedule?.scheduleC || { in: "N/A", out: "N/A" }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching remark by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};








// Update remark status (Accept/Reject)
const updateRemarkStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const { id } = req.params;

    // Update the remark status
    const updatedRemark = await AttendanceRemark.findByIdAndUpdate(id, { 
        status, 
        reason 
    }, { new: true });

    if (!updatedRemark) {
        return res.status(404).json({ message: "Remark not found" });
    }

    // Update the linked attendance record's status
    await Attendance.findByIdAndUpdate(updatedRemark.attendanceId, { 
        status 
    });

    res.json({ message: `Remark updated to ${status}`, remark: updatedRemark });
} catch (error) {
    console.error("Error updating remark status:", error);
    res.status(500).json({ message: "Server error" });
}
};





const sendNotification = async (req, res) => {
  const { id } = req.params;
  const { reason: updatedReason } = req.body;

  try {
    // Step 1: Fetch AttendanceRemark with populated attendanceId
    const remark = await AttendanceRemark.findById(id).populate('attendanceId');
    if (!remark) {
      return res.status(404).json({ message: 'Attendance remark not found' });
    }

    // Use updatedReason from request body if provided, otherwise use stored reason
    const reasonString = updatedReason || remark.reason;

    // Step 2: Split reason into Reason and Response
    const [reasonPart, ...responseParts] = reasonString.split('-');
    const responsePart = responseParts.join('-').trim();

    // Step 3: Fetch Attendance (already populated)
    const attendance = remark.attendanceId;
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance not found' });
    }

    // Format date to DD-MMM-YYYY (e.g., "01-Jan-2024")
    const formattedDate = new Date(attendance.date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    // Step 4: Find Employee
    const employee = await Employee.findById(attendance.Emp_id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Step 5: Find Supervisor
    const supervisor = await Employee.findById(employee.supervisor);
    if (!supervisor) {
      return res.status(404).json({ message: 'Supervisor not found' });
    }
    const mobQatar = supervisor.mobQatar;

    // Step 6: Construct WhatsApp Message
    const messageVariables = {
      "{{1}}": reasonPart.trim(),
      "{{2}}": formattedDate,
      "{{3}}": responsePart,
      "{{4}}": attendance.name,
      "{{5}}": attendance.clockIn1 || "N/A",
      "{{6}}": attendance.clockOut1 || "N/A",
      "{{7}}": attendance.clockIn2 || "N/A",
      "{{8}}": attendance.clockOut2 || "N/A",
      "{{9}}": attendance.clockIn3 || "N/A",
      "{{10}}": attendance.clockOut3 || "N/A",
      "{{11}}": attendance.totalInTime || "N/A",
    };

    // Step 7: Sanitize Message Variables
    const sanitizedVariables = {};
    for (const key in messageVariables) {
      sanitizedVariables[key] = messageVariables[key]
        .replace(/[\n\t]/g, ' ') // Replace new-line and tab characters with a single space
        .replace(/\s{2,}/g, ' ') // Replace multiple spaces with a single space
        .trim(); // Trim leading and trailing spaces
    }  

    // Step 8: Send WhatsApp Message
    const formattedNumber = mobQatar.startsWith("+") ? mobQatar.slice(1) : mobQatar;
    const whatsappPayload = {
      appkey: process.env.WHATSAPP_APP_KEY,
      authkey: process.env.WHATSAPP_AUTH_KEY,
      to: formattedNumber,
      template_id: "attendance_remark_notification",
      language: "en_us",
      variables: sanitizedVariables,
    };

    const whatsappResponse = await axios.post(
      "https://waba.bulkymarketing.com/api/create-message",
      whatsappPayload,
      { headers: { "Content-Type": "application/json" } }
    );

    // Step 9: Respond to Frontend
    res.status(200).json({ message: "Notification sent successfully" });
  } catch (error) {
    console.error("Failed to send notification:", error.message);
    if (error.response) {
      console.error("Error Response Data:", error.response.data);
      console.error("Error Status:", error.response.status);
    }
    res.status(500).json({ message: "Failed to send notification", error: error.message });
  }
};




module.exports = {sendNotification, submitRemarkOnlyStatus,submitRemark,  upload,getRemarkById, updateRemarkStatus,getAllRemarks  };
