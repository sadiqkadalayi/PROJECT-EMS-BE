const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csvWriter = require('csv-writer').createObjectCsvWriter;

const Employee = require('../models/employee');
const User = require('../models/user');

const exportEmployees = async (req, res) => {
  try {
    // Fetch all employees from the database, including related documents
    const employees = await Employee.aggregate([
      {
        $lookup: {
          from: 'users', // Collection name for User model
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $lookup: {
          from: 'designations', // Collection name for Designation model
          localField: 'designation',
          foreignField: '_id',
          as: 'designationDetails'
        }
      },
      {
        $unwind: {
          path: '$designationDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'departments', // Collection name for Department model
          localField: 'department',
          foreignField: '_id',
          as: 'departmentDetails'
        }
      },
      {
        $unwind: {
          path: '$departmentDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'employees', // Collection name for Employee model
          localField: 'supervisor',
          foreignField: '_id',
          as: 'supervisorDetails'
        }
      },
      {
        $unwind: {
          path: '$supervisorDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: { status: 'active' }
      },
      {
        $project: {
          'userDetails.password': 0 // Exclude the password field
        }
      }
    ]);

    // Transform the data for CSV export
    const csvData = employees.map(emp => ({
      employeeId: emp.employeeId,
      name: emp.userDetails.name,
      email: emp.userDetails.email,
      role: emp.userDetails.role,
      qidNo: emp.qidNo,
      nationality: emp.nationality,
      bloodGroup: emp.bloodGroup,
      mobQatar: emp.mobQatar,
      mobNative: emp.mobNative,
      supervisor: emp.supervisorDetails ? emp.supervisorDetails.employeeId : '',
      dob: emp.dob ? emp.dob.toISOString().split('T')[0] : '',
      gender: emp.gender,
      maritalStatus: emp.maritalStatus,
      designation: emp.designationDetails ? emp.designationDetails.des_name : '',
      department: emp.departmentDetails ? emp.departmentDetails.dep_name : '',
      salary: emp.salary,
      visaStatus: emp.visaStatus,
      visaValidity: emp.visaValidity,
      workLocation: emp.workLocation,
      status: emp.status,
      createdAt: emp.createdAt.toISOString().split('T')[0],
      updatedAt: emp.updatedAt.toISOString().split('T')[0],
      profileImage: emp.userDetails.profileImage || '' // Include profile image URL
    }));

    // Get today's date in YYYYMMDD format
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

    // Define the CSV file path with today's date
    const exportsDir = path.join(__dirname, '../../public/exports');
    const filePath = path.join(exportsDir, `${dateStr}_employees.csv`);

    // Ensure the directory exists
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Define the CSV writer
    const csvWriterInstance = csvWriter({
      path: filePath,
      header: [
        { id: 'employeeId', title: 'EMPLOYEE_ID' },
        { id: 'name', title: 'NAME' },
        { id: 'email', title: 'EMAIL' },
        { id: 'role', title: 'ROLE' },
        { id: 'qidNo', title: 'QID_NO' },
        { id: 'nationality', title: 'NATIONALITY' },
        { id: 'bloodGroup', title: 'BLOOD_GROUP' },
        { id: 'mobQatar', title: 'MOB_QATAR' },
        { id: 'mobNative', title: 'MOB_NATIVE' },
        { id: 'supervisor', title: 'SUPERVISOR' },
        { id: 'dob', title: 'DATE_OF_BIRTH' },
        { id: 'gender', title: 'GENDER' },
        { id: 'maritalStatus', title: 'MARITAL_STATUS' },
        { id: 'designation', title: 'DESIGNATION' },
        { id: 'department', title: 'DEPARTMENT' },
        { id: 'salary', title: 'SALARY' },
        { id: 'visaStatus', title: 'VISA_STATUS' },
        { id: 'visaValidity', title: 'VISA_VALIDITY' },
        { id: 'workLocation', title: 'WORK_LOCATION' },
        { id: 'status', title: 'STATUS' },
        { id: 'createdAt', title: 'CREATED_AT' },
        { id: 'updatedAt', title: 'UPDATED_AT' },
        { id: 'profileImage', title: 'PROFILE_IMAGE' } // Include profile image URL in the header
      ],
    });

    // Write the employee data to the CSV file
    await csvWriterInstance.writeRecords(csvData);

    // Set the appropriate headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${path.basename(filePath)}`);

    // Stream the file to the response
    const readStream = fs.createReadStream(filePath);
    readStream.on('close', () => {
      // Delete the file after it has been downloaded
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
        } else {
          console.log('File deleted successfully');
        }
      });
    });
    readStream.pipe(res);
  } catch (error) {
    console.error('Error exporting employees:', error);
    res.status(500).send('Failed to export employees');
  }
};

module.exports = { exportEmployees };