

const express = require('express');
const { verifyUser } = require('../middleware/authMiddleware');
const { addDepartment, getDepartment, editDepartment, updateDepartment, deleteDepartment } = require('../controllers/departmentController');
const router = express.Router();


router.get('/', verifyUser, getDepartment)
router.post('/add', verifyUser, addDepartment)
router.get('/:id', verifyUser, editDepartment)
router.put('/:id', verifyUser, updateDepartment)
router.delete('/:id', verifyUser, deleteDepartment)

module.exports = router