const Employee = require('../models/employee')
const User = require('../models/user')
const mongoose = require('mongoose');
const Department = require('../models/departments')
const bcrypt = require('bcrypt')
const multer = require('multer')
const path  = require('path')
const FileModel = require('../models/File')
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const VacationRejoin = require('../models/VacationRejoin');
const Designation = require('../models/designation');
const SetSchedule = require('../models/setSchedule'); // Import the SetSchedule model
const axios = require('axios');

const csv = require('csv-parser');


// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });


// Multer configuration for temporary local storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads'); // Temporarily store files locally
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
    },
  });
  
  const upload = multer({ storage });

// const addEmployee = async (req, res) => {
//     try {
//       const {
//         name,
//         qidNo,
//         mobQatar,
//         mobNative,
//         bloodGroup,
//         nationality,
//         email,
//         employeeId,
//         dob,
//         gender,
//         maritalStatus,
//         designation,
//         department,
//         salary,
//         workLocation,
//         supervisor,
//         password,
//         role,
//         visaStatus,
//         visaValidity,
//       } = req.body;
  
//       const user = await User.findOne({ email });
//       if (user) {
//         return res.status(400).json({ success: false, error: 'Email is already registered' });
//       }
  
//       const hashPassword = await bcrypt.hash(password, 10);

//       let uploadedFileUrl = '';
//       if (req.file) {
//         // Upload file to Cloudinary
//         const result = await cloudinary.uploader.upload(req.file.path, {
//           folder: 'employee-profile-images',
//           resource_type: 'image', // Change this to 'raw' for non-image files
        
//         //   public_id: `file_${Date.now() + path.extname(file.originalname)}`, // Optional custom public ID
//         });

//         uploadedFileUrl = result.secure_url;
  
//         // Remove the file from local storage after upload
//         // fs.unlinkSync(req.file.path);
//         if (fs.existsSync(req.file.path)) {
//                   try {
//                     fs.unlinkSync(req.file.path);
//                     console.log("File deleted successfully:", req.file.path);
//                   } catch (error) {
//                     console.error("Error deleting file:", error.message);
//                   }
//                 } else {
//                   console.error("File does not exist:", req.file.path);
//                 }
//       }

//       const newUser = new User({
//         name,
//         email,
//         password: hashPassword,
//         role,
//         profileImage: uploadedFileUrl, // Use the URL from Cloudinary
//       });
  
//       const savedUser = await newUser.save();
  
//       const newEmployee = new Employee({
//         userId: savedUser._id,
//         employeeId,
//         qidNo,
//         mobQatar,
//         mobNative,
//         bloodGroup,
//         nationality,
//         visaStatus,
//         visaValidity,
//         dob,
//         workLocation,
//         supervisor,
//         gender,
//         maritalStatus,
//         designation,
//         department,
//         salary,
//       });
  
//       await newEmployee.save();
//       return res.status(200).json({ success: true, message: 'Employee created' });
//     } catch (error) {
//       console.log(error);
//       return res.status(500).json({ success: false, error: 'Adding employee error' });
//     }
//   };



  // ------------  import CSV file start ----------------


// Multer configuration for temporary local storage





  // ------------  import CSV file  end ----------------








// ------------  active all employees ----------------

// const getEmployee = async (req, res) => {
//   try {
//     const employees = await Employee.find()
//       .populate("userId", { password: 0 })
//       .populate("department")
//       .lean();

//     if (!employees || employees.length === 0) {
//       return res.status(404).json({ success: false, message: "No employees found" });
//     }

//     for (const employee of employees) {
//       const files = await FileModel.find({ text: employee._id }).lean();

//       files.forEach((file) => {
//         const today = new Date();
//         const fileDate = new Date(file.date);
//         const timeDifference = fileDate - today;
//         const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

//         file.status =
//           daysDifference <= 0
//             ? "Expired"
//             : daysDifference <= 14
//             ? "Exp in 2 weeks"
//             : daysDifference <= 30
//             ? "Exp. in 1 Month"
//             : "Valid";

//         file.daysDifference = daysDifference;
//       });

//       employee.files = files;

//       const fetchLatestDocument = async (docName) => {
//         const doc = await FileModel.findOne({ text: employee._id, name: docName })
//           .sort({ date: -1 })
//           .lean();
//         return { name: doc ? doc.name : null, expDate: doc ? doc.date : null };
//       };

