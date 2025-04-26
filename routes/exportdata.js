const express = require('express');
const { verifyUser } = require('../middleware/authMiddleware');
const { exportEmployees } = require('../controllers/exportdataController');

var router = express.Router();






// const upload = multer({ dest: 'public/uploads' });

router.get('/export-all-employees', verifyUser, exportEmployees);




module.exports=router;