
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const employeeSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
    
  },
  qidNo: {
    type: Number,
    
  },
  nationality: {
    type: String
  },
  bloodGroup: {
    type: String
  },
  mobQatar: {
    type: String
  },
  mobNative: {
    type: String
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  supervisor: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  dob: { type: Date },
  gender: { type: String },
  maritalStatus: { type: String },
  designation: {
    type: Schema.Types.ObjectId,
    ref: "Designation",
    required: true
  },
  department: {
    type: Schema.Types.ObjectId,
    ref: "Department",
    required: true
  },
  salary: { type: Number,default:0 },
  visaStatus: { type: String },
  visaValidity: { type: String },
  workLocation: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Employee = mongoose.model("Employee", employeeSchema);
module.exports = Employee;