//       const qid = await fetchLatestDocument("QID");
//       const passport = await fetchLatestDocument("PASSPORT");
//       const medical = await fetchLatestDocument("MEDICAL");

//       employee.QID = qid.name;
//       employee.qidExp = qid.expDate;
//       employee.PASSPORT = passport.name;
//       employee.passportExp = passport.expDate;
//       employee.MEDICAL = medical.name;
//       employee.medicalExp = medical.expDate;

//       const latestRejoin = await VacationRejoin.findOne({
//         employeeId: employee._id,
//         type: "rejoin",
//         joinDate: { $ne: null },
//       })
//         .sort({ joinDate: -1 })
//         .lean();

//       const latestVacation = await VacationRejoin.findOne({
//         employeeId: employee._id,
//         type: "vacation",
//         lastDutyDate: { $ne: null },
//       })
//         .sort({ lastDutyDate: -1 })
//         .lean();

//       let totalWorkingDays = 0;
//       let totalVacationDays = 0;

//       if (latestVacation && (!latestRejoin || new Date(latestVacation.lastDutyDate) > new Date(latestRejoin.joinDate))) {
//         const lastDutyDate = new Date(latestVacation.lastDutyDate);
//         const today = new Date();
        
//         if (!isNaN(lastDutyDate.getTime())) {
//           totalVacationDays = Math.floor((today - lastDutyDate) / (1000 * 60 * 60 * 24));
//         }
//       } else if (latestRejoin) {
//         const rejoinDate = new Date(latestRejoin.joinDate);
//         const today = new Date();
        
//         if (!isNaN(rejoinDate.getTime())) {
//           totalWorkingDays = Math.floor((today - rejoinDate) / (1000 * 60 * 60 * 24));
//         }
//       }

//       employee.totalWorkingDays = totalWorkingDays > 0 ? totalWorkingDays : 0;
//       employee.totalVacationDays = totalVacationDays > 0 ? totalVacationDays : 0;
//     }

//     return res.status(200).json({ success: true, employees });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ success: false, error: "Server Error" });
//   }
// };

// ------------  active all employees ----------------



// ------------  inactive employees ----------------

// const getEmployee = async (req, res) => {
//   try {
//     const employees = await Employee.find({ status: "active" })
//       .populate("userId", { password: 0 })
//       .populate("department")
//       .lean();

//     if (!employees || employees.length === 0) {
//       return res.status(404).json({ success: false, message: "No employees found" });
//     }

//     for (const employee of employees) {
//       const files = await FileModel.find({ text: employee._id }).lean();

//       files.forEach((file) => {
//         const today = new Date();
//         const fileDate = new Date(file.date);
//         const timeDifference = fileDate - today;
//         const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

//         file.status =
//           daysDifference <= 0
//             ? "Expired"
//             : daysDifference <= 14
//             ? "Exp in 2 weeks"
//             : daysDifference <= 30
//             ? "Exp. in 1 Month"
//             : "Valid";

//         file.daysDifference = daysDifference;
//       });

//       employee.files = files;

//       const fetchLatestDocument = async (docName) => {
//         const doc = await FileModel.findOne({ text: employee._id, name: docName })
//           .sort({ date: -1 })
//           .lean();
//         return { name: doc ? doc.name : null, expDate: doc ? doc.date : null };
//       };

//       const qid = await fetchLatestDocument("QID");
//       const passport = await fetchLatestDocument("PASSPORT");
//       const medical = await fetchLatestDocument("MEDICAL");

//       employee.QID = qid.name;
//       employee.qidExp = qid.expDate;
//       employee.PASSPORT = passport.name;
//       employee.passportExp = passport.expDate;
//       employee.MEDICAL = medical.name;
//       employee.medicalExp = medical.expDate;

//       const latestRejoin = await VacationRejoin.findOne({
//         employeeId: employee._id,
//         type: "rejoin",
//         joinDate: { $ne: null },
//       })
//         .sort({ joinDate: -1 })
//         .lean();

//       const latestVacation = await VacationRejoin.findOne({
//         employeeId: employee._id,
//         type: "vacation",
//         lastDutyDate: { $ne: null },
//       })
//         .sort({ lastDutyDate: -1 })
//         .lean();

//       let totalWorkingDays = 0;
//       let totalVacationDays = 0;

