const Department = require("../models/departments");
const Employee = require("../models/employee");
const Leave = require("../models/Leave");




const getSummary = async(req,res) => {
    try {
        
        const totalEmployees = await Employee.countDocuments();

        const totalDepartment = await Department.countDocuments();

        const totalSalaries = await Employee.aggregate([
            {$group: {_id:null, totalSalary:{$sum : "$salary"}}}
        ])

        const employeeAppliedForLeaves = await Leave.distinct("employeeId");

        const leaveStatus = await Leave.aggregate([
            {
                $group: {
                    _id: "$status", // Group by the status field
                    count: { $sum: 1 }
                }
            }
        ]);
        
        const leaveSummary = {
            appliedFor: employeeAppliedForLeaves.length,
            approved: leaveStatus.find(item => item._id === "Approved")?.count || 0,
            rejected: leaveStatus.find(item => item._id === "Rejected")?.count || 0,
            pending: leaveStatus.find(item => item._id === "Pending")?.count || 0,
        };
        
        console.log(leaveSummary);
        

        return res.status(200).json({
            success:true,
            totalEmployees,
            totalDepartment,
            totalSalaries : totalSalaries[0]?.totalSalary || 0 ,
            leaveSummary

        })


    } catch (error) {
        return res.status(500).json({ success: false, error: "Dashboard get server error" });
    }
}

module.exports = {getSummary}