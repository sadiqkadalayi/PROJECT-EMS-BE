const User = require("../models/user");
const Employee = require("../models/employee");
const bcrypt = require('bcrypt');




const changePassword = async (req, res) => {
  try {
    const { email, employeeId, newPassword } = req.body;

    let user;

    if (employeeId) {
      // Find the employee by employeeId
      const employee = await Employee.findOne({ employeeId });
      if (!employee) {
        return res.status(404).json({ success: false, error: "Employee Not Found" });
      }

      // Find the user by userId from the employee document
      user = await User.findById(employee.userId);
      if (!user) {
        return res.status(404).json({ success: false, error: "User Not Found" });
      }
    } else if (email) {
      // Find the user by email
      user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ success: false, error: "User Not Found" });
      }
    } else {
      return res.status(400).json({ success: false, error: "Either employeeId or email must be provided" });
    }

    // Hash the new password
    const hashPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await User.findByIdAndUpdate(user._id, { password: hashPassword });

    return res.status(200).json({ success: true, message: "Password Successfully Changed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Settings server error" });
  }
};






module.exports = { changePassword };