const mongoose = require('mongoose');
const { rewardsDB } = require('../../config/db'); // Import the rewardsDB connection

// Define the schema for the CSV format
const onlineUserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mobNumber: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Bind the schema to the rewards database
const OnlineUser = rewardsDB.model('onlineUser', onlineUserSchema); // Use 'onlineUser' as the collection name

module.exports = OnlineUser;