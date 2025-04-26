

const Employee = require('../models/employee');
const User = require('../models/user');
const Department = require('../models/departments');
const Designation = require('../models/designation');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Attendance = require('../models/attendance');
const AttendanceRemark = require('../models/attendanceRemark');
const File = require('../models/File');
const Leave = require('../models/Leave');

// Multer configuration for temporary local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads'); // Temporarily store files locally
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
  },
});

const uploadImport = multer({ storage });

const importEmployees = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const employees = [];

    fs.createReadStream(file.path)
      .pipe(csv())
      .on('data', (row) => {
        employees.push(row);
      })
      .on('end', async () => {
        try {
          for (const emp of employees) {
            const {
              EMPLOYEE_ID,
              NAME,
              EMAIL,
              ROLE,
              QID_NO,
              NATIONALITY,
              BLOOD_GROUP,
              MOB_QATAR,
              MOB_NATIVE,
              SUPERVISOR,
              DATE_OF_BIRTH,
              GENDER,
              MARITAL_STATUS,
              DESIGNATION,
              DEPARTMENT,
              SALARY,
              VISA_STATUS,
              VISA_VALIDITY,
              WORK_LOCATION,
              STATUS,
              CREATED_AT,
              UPDATED_AT,
              PROFILE_IMAGE
            } = emp;

            // Validation for required fields
            if (!DESIGNATION || !DEPARTMENT) {
              console.error(`Skipping employee ${EMPLOYEE_ID}: Missing required fields`);
              continue; // Skip this employee and move to the next one
            }

            // Find the ObjectId for designation and department
            const designationDoc = await Designation.findOne({ des_name: DESIGNATION });
            const departmentDoc = await Department.findOne({ dep_name: DEPARTMENT });
            const supervisorDoc = await Employee.findOne({ employeeId: SUPERVISOR });

            if (!designationDoc) {
              console.error(`Skipping employee ${EMPLOYEE_ID}: Invalid designation "${DESIGNATION}"`);
              continue; // Skip this employee and move to the next one
            }

            if (!departmentDoc) {
              console.error(`Skipping employee ${EMPLOYEE_ID}: Invalid department "${DEPARTMENT}"`);
              continue; // Skip this employee and move to the next one
            }

            const designationId = designationDoc._id;
            const departmentId = departmentDoc._id;
            const supervisorId = supervisorDoc ? supervisorDoc._id : null;

            // Check if the employee exists
            let employee = await Employee.findOne({ employeeId: EMPLOYEE_ID });

            if (employee) {
              // Update existing employee
              const user = await User.findById(employee.userId);
              if (user) {
                user.name = NAME;
                user.email = EMAIL;
                user.role = ROLE;
                user.profileImage = PROFILE_IMAGE || ''; // Use PROFILE_IMAGE from CSV or default to empty string
                await user.save();
              }

              employee.qidNo = QID_NO;
              employee.nationality = NATIONALITY;
              employee.bloodGroup = BLOOD_GROUP;
              employee.mobQatar = MOB_QATAR;
              employee.mobNative = MOB_NATIVE;
              employee.supervisor = supervisorId;
              employee.dob = DATE_OF_BIRTH;
              employee.gender = GENDER;
              employee.maritalStatus = MARITAL_STATUS;
              employee.designation = designationId;
              employee.department = departmentId;
              employee.salary = SALARY;
              employee.visaStatus = VISA_STATUS;
              employee.visaValidity = VISA_VALIDITY;
              employee.workLocation = WORK_LOCATION;
              employee.status = STATUS;
              await employee.save();
            } else {
              // Create new user
              const newUser = new User({
                name: NAME,
                email: EMAIL,
                role: ROLE,
                profileImage: PROFILE_IMAGE || '' // Use PROFILE_IMAGE from CSV or default to empty string
              });

              const savedUser = await newUser.save();

              // Create new employee
              const newEmployee = new Employee({
                userId: savedUser._id,
                employeeId: EMPLOYEE_ID,
                qidNo: QID_NO,
                nationality: NATIONALITY,
                bloodGroup: BLOOD_GROUP,
                mobQatar: MOB_QATAR,
                mobNative: MOB_NATIVE,
                supervisor: supervisorId,
                dob: DATE_OF_BIRTH,
                gender: GENDER,
                maritalStatus: MARITAL_STATUS,
                designation: designationId,
                department: departmentId,
                salary: SALARY,
                visaStatus: VISA_STATUS,
                visaValidity: VISA_VALIDITY,
                workLocation: WORK_LOCATION,
                status: STATUS
              });

              await newEmployee.save();
            }
          }

          res.status(200).json({ success: true, message: "Employees imported successfully" });
        } catch (error) {
          console.error("Error importing employees:", error);
          res.status(500).json({ success: false, error: "Server Error" });
        } finally {
          // Remove the temporary local file
          if (fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
              console.log("Temporary file deleted:", file.path);
            } catch (error) {
              console.error("Error deleting temporary file:", error.message);
            }
          }
        }
      });
  } catch (error) {
    console.error("Error importing employees:", error);
    return res.status(500).json({ success: false, error: "Server Error" });
  }
};

module.exports = { importEmployees };










const deleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.body;

    // Find the employee by employeeId
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ success: false, error: "Employee not found" });
    }

    // Delete associated user
    await User.findByIdAndDelete(employee.userId);

    // Delete associated attendance records
    await Attendance.deleteMany({ Emp_id: employee._id });

    // Delete associated attendance remarks
    await AttendanceRemark.deleteMany({ employeeId: employee._id });

    // Delete associated files
    await File.deleteMany({ text: employee._id });

    // Delete associated leave records
    await Leave.deleteMany({ employeeId: employee._id });

    // Delete the employee
    await Employee.findByIdAndDelete(employee._id);

    res.status(200).json({ success: true, message: "Employee and associated data deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

module.exports = { deleteEmployee, importEmployees, uploadImport };