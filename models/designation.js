var mongoos = require('mongoose');
const Employee = require('./employee');
const Leave = require('./Leave');
const Salary = require('./Salary');

const designationSchema = new mongoos.Schema({
    des_name:{
        type:String,
        required:true,
    },
    description:{
        type:String,

    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    updatedAt:{
        type:Date,
        default:Date.now
    }
})

// departmentSchema.pre("deleteOne", {document:true, query:false}, async function(next) {
//     try {
//         const employees = await Employee.find({department: this._id})
//         const empids = employees.map((emp)=>emp._id)

//         await Employee.deleteMany({department: this._id})
//         await Leave.deleteMany({employeeId:{$in: empids}})
//         await Salary.deleteMany({employeeId:{$in: empids}})
//         next()
//     } catch (error) {
//         next(error)
//     }
// })

const Designation = mongoos.model("Designation", designationSchema)
module.exports=Designation