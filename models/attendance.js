const mongoose = require('mongoose');
const Schema = require('mongoose')

const attendanceSchema = new mongoose.Schema({
  Emp_id: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  name: { type: String, required: true },
  date: { type: Date, required: true },
  clockIn1: { type: String },
  clockOut1: { type: String },
  workTime1: { type: String, default: "0h 0m" }, // Change to String to store formatted time
  clockIn2: { type: String },
  clockOut2: { type: String },
  workTime2: { type: String, default: "0h 0m" }, // Change to String to store formatted time
  clockIn3: { type: String },
  clockOut3: { type: String },
  workTime3: { type: String, default: "0h 0m" }, // Change to String to store formatted time
  totalInTime: { type: String, default: "0h 0m" }, // Change to String to store formatted time
  status: { type: String, enum: ["Active", "Off"], default: "Off" },
});


const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
