const mongoose = require('mongoose');
const { rewardsDB } = require('../../config/db'); // Import the rewardsDB connection

// Define the schema for the CSV format
const redumptionMasterSchema = new mongoose.Schema({
    master:{ type: mongoose.Schema.Types.ObjectId,
            ref: 'onlineUser', // Reference to the Attendance record
            required: true,},
    serialNumber: { type: String, required: true },
    redumptionDate: { type: String, required: true },
    amount: { type: Number, required: true },
    points: { type: Number, required: true },
    status: { type: String, enum: ['Approved', 'Rejected'], default: 'Approved' },
    remarks: { type: String },
        
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Bind the schema to the rewards database
const redumptionMaster = rewardsDB.model('redumptionMaster', redumptionMasterSchema); // Use 'onlineUser' as the collection name

module.exports = redumptionMaster;