//       if (latestVacation && (!latestRejoin || new Date(latestVacation.lastDutyDate) > new Date(latestRejoin.joinDate))) {
//         const lastDutyDate = new Date(latestVacation.lastDutyDate);
//         const today = new Date();
        
//         if (!isNaN(lastDutyDate.getTime())) {
//           totalVacationDays = Math.floor((today - lastDutyDate) / (1000 * 60 * 60 * 24));
//         }
//       } else if (latestRejoin) {
//         const rejoinDate = new Date(latestRejoin.joinDate);
//         const today = new Date();
        
//         if (!isNaN(rejoinDate.getTime())) {
//           totalWorkingDays = Math.floor((today - rejoinDate) / (1000 * 60 * 60 * 24));
//         }
//       }

//       employee.totalWorkingDays = totalWorkingDays > 0 ? totalWorkingDays : 0;
//       employee.totalVacationDays = totalVacationDays > 0 ? totalVacationDays : 0;
//     }

//     return res.status(200).json({ success: true, employees });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ success: false, error: "Server Error" });
//   }
// };



const addEmployee = async (req, res) => {
    try {
      const {
        name,
        qidNo,
        mobQatar,
        mobNative,
        bloodGroup,
        nationality,
        email,
        employeeId,
        dob,
        gender,
        maritalStatus,
        designation,
        department,
        salary,
        workLocation,
        supervisor,
        password,
        role,
        visaStatus,
        visaValidity,
      } = req.body;
  
      const user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ success: false, error: 'Email is already registered' });
      }
  
      const hashPassword = await bcrypt.hash(password, 10);

      let uploadedFileUrl = '';
      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'employee-profile-images',
          resource_type: 'image',
        });
        uploadedFileUrl = result.secure_url;
  
        if (fs.existsSync(req.file.path)) {
          try {
            fs.unlinkSync(req.file.path);
            console.log("File deleted successfully:", req.file.path);
          } catch (error) {
            console.error("Error deleting file:", error.message);
          }
        } else {
          console.error("File does not exist:", req.file.path);
        }
      }

      const newUser = new User({
        name,
        email,
        password: hashPassword,
        role,
        profileImage: uploadedFileUrl,
      });
  
      const savedUser = await newUser.save();
  
      const newEmployee = new Employee({
        userId: savedUser._id,
        employeeId,
        qidNo,
        mobQatar,
        mobNative,
        bloodGroup,
        nationality,
        visaStatus,
        visaValidity,
        dob,
        workLocation,
        supervisor,
        gender,
        maritalStatus,
        designation,
        department,
        salary,
      });
  
      await newEmployee.save();

      // // Send WhatsApp message
      // // Send WhatsApp message
      //   try {
      //     const formattedNumber = mobQatar.startsWith("+")? mobQatar.slice(1): mobQatar;

      //     const whatsappPayload = {
      //       appkey: process.env.WHATSAPP_APP_KEY,
      //       authkey: process.env.WHATSAPP_AUTH_KEY,
      //       to: formattedNumber,
      //       template_id: "account_creation_confirmation_3",
      //       language: "en_us",
      //       variables: {
      //         "{{1}}": name,
      //         "{{2}}": employeeId,
      //       },
      //     };

      //     // console.log("WhatsApp Payload:", whatsappPayload); // Log the payload for debugging

      //     const response = await axios.post(
      //       "https://waba.bulkymarketing.com/api/create-message", whatsappPayload,
      //       {
      //         headers: { "Content-Type": "application/json" },
      //       }
      //     );
      //     // console.log(`WhatsApp message sent to ${mobQatar}`, response.data);
      //   } catch (whatsappError) {
      //     console.error(
      //       "Failed to send WhatsApp message:",
      //       whatsappError.message
      //     );
      //     if (whatsappError.response) {
      //       console.error("Error Response Data:", whatsappError.response.data); // Log detailed error
      //       console.error("Error Status:", whatsappError.response.status);
      //       console.error("Error Headers:", whatsappError.response.headers);
      //     }
      //   }

      return res.status(200).json({ success: true, message: 'Employee created' });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, error: 'Adding employee error' });
    }
};








