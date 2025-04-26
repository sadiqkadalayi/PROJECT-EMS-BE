const mongoose = require("mongoose");
const Schema = require('mongoose')

const vacationOrRejoinSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    lastDutyDate: { type: Date }, // Only for vacation
    joinDate: { type: Date }, // Only for rejoining
    type: { type: String, enum: ["vacation", "rejoin"], required: true },
    fileUrl: { type: String }, // Cloudinary file URL
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);


const VacationOrRejoin = mongoose.model("VacationOrRejoin", vacationOrRejoinSchema)
module.exports= VacationOrRejoin
