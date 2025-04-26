

require('dotenv').config(); // Load environment variables from .env file
const mongoose = require('mongoose');

// Connection to the first database
function connectDB() {
    if (!process.env.DBURI) {
        throw new Error('DBURI is not defined in environment variables');
    }
    mongoose.connect(process.env.DBURI, {})
        .then(() => {
            console.log("connected to first DB");
        })
        .catch((err) => {
            console.error("Error connecting to first DB:", err);
        });
}

// Connection to the second database
let secondDB;
function connectSecondDB() {
    if (!process.env.DBURI_TWO) {
        throw new Error('DBURI_TWO is not defined in environment variables');
    }
    secondDB = mongoose.createConnection(process.env.DBURI_TWO, {})
        .on('connected', () => {
            console.log("connected to second DB");
        })
        .on('error', (err) => {
            console.error("Error connecting to second DB:", err);
        });
}

// Connection to the rewards database
let rewardsDB;
function connectDBURI_REWARDS() {
    if (!process.env.DBURI_REWARDS) {
        throw new Error('DBURI_REWARDS is not defined in environment variables');
    }
    rewardsDB = mongoose.createConnection(process.env.DBURI_REWARDS, {})
        .on('connected', () => {
            console.log("connected to DBURI_REWARDS DB");
        })
        .on('error', (err) => {
            console.error("Error connecting to rewards DB:", err);
        });
}

// Initialize connections
connectDB();
connectSecondDB();
connectDBURI_REWARDS();

module.exports = { connectDB, connectSecondDB, secondDB, connectDBURI_REWARDS, rewardsDB };