const getEmployee = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query; // Default to page 1, limit 10, and empty search term if not provided

    const skip = (page - 1) * limit;

    // Build the search query
    const searchQuery = {
      status: "active",
    };

    if (search) {
      searchQuery.$or = [
        { employeeId: { $regex: search, $options: "i" } },
        { 'userDetails.name': { $regex: search, $options: "i" } }
      ];
    }

    // Find employees based on the search query
    let employees = await Employee.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $match: searchQuery
      },
      {
        $skip: skip
      },
      {
        $limit: parseInt(limit)
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'department'
        }
      },
      {
        $unwind: {
          path: '$department',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          'userDetails.password': 0 // Exclude the password field
        }
      }
    ]);

    if (!employees || employees.length === 0) {
      return res.status(404).json({ success: false, message: "No employees found" });
    }

    const total = await Employee.countDocuments(searchQuery);

    for (const employee of employees) {
      const files = await FileModel.find({ text: employee._id }).lean();

      files.forEach((file) => {
        const today = new Date();
        const fileDate = new Date(file.date);
        const timeDifference = fileDate - today;
        const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

        file.status =
          daysDifference <= 0
            ? "Expired"
            : daysDifference <= 14
            ? "Exp in 2 weeks"
            : daysDifference <= 30
            ? "Exp. in 1 Month"
            : "Valid";

        file.daysDifference = daysDifference;
      });

      employee.files = files;

      const fetchLatestDocument = async (docName) => {
        const doc = await FileModel.findOne({ text: employee._id, name: docName })
          .sort({ date: -1 })
          .lean();
        return { name: doc ? doc.name : null, expDate: doc ? doc.date : null };
      };

      const qid = await fetchLatestDocument("QID");
      const passport = await fetchLatestDocument("PASSPORT");
      const medical = await fetchLatestDocument("MEDICAL");

      employee.QID = qid.name;
      employee.qidExp = qid.expDate;
      employee.PASSPORT = passport.name;
      employee.passportExp = passport.expDate;
      employee.MEDICAL = medical.name;
      employee.medicalExp = medical.expDate;

      const latestRejoin = await VacationRejoin.findOne({
        employeeId: employee._id,
        type: "rejoin",
        joinDate: { $ne: null },
      })
        .sort({ joinDate: -1 })
        .lean();

      const latestVacation = await VacationRejoin.findOne({
        employeeId: employee._id,
        type: "vacation",
        lastDutyDate: { $ne: null },
      })
        .sort({ lastDutyDate: -1 })
        .lean();

      let totalWorkingDays = 0;
      let totalVacationDays = 0;

      if (latestVacation && (!latestRejoin || new Date(latestVacation.lastDutyDate) > new Date(latestRejoin.joinDate))) {
        const lastDutyDate = new Date(latestVacation.lastDutyDate);
        const today = new Date();
        
        if (!isNaN(lastDutyDate.getTime())) {
          totalVacationDays = Math.floor((today - lastDutyDate) / (1000 * 60 * 60 * 24));
        }
      } else if (latestRejoin) {
        const rejoinDate = new Date(latestRejoin.joinDate);
        const today = new Date();
        
        if (!isNaN(rejoinDate.getTime())) {
          totalWorkingDays = Math.floor((today - rejoinDate) / (1000 * 60 * 60 * 24));
        }
      }

      employee.totalWorkingDays = totalWorkingDays > 0 ? totalWorkingDays : 0;
      employee.totalVacationDays = totalVacationDays > 0 ? totalVacationDays : 0;
    }

    return res.status(200).json({ success: true, employees, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Server Error" });
  }
};






// ------------  inactive employees ----------------



const getEmployeeOne = async (req, res) => {
  const { id } = req.params;
  try {
    let EmployeeOne;

    EmployeeOne = await Employee.findById({ _id: id })
      .populate("userId", { password: 0 })
      .populate("department")
      .populate("designation")
     
      .lean(); // Use lean() to get plain JavaScript objects

    if (!EmployeeOne) {
      EmployeeOne = await Employee.findOne({ userId: id })
        .populate("userId", { password: 0 })
        .populate("department")
        .populate("designation")
        
        .lean(); // Use lean() to get plain JavaScript objects
    }

    if (!EmployeeOne) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Fetch the QID with the nearest expiration date for the employee
    const qidFile = await FileModel.findOne({ text: EmployeeOne._id, name: "QID" }).sort({ date: -1 }).lean();
    EmployeeOne.QID = qidFile ? qidFile.name : null;
    EmployeeOne.qidExp = qidFile ? qidFile.date : null;

    // Fetch the PASSPORT with the nearest expiration date for the employee
    const passportFile = await FileModel.findOne({ text: EmployeeOne._id, name: "PASSPORT" }).sort({ date: -1 }).lean();
    EmployeeOne.PASSPORT = passportFile ? passportFile.name : null;
    EmployeeOne.passportExp = passportFile ? passportFile.date : null;

    // Fetch the Medical with the nearest expiration date for the employee
    const medicalFile = await FileModel.findOne({ text: EmployeeOne._id, name: "MEDICAL" }).sort({ date: -1 }).lean();
    EmployeeOne.Medical = medicalFile ? medicalFile.name : null;
    EmployeeOne.medicalExp = medicalFile ? medicalFile.date : null;

    return res.status(200).json({ success: true, EmployeeOne });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Server Error' });
  }
};











