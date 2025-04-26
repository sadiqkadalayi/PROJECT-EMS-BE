const User = require('../models/user')
const Schedule = require('../models/Schedule');
const Employee = require('../models/employee');
const SetSchedule = require('../models/setSchedule');
const mongoose = require('mongoose');


const createSchedule = async (req, res) => {
    try {
        const { scheduleName, department, scheduleA, scheduleB, scheduleC, breakTimePeriod,setType,totalScheduleTime } = req.body;

        const newSchedule = new Schedule({
            scheduleName,
            department,
            scheduleA,
            scheduleB,
            scheduleC,
            breakTimePeriod,
            setType,
            totalScheduleTime
        });

        await newSchedule.save(); // Save first

        // ✅ Populate department properly
        await newSchedule.populate('department');

        res.status(201).json({ success: true, message: 'Schedule created successfully', schedule: newSchedule });
    } catch (error) {
        console.error('Error creating schedule:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};



const getSchedules = async (req, res) => {
    try {
        const schedules = await Schedule.find().populate('department');
        res.status(200).json({ success: true, schedules });
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};



const getScheduleById = async (req, res) => {
    try {
        const { id } = req.params;
        const schedule = await Schedule.findById(id).populate("department");

        if (!schedule) {
            return res.status(404).json({ success: false, message: "Schedule not found" });
        }

        res.status(200).json({ success: true, schedule });
    } catch (error) {
        console.error("Error fetching schedule:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};


const updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const { scheduleName, department, scheduleA, scheduleB, scheduleC, breakTimePeriod,setType,totalScheduleTime } = req.body;

        const updatedSchedule = await Schedule.findByIdAndUpdate(
            id,
            {
                scheduleName,
                department,
                scheduleA,
                scheduleB,
                scheduleC,
                breakTimePeriod,
                setType,
                totalScheduleTime
            },
            { new: true, runValidators: true }
        ).populate("department");

        if (!updatedSchedule) {
            return res.status(404).json({ success: false, message: "Schedule not found" });
        }

        res.status(200).json({ success: true, message: "Schedule updated successfully", schedule: updatedSchedule });
    } catch (error) {
        console.error("Error updating schedule:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};





const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params; // Get schedule ID from request params

        const deletedSchedule = await Schedule.findByIdAndDelete(id);

        if (!deletedSchedule) {
            return res.status(404).json({ success: false, message: "Schedule not found" });
        }

        res.status(200).json({ success: true, message: "Schedule deleted successfully" });
    } catch (error) {
        console.error("Error deleting schedule:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};


const getSchedulesForSupervisor = async (req, res) => {
    try {
        const supervisorId = req.user._id; // Get supervisor ID from token

        // Step 1: Find the Supervisor in the User Model
        const supervisorUser = await User.findById(supervisorId);
        if (!supervisorUser) {
            return res.status(404).json({ success: false, message: "Supervisor not found in User model" });
        }

        // Step 2: Find the Supervisor's Employee Record
        const supervisorEmployee = await Employee.findOne({ userId: supervisorUser._id });
        if (!supervisorEmployee) {
            return res.status(404).json({ success: false, message: "Supervisor's employee record not found" });
        }

        // Step 3: Extract the Department ID from the Employee Record
        const departmentId = supervisorEmployee.department;
        if (!departmentId) {
            return res.status(404).json({ success: false, message: "Department not found for supervisor" });
        }

        // Step 4: Fetch Schedules for the Supervisor's Department
        const schedules = await Schedule.find({ department: departmentId }).populate("department");

        res.status(200).json({ success: true, schedules });
    } catch (error) {
        console.error("Error fetching schedules:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};



const getSchedulesForemployee = async (req, res) => {

}

const getSetScheduleForemployee = async (req, res) => {
    try {
      const { id } = req.params; // Employee ID from the request parameters
  
      // Find the set schedule for the employee and populate the necessary fields
      const setSchedule = await SetSchedule.findOne({ _id: id })
        .populate({
          path: 'userId',
          select: 'name', // Adjust the fields as needed
          model: 'User'
        })
        .populate({
          path: 'scheduleId',
          select: 'scheduleName scheduleA scheduleB scheduleC breakTimePeriod setType totalScheduleTime',
          model: 'Schedule'
        })
        .populate({
          path: 'employeeId',
          select: 'name department employeeId', // Adjust the fields as needed
          model: 'Employee'
        });
  
      if (!setSchedule) {
        return res.status(404).json({ success: false, message: "Set schedule not found for the employee" });
      }
  
      res.status(200).json({ success: true, setSchedule });
    } catch (error) {
      console.error("Error fetching set schedule for employee:", error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  };


const updateSetScheduleForemployee = async (req, res) => {
  try {
    const { id } = req.params; // SetSchedule ID from the request parameters
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
    

    // Find the employee by employeeId
    const employee = await Employee.findOne({ employeeId: employeeId });

    if (!employee) {
      
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Convert employeeId to ObjectId
    const employeeObjectId = new mongoose.Types.ObjectId(employee._id);

    // Validate scheduleId by checking its existence in the database
    const scheduleExists = await Schedule.findById(scheduleId);
    if (!scheduleExists) {
      return res.status(400).json({ success: false, message: "Invalid scheduleId" });
    }

    // Find and update the set schedule for the employee
    const updatedSetSchedule = await SetSchedule.findOneAndUpdate(
      { _id: id },
      {
        scheduleId: new mongoose.Types.ObjectId(scheduleId),
        employeeId: employeeObjectId,
        startDate,
        endDate
      },
      { new: true, runValidators: true }
    );

    if (!updatedSetSchedule) {
      return res.status(404).json({ success: false, message: "Set schedule not found" });
    }

    console.log("Updated set schedule:", updatedSetSchedule);

    res.status(200).json({ success: true, message: "Set schedule updated successfully", setSchedule: updatedSetSchedule });
  } catch (error) {
    console.error("Error updating set schedule for employee:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


module.exports = { updateSetScheduleForemployee, getSetScheduleForemployee,getSchedulesForemployee,  createSchedule,    getSchedules, updateSchedule,deleteSchedule,getScheduleById,getSchedulesForSupervisor};
