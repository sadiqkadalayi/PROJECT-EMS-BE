const mongoose = require('mongoose');
const { rewardsDB } = require('../../config/db'); // Import the rewardsDB connection

// Define the schema for the CSV format
const pointMasterSchema = new mongoose.Schema({
    master:{ type: mongoose.Schema.Types.ObjectId,
            ref: 'onlineUser', // Reference to the Attendance record
            required: true,},
    totalAmount: { type: Number, required: true },
    totalPoints: { type: Number, required: true },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Bind the schema to the rewards database
const pointMaster = rewardsDB.model('pointMaster', pointMasterSchema); // Use 'onlineUser' as the collection name

module.exports = pointMaster;