// const updateEmployee = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const {
//             name,
//             email,
//             employeeId,
//             dob,
//             maritalStatus,
//             designation,
//             department,
//             salary,
//         } = req.body;

//         // Find the employee
//         const employee = await Employee.findById({ _id: id });
//         if (!employee) {
//             return res.status(400).json({ success: false, error: "Employee Not Found" });
//         }

//         // Find the associated user
//         const user = await User.findById({ _id: employee.userId });
//         if (!user) {
//             return res.status(400).json({ success: false, error: "User Not Found" });
//         }

//         let uploadedFileUrl = user.profileImage; // Default to the existing profile image
//         if (req.file) {
//             // Upload the new profile image to Cloudinary
//             const result = await cloudinary.uploader.upload(req.file.path, {
//                 folder: "employee-profile-images",
//                 resource_type: "image", // Change to 'raw' for non-image files
//             });

//             uploadedFileUrl = result.secure_url;

//             // Remove the temporary local file
//             if (fs.existsSync(req.file.path)) {
//                 try {
//                     fs.unlinkSync(req.file.path);
//                     console.log("Temporary file deleted:", req.file.path);
//                 } catch (error) {
//                     console.error("Error deleting temporary file:", error.message);
//                 }
//             }
//         }

//         // Update the user and employee data
//         await User.findByIdAndUpdate(
//             { _id: employee.userId },
//             { name, email, profileImage: uploadedFileUrl }
//         );
//         await Employee.findByIdAndUpdate(
//             { _id: id },
//             {
//                 employeeId,
//                 dob,
//                 maritalStatus,
//                 designation,
//                 department,
//                 salary,
//             },
//             { new: true } // Return the updated document
//         );

//         res.status(200).json({ success: true, message: "Employee Updated" });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ success: false, error: "Update employee server error" });
//     }
// };




// const updateEmployee = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const {
//       name,
//       email,
//       employeeId,
//       dob,
//       maritalStatus,
//       designation,
//       department,
//       salary,
//       mobQatar,
//       mobNative,
//       bloodGroup,
//       nationality,
//       gender,
//       visaStatus,
//       visaValidity,
//       supervisor,
//       workLocation,
//       role,
//     } = req.body;

//     // Find the employee
//     const employee = await Employee.findById(id);
//     if (!employee) {
//       return res.status(400).json({ success: false, error: "Employee Not Found" });
//     }

//     // Find the associated user
//     const user = await User.findById(employee.userId);
//     if (!user) {
//       return res.status(400).json({ success: false, error: "User Not Found" });
//     }

//     let uploadedFileUrl = user.profileImage; // Default to the existing profile image
//     if (req.file) {
//       // Upload the new profile image to Cloudinary
//       const result = await cloudinary.uploader.upload(req.file.path, {
//         folder: "employee-profile-images",
//         resource_type: "image", // Change to 'raw' for non-image files
//       });

//       uploadedFileUrl = result.secure_url;

//       // Remove the temporary local file
//       if (fs.existsSync(req.file.path)) {
//         try {
//           fs.unlinkSync(req.file.path);
//           console.log("Temporary file deleted:", req.file.path);
//         } catch (error) {
//           console.error("Error deleting temporary file:", error.message);
//         }
//       }
//     }

//     // Update the user data
//     await User.findByIdAndUpdate(
//       user._id,
//       { name, email, profileImage: uploadedFileUrl, role },
//       { new: true } // Return the updated document
//     );

