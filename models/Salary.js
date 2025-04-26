var mongoose = require('mongoose');
const Schema = require('mongoose')

const salarySchema = new mongoose.Schema({
    employeeId:{
            type: Schema.Types.ObjectId,
            ref: "Employee" ,
            required:true
        },
    basicSalary:{type:Number, required:true},
    allowance:{type:Number},
    deduction:{type:Number},
    netSalary:{type:Number},
    payDate:{type:Date},
    createdAt: {type:Date, default:Date.now},
    updatedAt: {type:Date, default:Date.now},
})



const Salary = mongoose.model("Salary", salarySchema)
module.exports= Salary