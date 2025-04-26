const express = require('express');
const { verifyUser } = require('../middleware/authMiddleware');
const { addVacationOrRejoin,upload, getAllRecords, getOneRecords, 
    getAllVacationList, getAllrejoinList } = require('../controllers/vacationOrRejoinController');

var router = express.Router();


// Multer config for file uploads



router.get('/vacation-list', verifyUser, getAllVacationList) 
router.get('/rejoin-list', verifyUser, getAllrejoinList) 
router.post('/add', verifyUser,upload.single("File"), addVacationOrRejoin)
router.get('/', verifyUser, getAllRecords) 
router.get('/:id', verifyUser, getOneRecords) 




module.exports=router;