//     // Prepare the update object for the employee
//     const updateData = {
//       employeeId,
//       dob,
//       maritalStatus,
//       designation,
//       department,
//       salary,
//       mobQatar,
//       mobNative,
//       bloodGroup,
//       nationality,
//       gender,
//       workLocation,
//       visaStatus,
//       visaValidity,
//     };

//     // Only add the supervisor field if it is provided and valid
//     if (supervisor && mongoose.Types.ObjectId.isValid(supervisor)) {
//       updateData.supervisor = supervisor;
//     }

//     // Update the employee data
//     await Employee.findByIdAndUpdate(
//       id,
//       updateData,
//       { new: true } // Return the updated document
//     );

//     res.status(200).json({ success: true, message: "Employee Updated" });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ success: false, error: "Update employee server error" });
//   }
// };


const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      employeeId,
      dob,
      maritalStatus,
      designation,
      department,
      salary,
      mobQatar,
      mobNative,
      bloodGroup,
      nationality,
      gender,
      visaStatus,
      visaValidity,
      supervisor,
      workLocation,
      role,
    } = req.body;

    // Find the employee
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(400).json({ success: false, error: "Employee Not Found" });
    }

    // Find the associated user
    const user = await User.findById(employee.userId);
    if (!user) {
      return res.status(400).json({ success: false, error: "User Not Found" });
    }

    let uploadedFileUrl = user.profileImage; // Default to the existing profile image
    if (req.file) {
      // Upload the new profile image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "employee-profile-images",
        resource_type: "image", // Change to 'raw' for non-image files
      });

      uploadedFileUrl = result.secure_url;

      // Remove the temporary local file
      if (fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
          console.log("Temporary file deleted:", req.file.path);
        } catch (error) {
          console.error("Error deleting temporary file:", error.message);
        }
      }
    }

    // Update the user data
    await User.findByIdAndUpdate(
      user._id,
      { name, email, profileImage: uploadedFileUrl, role },
      { new: true } // Return the updated document
    );

    // Prepare the update object for the employee
    const updateData = {};

    if (employeeId && employeeId !== "null" && employeeId !== "") updateData.employeeId = employeeId;
    if (dob && dob !== "null" && dob !== "") updateData.dob = dob;
    if (maritalStatus && maritalStatus !== "null" && maritalStatus !== "") updateData.maritalStatus = maritalStatus;
    if (designation && designation !== "null" && designation !== "") updateData.designation = designation;
    if (department && department !== "null" && department !== "") updateData.department = department;
    if (salary && salary !== "null" && salary !== "") updateData.salary = salary;
    if (mobQatar && mobQatar !== "null" && mobQatar !== "") updateData.mobQatar = mobQatar;
    if (mobNative && mobNative !== "null" && mobNative !== "") updateData.mobNative = mobNative;
    if (bloodGroup && bloodGroup !== "null" && bloodGroup !== "") updateData.bloodGroup = bloodGroup;
    if (nationality && nationality !== "null" && nationality !== "") updateData.nationality = nationality;
    if (gender && gender !== "null" && gender !== "") updateData.gender = gender;
    if (workLocation && workLocation !== "null" && workLocation !== "") updateData.workLocation = workLocation;
    if (visaStatus && visaStatus !== "null" && visaStatus !== "") updateData.visaStatus = visaStatus;
    if (visaValidity && visaValidity !== "null" && visaValidity !== "") updateData.visaValidity = visaValidity;
    if (supervisor && supervisor !== "null" && mongoose.Types.ObjectId.isValid(supervisor)) updateData.supervisor = supervisor;

    // Update the employee data
    await Employee.findByIdAndUpdate(
      id,
      updateData,
      { new: true } // Return the updated document
    );

    res.status(200).json({ success: true, message: "Employee Updated" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Update employee server error" });
  }
};






const fetchEmployeesByDepId = async (req,res) => {

    const {id} = req.params;
    try {

        const femployees = await Employee.find({department:id})

        return res.status(200).json({success:true, femployees })

    } catch (error) {
        return res.status(500).json({success:false, error:"get employee By DepID server error"});
    }
}



