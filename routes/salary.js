const express = require('express');
const { verifyUser } = require('../middleware/authMiddleware');
const { addSalary, getSalary } = require('../controllers/salaryController');

var router = express.Router();

router.post('/add', verifyUser, addSalary)
router.get('/:id', verifyUser, getSalary)


module.exports=router;