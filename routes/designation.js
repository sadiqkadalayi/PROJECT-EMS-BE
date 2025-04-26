



const express = require('express');
const { verifyUser } = require('../middleware/authMiddleware');
const { addDesignation, getDesignation, editDesignation, updateDesignation } = require('../controllers/designationController');
const router = express.Router();



router.get('/', verifyUser, getDesignation)
router.get('/:id', verifyUser, editDesignation)
router.put('/:id', verifyUser, updateDesignation)
router.post('/add', verifyUser, addDesignation)


module.exports = router