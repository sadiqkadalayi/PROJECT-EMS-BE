const express = require('express');
const { login, verify } = require('../controllers/authController');
const { verifyUser } = require('../middleware/authMiddleware');



const router = express.Router(); 

router.post('/login', login)
router.get('/verify', verifyUser, verify)

module.exports = router