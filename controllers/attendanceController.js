// Backend - Controller (attendanceController.js)
const Attendance = require("../models/attendance");
const Employee = require("../models/employee");
const csvParser = require("csv-parser");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Schedule = require("../models/Schedule");
const AttendanceRemark = require("../models/attendanceRemark");
const User = require("../models/user"); // Import the User model
const SetSchedule = require("../models/setSchedule"); // Import the SetSchedule model
const axios = require("axios");
const redis = require("../config/redisClient.js"); // Adjust the import based on your project structure


const uploadCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const filePath = req.file.path;
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          const attendanceRecords = [];

          // Process CSV rows
          for (const row of results) {
            const employee = await Employee.findOne({
              employeeId: row.Emp_ID,
              status: "active",
              workLocation: "panda",
            });

            if (employee) {
              // Parse and format date
              const [day, month, year] = row.Date.split("-");
              const formattedDate = new Date(`20${year}-${month}-${day}`);

              // Calculate work time in minutes
              const calculateWorkTime = (clockIn, clockOut) => {
                if (clockIn && clockOut) {
                  const [inHours, inMinutes] = clockIn.split(":").map(Number);
                  const [outHours, outMinutes] = clockOut
                    .split(":")
                    .map(Number);

                  const inTime = inHours * 60 + inMinutes;
                  const outTime = outHours * 60 + outMinutes;

                  if (outTime < inTime) {
                    return 1440 - inTime + outTime; // 24 hours = 1440 minutes
                  }
                  return outTime - inTime;
                }
                return 0;
              };

              // Format work time as "Xh Ym"
              const formatWorkTime = (workTimeMinutes) => {
                const hours = Math.floor(workTimeMinutes / 60);
                const minutes = workTimeMinutes % 60;
                return `${hours}h ${minutes}m`;
              };

              
              const totalInTimeMinutes = workTime1 + workTime2 + workTime3;
              const totalInTimeFormatted = formatWorkTime(totalInTimeMinutes);

              // Build attendance record
              attendanceRecords.push({
                Emp_id: new mongoose.Types.ObjectId(employee._id),
                name: row.Name || "Unknown",
                date: formattedDate,
                clockIn1: row["Clock In 1"] || null,
                clockOut1: row["Clock Out 1"] || null,
                workTime1: formatWorkTime(workTime1),
                clockIn2: row["Clock In 2"] || null,
                clockOut2: row["Clock Out 2"] || null,
                workTime2: formatWorkTime(workTime2),
                clockIn3: row["Clock In 3"] || null,
                clockOut3: row["Clock Out 3"] || null,
                workTime3: formatWorkTime(workTime3),
                totalInTime: totalInTimeFormatted,
                status: row.Status || "Off",
              });
            }
          }

          if (attendanceRecords.length > 0) {
            // Save attendance records
            await Attendance.insertMany(attendanceRecords);

            // Fetch supervisors and their employees' mobile numbers
            const supervisors = await User.find({ role: "supervisor" });
            const supervisorIds = supervisors.map((sup) => sup._id);
            const employees = await Employee.find({
              userId: { $in: supervisorIds },
            });

            // Deduplicate mobQatar numbers
            const uniqueMobQatar = [
              ...new Set(employees.map((emp) => emp.mobQatar).filter(Boolean)),
            ];

            // Format date for WhatsApp (first record)
            const notificationDate = attendanceRecords[0].date.toLocaleDateString(
              "en-US",
              {
                month: "long",
                day: "numeric",
                year: "numeric",
              }
            ); // e.g., "March 1, 2025"

            // Send WhatsApp notifications
            for (const mobQatar of uniqueMobQatar) {
              try {
                const formattedNumber = mobQatar.startsWith("+")
                  ? mobQatar.slice(1)
                  : mobQatar;

                const whatsappPayload = {
                  appkey: process.env.WHATSAPP_APP_KEY,
                  authkey: process.env.WHATSAPP_AUTH_KEY,
                  to: formattedNumber,
                  template_id: "attendance_updates_new",
                  language: "en_us",
                  variables: {
                    "{{1}}": notificationDate,
                  },
                };

                const response = await axios.post(
                  "https://waba.bulkymarketing.com/api/create-message",
                  whatsappPayload,
                  {
                    headers: { "Content-Type": "application/json" },
                  }
                );
                console.log(`WhatsApp message sent to ${formattedNumber}`, response.data);
              } catch (whatsappError) {
                console.error("Failed to send WhatsApp message:", whatsappError.message);
                if (whatsappError.response) {
                  console.error("Error Response Data:", whatsappError.response.data);
                  console.error("Error Status:", whatsappError.response.status);
                  console.error("Error Headers:", whatsappError.response.headers);
                }
              }
            }
          }

          res.status(200).json({
            success: true,
            message: "CSV uploaded and processed successfully",
          });
        } catch (error) {
          console.error("Error processing attendance data:", error);
          res.status(500).json({
            success: false,
            error: "Failed to process CSV data",
          });
        } finally {
          fs.unlinkSync(filePath); // Clean up uploaded file
        }
      });
  } catch (error) {
    console.error("CSV Upload Error:", error);
    res.status(500).json({
      success: false,
      error: "Error processing CSV file",
    });
  }
};