const getSupervisors = async (req, res) => {
  try {
      console.log("Fetching supervisors...");

      // Step 1: Find users with role 'supervisor'
      const supervisorUsers = await User.find({ role: 'supervisor' });

      if (!supervisorUsers || supervisorUsers.length === 0) {
          console.log('No supervisors found in User model');
          return res.status(404).json({ success: false, message: 'No supervisors found' });
      }

      console.log('Supervisors found in User model:', supervisorUsers);

      // Step 2: Find employees with userId of supervisors
      const supervisors = await Employee.find({ 
          userId: { $in: supervisorUsers.map(user => user._id) }
      }).populate('userId designation department');

      if (!supervisors || supervisors.length === 0) {
          console.log('No supervisor employees found');
          return res.status(404).json({ success: false, message: 'No supervisor employees found' });
      }

      console.log('Supervisors fetched from Employee model:', supervisors);

      // Step 3: Return the data
      res.status(200).json({ success: true, fetchSupervisors: supervisors });

  } catch (error) {
      console.error('Error fetching supervisors:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};



const getEmployeesForSupervisor = async (req, res) => {
  try {
    const userId = req.user.id; // Authenticated supervisor's User ID

    // Step 1: Find the supervisor's employee record
    const supervisorRecord = await Employee.findOne({ userId: userId })
      .select("employeeId mobQatar")
      .populate("userId", "name email profileImage")
      .populate("department", "dep_name");

    if (!supervisorRecord) {
      console.log("Supervisor record not found for userId:", userId);
      return res.status(404).json({ success: false, message: "Supervisor record not found" });
    }

    // Step 2: Fetch employees under this supervisor
    const employees = await Employee.find({ supervisor: supervisorRecord._id })
      .select("employeeId mobQatar")
      .populate("userId", "name email profileImage")
      .populate("department", "dep_name");

    // Combine supervisor data with employees data
    const allEmployees = [supervisorRecord, ...employees];

    // Step 3: Fetch the most recent schedule for each employee
    const employeeDataWithSchedules = await Promise.all(allEmployees.map(async (employee) => {
      const recentSchedule = await SetSchedule.findOne({ employeeId: employee._id })
        .sort({ endDate: -1 }) // Sort by endDate in descending order to get the most recent schedule
        .populate("scheduleId", "scheduleName");

      return {
        ...employee._doc,
        scheduleName: recentSchedule ? recentSchedule.scheduleId.scheduleName : "No schedule assigned",
        startDate: recentSchedule ? recentSchedule.startDate : null,
        endDate: recentSchedule ? recentSchedule.endDate : null,
      };
    }));

    res.status(200).json({ success: true, employees: employeeDataWithSchedules });
  } catch (error) {
    console.error("Error fetching employees for supervisor:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// const setScheduleInSelectedEmp = async (req, res) => {
//   try {
//       const { userId, scheduleId } = req.body;

//       // Log the received userId and scheduleId
//       console.log("Received userId:", userId);
//       console.log("Received scheduleId:", scheduleId);

//       // Log existing employees in the database
//       const employees = await Employee.find();
//       console.log("Existing employees:", employees);

//       // Find the employee by userId
//       const employee = await Employee.findOne({ _id:userId });

//       if (!employee) {
//           console.log("Employee not found for userId:", userId);
//           return res.status(404).json({ success: false, message: 'Employee not found' });
//       }

//       // Update the employee's scheduleName field with the new scheduleId
//       employee.scheduleName = scheduleId;

//       // Save the updated employee record
//       await employee.save();

//       res.status(200).json({ success: true, message: 'Schedule assigned successfully', employee });
//   } catch (error) {
//       console.error('Error assigning schedule:', error);
//       res.status(500).json({ success: false, message: 'Server error', error: error.message });
//   }
// };








const setScheduleInSelectedEmp = async (req, res) => {
  try {
    const { scheduleId, employeeId, startDate, endDate } = req.body;

    // Log the received data
    console.log("Received scheduleId:", scheduleId);
    console.log("Received employeeId:", employeeId);
    console.log("Received startDate:", startDate);
    console.log("Received endDate:", endDate);

    // Check if employeeId is undefined
    if (!employeeId) {
      console.log("employeeId is undefined");
      return res.status(400).json({ success: false, message: 'employeeId is required' });
    }

    // Log existing employees in the database
    const employees = await Employee.find();
    console.log("Existing employees:", employees);

    // Find the employee by employeeId
    const employee = await Employee.findOne({ employeeId: employeeId });

    if (!employee) {
      console.log("Employee not found for employeeId:", employeeId);
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Convert employeeId to ObjectId
    const employeeObjectId = new mongoose.Types.ObjectId(employee._id);

    // Add a record to the SetSchedule model
    const newSetSchedule = new SetSchedule({
      userId: employee.userId,
      scheduleId,
      employeeId: employeeObjectId,
      startDate,
      endDate
    });

    await newSetSchedule.save();

    // Update the employee's scheduleName field with the new scheduleId
    employee.scheduleName = scheduleId;

    // Save the updated employee record
    await employee.save();

    res.status(200).json({ success: true, message: 'Schedule assigned successfully', employee });
  } catch (error) {
    console.error('Error assigning schedule:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};



const getAllSetSchedules = async (req, res) => {
  try {
    console.log('Fetching set schedules...');

    // Fetch all records from the SetSchedule model
    const setSchedules = await SetSchedule.find()
      .populate('userId', 'name email') // Populate user details
      .populate('scheduleId', 'scheduleName') // Populate schedule details
      .populate('employeeId', 'employeeId'); // Populate employee details

    console.log('Fetched set schedules:', setSchedules);

    // Return the fetched data in the response
    res.status(200).json({ success: true, setSchedules });
  } catch (error) {
    console.error('Error fetching set schedules:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};



// const getSetSchedules = async (req, res) => {
//   try {
//     const userId = req.user.id; // Authenticated supervisor's User ID

//     console.log('Fetching set schedules for supervisor:', userId);

//     // Step 1: Find the supervisor's employee record
//     const supervisorRecord = await Employee.findOne({ userId: userId });
//     if (!supervisorRecord) {
//       return res.status(404).json({ success: false, message: "Supervisor record not found" });
//     }

//     // Step 2: Fetch employees under this supervisor
//     const employees = await Employee.find({ supervisor: supervisorRecord._id });
//     const employeeIds = employees.map(employee => employee._id);

//     // Include the supervisor's own employee ID
//     employeeIds.push(supervisorRecord._id);

//     console.log('Employees under supervisor including supervisor:', employeeIds);

//     // Step 3: Fetch set schedules for these employees
//     const setSchedules = await SetSchedule.find({ employeeId: { $in: employeeIds } })
//       .populate('userId', 'name email') // Populate user details
//       .populate('scheduleId', 'scheduleName') // Populate schedule details
//       .populate('employeeId', 'employeeId name'); // Populate employee details

//     console.log('Fetched set schedules:', setSchedules);

//     // Return the fetched data in the response
//     res.status(200).json({ success: true, setSchedules });
//   } catch (error) {
//     console.error('Error fetching set schedules:', error);
//     res.status(500).json({ success: false, message: 'Server error', error: error.message });
//   }
// };


const getSetSchedules = async (req, res) => {
  try {
    const userId = req.user.id; // Authenticated supervisor's User ID

    console.log('Fetching set schedules for supervisor:', userId);

    // Step 1: Find the supervisor's employee record
    const supervisorRecord = await Employee.findOne({ userId: userId });
    if (!supervisorRecord) {
      return res.status(404).json({ success: false, message: "Supervisor record not found" });
    }

    // Step 2: Fetch employees under this supervisor
    const employees = await Employee.find({ supervisor: supervisorRecord._id });
    const employeeIds = employees.map(employee => employee._id);

    // Include the supervisor's own employee ID
    employeeIds.push(supervisorRecord._id);

    console.log('Employees under supervisor including supervisor:', employeeIds);

    // Step 3: Fetch set schedules for these employees with filtering logic
    const currentDate = new Date();
    const setSchedules = await SetSchedule.find({
      employeeId: { $in: employeeIds },
      $or: [
        { endDate: null }, // Ongoing schedules
        { endDate: { $gte: currentDate } }, // Future or current schedules
        { $and: [{ startDate: { $lte: currentDate } }, { endDate: { $gte: currentDate } }] } // Valid schedules
      ]
    })
      .populate('userId', 'name email') // Populate user details
      .populate('scheduleId', 'scheduleName') // Populate schedule details
      .populate('employeeId', 'employeeId name'); // Populate employee details

    console.log('Fetched set schedules:', setSchedules);

    // Return the fetched data in the response
    res.status(200).json({ success: true, setSchedules });
  } catch (error) {
    console.error('Error fetching set schedules:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};




module.exports={getAllSetSchedules,getSetSchedules,addEmployee, upload, getEmployee, getEmployeeOne,updateEmployee,fetchEmployeesByDepId,getSupervisors,getEmployeesForSupervisor,setScheduleInSelectedEmp}