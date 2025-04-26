const express = require('express');
const { verifyUser } = require('../middleware/authMiddleware');
const { addLeaves, getLeaves, getAdminLeaves, getAdminLeavesDetail, updatedLeaveStatus } = require('../controllers/leaveController');


var router = express.Router();

router.post('/add', verifyUser, addLeaves)
router.get('/:id', verifyUser, getLeaves)
router.put('/:id', verifyUser, updatedLeaveStatus)
router.get('/detail/:id', verifyUser, getAdminLeavesDetail)
router.get('/', verifyUser, getAdminLeaves)



module.exports=router;