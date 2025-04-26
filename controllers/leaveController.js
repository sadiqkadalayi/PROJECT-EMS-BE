const Employee = require("../models/employee");
const Leave = require("../models/Leave");


const addLeaves = async (req,res) => {
    try {
        const {userId, leaveType, startDate, endDate, reason} = req.body;

        const employee = await Employee.findOne({userId})

        const newLeave = new Leave({
            employeeId:employee._id, leaveType, startDate, endDate, reason
        })

        await newLeave.save();
        return res.status(200).json({success:true })

    } catch (error) {
        return res.status(500).json({success:false, error:"Leave Post server error"});
    }
}

const getLeaves = async (req, res) => {
  try {
    const { id } = req.params;

    let leaves = await Leave.find({ employeeId: id });

    if (!leaves || leaves.length === 0) {
      const employee = await Employee.findOne({ userId: id });
      if (!employee) {
        return res.status(404).json({ success: false, error: "Employee not found" });
      }
      leaves = await Leave.find({ employeeId: employee._id });
      if (!leaves || leaves.length < 1) {
        return res.status(200).json({ success: true, message: "No leaves recorded" });
      }
    }

    return res.status(200).json({ success: true, leaves });

  } catch (error) {
    console.error("Error fetching leaves:", error); // Log the error to the console
    return res.status(500).json({ success: false, error: "Leave Get server error" });
  }
};




  const getAdminLeavesDetail = async(req, res) => {
    try {
      const {id} = req.params;
      const leavesDetail = await Leave.findById({_id:id}).populate({
        path:"employeeId",
        populate:[
          {
            path:"department",
            select:"dep_name"
          },
          {
            path:"userId",
            select:"name, profileImage"
          }
        ]
      })
      
      return res.status(200).json({ success: true, leavesDetail });
  
    } catch (error) {
      return res.status(500).json({ success: false, error: "Leave Get detail server error" });
    }
  }



  const getAdminLeaves = async (req,res) => {
    try {

      const leaves = await Leave.find().populate({
        path:"employeeId",
        populate:[
          {
            path:"department",
            select:"dep_name"
          },
          {
            path:"userId",
            select:"name"
          }
        ]
      })
      
      return res.status(200).json({ success: true, leaves });
  
    } catch (error) {
      return res.status(500).json({ success: false, error: "Admin Leave Get server error" });
    }
  }
  

const updatedLeaveStatus =async (req,res) => {
  try {
    const {id} = req.params;
    const {status} = req.body;
    const leave = await Leave.findByIdAndUpdate({_id:id}, {status:status})

    if(!leave){
      return res.status(404).json({ success: false, error: "Leav Not Found" });
    }

    return res.status(200).json({success:true})

  } catch (error) {
    return res.status(500).json({ success: false, error: "Update Leave Status server error" });
  }
}



module.exports = {addLeaves,getLeaves,getAdminLeaves,getAdminLeavesDetail, updatedLeaveStatus}