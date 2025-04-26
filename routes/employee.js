const express = require('express');
const { verifyUser } = require('../middleware/authMiddleware');
const { addEmployee, upload, getEmployee, getEmployeeOne, 
        updateEmployee, fetchEmployeesByDepId, getSupervisors, 
        getEmployeesForSupervisor, setScheduleInSelectedEmp,
        getSetSchedules,
        getAllSetSchedules,
        
        } = require('../controllers/employeeController');
var router = express.Router();
const multer = require('multer');
const { deleteSetSchedules, getSetSchedulesForOne } = require('../controllers/attendanceController');


// const upload = multer({ dest: 'public/uploads' });

router.post('/add', verifyUser, upload.single('image'), addEmployee)
router.get('/', verifyUser, getEmployee)
router.get('/supervisors', verifyUser, getSupervisors);



router.get("/supervisor", verifyUser,  getEmployeesForSupervisor);
router.post("/set-schedule", verifyUser,  setScheduleInSelectedEmp);
router.get("/get-set-schedule", verifyUser,  getSetSchedules);
router.get("/get-all-set-schedule", verifyUser,  getAllSetSchedules);
router.delete("/delete-set-schedule/:id", verifyUser,  deleteSetSchedules);
router.get("/get-set-schedule/:id", verifyUser,  getSetSchedulesForOne);

router.get('/:id', verifyUser, getEmployeeOne)
router.put('/:id', verifyUser, upload.single('image'), updateEmployee)
router.get('/department/:id', verifyUser, fetchEmployeesByDepId)


module.exports=router;