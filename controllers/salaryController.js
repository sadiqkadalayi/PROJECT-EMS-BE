const Employee = require("../models/employee");
const Salary = require("../models/Salary");



const addSalary =  async (req,res) =>{
    try {
        const {employeeId, basicSalary, allowance, deduction, payDate} = req.body;

        const totalSalary = parseInt(basicSalary) + parseInt(allowance) - parseInt(deduction);
        const newSalary = new Salary({
            employeeId,
            basicSalary, 
            allowance,
            deduction,
            netSalary:totalSalary,
            payDate
        })

        await newSalary.save();
        return res.status(200).json({success:true })

    } catch (error) {
        return res.status(500).json({success:false, error:"Salary Post server error"});
    }
}

// const getSalary = async (req,res) =>{
//     try {
//         const {id} = req.params;
//         let salary 
//         salary = await Salary.find({employeeId: id}).populate("employeeId","employeeId")
//         if(!salary || salary.length < 1 ){
//             const employee = await Employee.findOne({userId:id})
//             salary = await Salary.find({employeeId:employee._id}).populate("employeeId","employeeId")
//         }
//         return res.status(200).json({success:true , salary })
//     } catch (error) {
//         return res.status(500).json({success:false, error:"Salary get server error"});
//     }
// }


const getSalary = async (req, res) => {
    try {
      const { id } = req.params;
      let salary;
      salary = await Salary.find({ employeeId: id }).populate("employeeId", "employeeId");
      if (!salary || salary.length < 1) {
        const employee = await Employee.findOne({ userId: id });
        if (!employee) {
          return res.status(404).json({ success: false, error: "Employee not found" });
        }
        salary = await Salary.find({ employeeId: employee._id }).populate("employeeId", "employeeId");
      }
      
      return res.status(200).json({ success: true, salary });
    } catch (error) {
      console.error("Error fetching salary:", error); // Log the error to the console
      return res.status(500).json({ success: false, error: "Salary get server error" });
    }
  };
  

module.exports = {addSalary,getSalary}