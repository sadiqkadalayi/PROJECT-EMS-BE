

const express = require('express');
const { verifyUser } = require('../middleware/authMiddleware');
const { uploadCompanyDoc, uploadCompDoc, getAllDocuments, removeDocuments } = require('../controllers/compDocController');

const router = express.Router();

router.post('/Upload-doc',verifyUser, uploadCompDoc.single('file'), uploadCompanyDoc);
router.get('/get-all',verifyUser, getAllDocuments);
router.delete('/remov-rec/:id',verifyUser, removeDocuments);


module.exports = router