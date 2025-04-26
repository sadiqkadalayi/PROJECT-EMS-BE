const mongoose = require('mongoose');
const { rewardsDB } = require('../../config/db'); // Import the rewardsDB connection

// Define the schema for the CSV format
const masterRecordSchema = new mongoose.Schema({
    userId:{ type: mongoose.Schema.Types.ObjectId,
        ref: 'onlineUser', // Reference to the Attendance record
        required: true,},
    date: { type: Date, required: true },
    shippingCharge: { type: String, required: true },
    orderId: { type: String, required: true },
    collector: { type: String, required: true },
    driver: { type: String, required: true },
    dOut: { type: String, required: true },
    dIn: { type: String, required: true },
    deliveryArea: { type: String, required: true },
    totalAmount: { type: Number, required: true },
});

// Bind the schema to the rewards database
const MasterRecord = rewardsDB.model('MasterRecord', masterRecordSchema);

module.exports = MasterRecord;