//------------------------added whtspp notifications------------------------



const getAllAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate that both startDate and endDate are provided
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "Please provide both startDate and endDate",
      });
    }

    // Convert to Date objects and ensure endDate includes the full day
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Fetch attendance records within the date range
    const attendanceRecords = await Attendance.find({
      date: { $gte: start, $lte: end },
    }).populate({
      path: "Emp_id",
      select: "employeeId name department",
      populate: {
        path: "department",
        select: "dep_name",
      },
    });

    const setSchedules = await SetSchedule.find().populate({
      path: "scheduleId",
      select:
        "scheduleName scheduleA scheduleB scheduleC breakTimePeriod setType totalScheduleTime",
      model: "Schedule",
    });

    const attendanceRemarks = await AttendanceRemark.find();
    const attendanceRemarkMap = attendanceRemarks.reduce((map, remark) => {
      map[remark.attendanceId] = remark;
      return map;
    }, {});

    const setScheduleMap = setSchedules.reduce((map, setSchedule) => {
      const { employeeId, startDate, endDate, scheduleId } = setSchedule;
      if (!map[employeeId]) {
        map[employeeId] = [];
      }
      map[employeeId].push({ startDate, endDate, schedule: scheduleId });
      return map;
    }, {});

 

    const validateAttendance = (schedule, attendance) => {
      if (!schedule) return "Inaccurate";
    
      const { setType, breakTimePeriod } = schedule;
      const breakMinutes = breakTimePeriod ? parseFloat(breakTimePeriod) * 60 : 0;
    
      const scheduleTimes = [
        schedule.scheduleA,
        schedule.scheduleB,
        schedule.scheduleC,
      ];
    
      if (setType === "broken") {
        const gracePeriod = 4; // Punch time grace period in minutes
        const totalTimeGracePeriod = 30; // Total time grace period in minutes
        const csvTimes = [
         
        ];
    
        // Check if all times are N/A (Off condition)
        const allTimesNA = csvTimes.every((shift) => !shift.in && !shift.out);
        if (allTimesNA) return "Inaccurate";
    
        // Step 1: Punch Validation
        let punchValidationPassed = true;
        for (let i = 0; i < scheduleTimes.length; i++) {
          const scheduleShift = scheduleTimes[i];
          const csvShift = csvTimes[i];
    
          // Skip if no schedule shift exists
          if (!scheduleShift || (!scheduleShift.in && !scheduleShift.out)) continue;
    
          // If punch times are missing, mark as inaccurate
          if (!csvShift.in || !csvShift.out) {
            punchValidationPassed = false;
            break;
          }
    
          const scheduleIn = toMinutes(scheduleShift.in);
          const scheduleOut = toMinutes(scheduleShift.out);
          const csvIn = toMinutes(csvShift.in);
          const csvOut = toMinutes(csvShift.out);
    
          // Check if punch times are within 4-minute grace period
          if (
            csvIn > scheduleIn + gracePeriod ||
            csvOut < scheduleOut - gracePeriod
          ) {
            punchValidationPassed = false;
            break;
          }
        }
    
        // If punch validation fails, return "Inaccurate" immediately
        if (!punchValidationPassed) return "Inaccurate";
    
        // Step 2: Total Time Validation (only if punch validation passes)
        const totalScheduledMinutes = convertToMinutes(schedule.totalScheduleTime);
        const totalPunchedMinutes = convertToMinutes(attendance.totalInTime);
    
        if (totalPunchedMinutes < totalScheduledMinutes - totalTimeGracePeriod) {
          return "Inaccurate";
        }
    
        return "Accurate";
      }
    
      if (setType === "straight") {
        const totalScheduledTime = schedule.totalScheduleTime;
        const totalCSVWorkingHours = convertToMinutes(attendance.totalInTime);
        const totalScheduledMinutes = convertToMinutes(totalScheduledTime);
    
        if (totalCSVWorkingHours >= totalScheduledMinutes) {
          return "Accurate";
        } else {
          return "Inaccurate";
        }
      }
    
      return "Inaccurate";
    };

    const processedAttendance = attendanceRecords.map((record) => {
      const employeeSchedules = setScheduleMap[record.Emp_id._id.toString()];
      const applicableSetSchedule = employeeSchedules?.find(
        (sch) => record.date >= sch.startDate && record.date <= sch.endDate
      );
      const schedule = applicableSetSchedule
        ? applicableSetSchedule.schedule
        : null;
     

      const remark = attendanceRemarkMap[record._id.toString()];


      return {
        ...record._doc,
        department: record.Emp_id.department.dep_name,
        scheduleName: schedule?.scheduleName || "No schedule assigned",
        setType: schedule?.setType || "N/A",
        scheduleTimes: {
          A: schedule?.scheduleA || { in: "N/A", out: "N/A" },
          B: schedule?.scheduleB || { in: "N/A", out: "N/A" },
          C: schedule?.scheduleC || { in: "N/A", out: "N/A" },
        },
        csvTimes: {
          A: { in: record.clockIn1 || "N/A", out: record.clockOut1 || "N/A" },
          B: { in: record.clockIn2 || "N/A", out: record.clockOut2 || "N/A" },
          C: { in: record.clockIn3 || "N/A", out: record.clockOut3 || "N/A" },
        },
      };
    });

    res.status(200).json({ success: true, attendance: processedAttendance });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res
      .status(500)
      .json({ success: false, error: "Error fetching attendance data" });
  }
};








