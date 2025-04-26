// Backend - Router (attendanceRoutes.js)
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { verifyUser } = require('../middleware/authMiddleware');
const { uploadCSV, getAllAttendance, getAttendanceUnderSupervisor, 
    getEmployeesPerDepartment, getAttendanceChartData, getEmployeeCountByWorkLocation, 
    getVisaStatusCount,
    getOffAndHalfOffEmployees} = require("../controllers/attendanceController");


const upload = multer({ dest: "uploads/" });


router.get("/chart-off-halfoff-employees",verifyUser, getOffAndHalfOffEmployees);
router.get("/getVisaStatusCount",verifyUser, getVisaStatusCount);
router.get("/location-count",verifyUser, getEmployeeCountByWorkLocation);
router.get("/summary-status",verifyUser, getAttendanceChartData);
router.get("/getEmployeesPerDepartment",verifyUser, getEmployeesPerDepartment);
router.post("/upload",verifyUser, upload.single("file"), uploadCSV);
router.get("/",verifyUser, getAllAttendance);
router.get("/attendance-under-supervisor",verifyUser, getAttendanceUnderSupervisor);

module.exports = router;