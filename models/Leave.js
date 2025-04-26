var mongoose = require('mongoose');
const Schema = require('mongoose')

const leaveSchema = new mongoose.Schema({
    employeeId:{
            type: Schema.Types.ObjectId,
            ref: "Employee" ,
            required:true
        },
    leaveType:{
        type:String,
        enum:["Sick Leave","Casual Leave","Annual Leave"],
        required:true
    },
    startDate:{type:Date},
    endDate:{type:Date},
    reason:{type:String},
    status:{
        type:String,
        enum:["Pending","Approved","Rejected"],
        default:"Pending"
    },
    applieddAt: {type:Date, default:Date.now},
    updatedAt: {type:Date, default:Date.now},
})



const Leave = mongoose.model("Leave", leaveSchema)
module.exports= Leave