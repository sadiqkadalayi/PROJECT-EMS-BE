const express = require('express');
const { verifyUser } = require('../middleware/authMiddleware');
const { getSummary } = require('../controllers/dashboardController');



var router = express.Router();


router.get('/summary', verifyUser, getSummary)



module.exports=router;