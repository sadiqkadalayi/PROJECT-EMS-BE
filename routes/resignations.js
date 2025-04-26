const express = require('express');
const { verifyUser } = require('../middleware/authMiddleware');
const { addResignation, getAllResignedEmployees, getResignedEmployeeDocument } = require('../controllers/resignationController');

var router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });



router.post('/add-resignation',verifyUser, upload.single('settlementDoc'), addResignation);
router.get('/', verifyUser, getAllResignedEmployees);
router.get('/:id', verifyUser, getResignedEmployeeDocument);



module.exports=router;