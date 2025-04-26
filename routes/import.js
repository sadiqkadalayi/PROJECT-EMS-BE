const express = require('express');
const { verifyUser } = require('../middleware/authMiddleware');

var router = express.Router();

const { importEmployees, uploadImport, deleteEmployee } = require('../controllers/importController');




// const upload = multer({ dest: 'public/uploads' });


router.post('/import-data-emp', verifyUser, uploadImport.single('file'), importEmployees);

router.delete('/delete-employee', verifyUser,  deleteEmployee);




module.exports=router;