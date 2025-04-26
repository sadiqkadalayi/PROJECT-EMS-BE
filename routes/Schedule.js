const express = require('express');
const { verifyUser } = require('../middleware/authMiddleware');
const { createSchedule, getSchedules, updateSchedule, deleteSchedule, getScheduleById, getSchedulesForSupervisor, getSchedulesForemployee, getSetScheduleForemployee, updateSetScheduleForemployee } = require('../controllers/scheduleController');



var router = express.Router();

router.post('/add', verifyUser, createSchedule);
router.put('/for-employee/:id', verifyUser, updateSetScheduleForemployee);
router.get('/all', verifyUser, getSchedules);
router.get('/supervisor', verifyUser, getSchedulesForSupervisor);
router.get('/for-employee', verifyUser, getSchedulesForemployee);
router.get('/for-employee/:id', verifyUser, getSetScheduleForemployee);
router.get('/:id', verifyUser, getScheduleById);
router.put('/edit/:id', updateSchedule); // Update Schedule
router.delete('/delete/:id', deleteSchedule); // Delete Schedule




module.exports=router;