//------------ filter ----------------






const getSetSchedulesForOne = async (req, res) => {
  try {
    const { id } = req.params; // Employee ID

    // Fetch the set schedule details for the given employee ID
    const setSchedule = await SetSchedule.findOne({ employeeId: id })
      .populate({
        path: "scheduleId",
        select: "scheduleName scheduleA scheduleB scheduleC",
        model: "Schedule",
      })
      .populate({
        path: "employeeId",
        select: "employeeId name department",
        populate: {
          path: "department",
          select: "dep_name",
        },
      });

    if (!setSchedule) {
      return res
        .status(404)
        .json({ success: false, message: "Set schedule not found" });
    }

    res.status(200).json({ success: true, schedule: setSchedule });
  } catch (error) {
    console.error("Error fetching set schedule details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



// GET /api/analytics/employees-per-department
const getEmployeesPerDepartment = async (req, res) => {
  try {
    const result = await Employee.aggregate([
      {
        $lookup: {
          from: "departments",
          localField: "department",
          foreignField: "_id",
          as: "departmentInfo",
        },
      },
      { $unwind: "$departmentInfo" },
      {
        $group: {
          _id: "$departmentInfo.dep_name",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          department: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error in employee count per department:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};






const getEmployeeCountByWorkLocation = async (req, res) => {
  try {
    const result = await Employee.aggregate([
      {
        $group: {
          _id: "$workLocation",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          location: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching work location count:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};





const getOffAndHalfOffEmployees = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Aggregate AttendanceRemarks and join with Attendance
    const remarks = await AttendanceRemark.aggregate([
      {
        $match: {
          status: { $in: ["OFF", "Half_OFF"] }
        }
      },
      {
        $lookup: {
          from: "attendances", // your collection name (check in MongoDB)
          localField: "attendanceId",
          foreignField: "_id",
          as: "attendance"
        }
      },
      { $unwind: "$attendance" },
      {
        $match: {
          "attendance.date": { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: {
            employeeId: "$employeeId",
            attendanceId: "$attendanceId",
            status: "$status"
          }
        }
      },
      {
        $group: {
          _id: "$_id.employeeId",
          counts: {
            $push: {
              status: "$_id.status"
            }
          }
        }
      }
    ]);

    // Convert to employeeId: { OFF, Half_OFF } map
   // Convert to employeeId: { OFF, Half_OFF } map
    const remarkCountsMap = {};

    remarks.forEach(({ _id: empId, counts }) => {
      const id = empId.toString();
      if (!remarkCountsMap[id]) {
        remarkCountsMap[id] = { OFF: 0, Half_OFF: 0 };
      }

      for (const { status } of counts) {
        if (status === "OFF") remarkCountsMap[id].OFF += 1;
        else if (status === "Half_OFF") remarkCountsMap[id].Half_OFF += 1;
      }
    });


    // Fetch employee data + filter departments
    // Step 1: Extract employee IDs
const employeeIds = Object.keys(remarkCountsMap);

// Step 2: Fetch all employees in a single query
const employees = await Employee.find({ _id: { $in: employeeIds } })
  .populate("userId", "name")
  .populate("department", "dep_name");

// Step 3: Convert to Map for faster access
const employeeMap = new Map();
employees.forEach(emp => {
  employeeMap.set(emp._id.toString(), emp);
});

// Step 4: Map final results
const result = employeeIds.map(empId => {
  const employee = employeeMap.get(empId);
  const counts = remarkCountsMap[empId];

  const excludedDepartments = [
    "GRAPHICS DEPARTMENT",
    "IT DEPARTMENT",
    "BUYING DEP",
    "FINANCE DEPARTMENT",
    "MANAGEMENT"
  ];

  if (
    !employee ||
    !employee.department ||
    excludedDepartments.includes(employee.department.dep_name)
  ) return null;

  if (counts.OFF <= 2 && counts.Half_OFF <= 4) return null;

  return {
    name: employee.userId?.name || "Unknown",
    Emp_Id: employee.employeeId || "Unknown",
    department: employee.department.dep_name,
    OFF: counts.OFF,
    Half_OFF: counts.Half_OFF
  };
}).filter(Boolean);


    const filtered = result.filter(Boolean);
    res.status(200).json({ success: true, data: filtered });

  } catch (error) {
    console.error("Error in getOffAndHalfOffEmployees:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};



module.exports = {
  getSetSchedulesForOne,
  deleteSetSchedules,
  getAllAttendance,
  uploadCSV,
  getAttendanceUnderSupervisor,
  getEmployeesPerDepartment,
  getAttendanceChartData,
  getEmployeeCountByWorkLocation,
  getVisaStatusCount,
  getOffAndHalfOffEmployees
};
