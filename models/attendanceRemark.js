const mongoose = require('mongoose');

const AttendanceRemarkSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  attendanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance', // Reference to the Attendance record
    required: true,
  },
  reason: {
    type: String,
    
  },
  documentUrl: {
    type: String,
    
  },
  status: {
    type: String,
    // enum: ['Submitted', 'Accepted', 'Rejected'],
    enum: ['Submitted','OFF','Half_OFF', 'Present', 'Half_Day', 'Absent', 'Medical','Vacation'],
    default: 'Submitted',
  },
  reviewerComment: {
    type: String,
  },
}, { timestamps: true });


const AttendanceRemark = mongoose.model("AttendanceRemark", AttendanceRemarkSchema)
module.exports=AttendanceRemark