const express = require('express');
const { verifyUser } = require('../middleware/authMiddleware');
const { changePassword } = require('../controllers/settingsController');



var router = express.Router();

router.put('/change-password', verifyUser, changePassword)




module.exports=router;