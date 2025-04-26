const fs = require('fs');
const csvParser = require('csv-parser');
const MasterRecord = require('../models/Rewards/masterRecords'); // Import the MasterRecord model
const OnlineUser = require('../models/Rewards/onlineUser'); // Import the OnlineUser model
const PointMaster = require('../models/Rewards/pointMaster'); // Import the PointMaster model
const RedumptionMaster = require('../models/Rewards/redumptionmaster'); // Import the RedumptionMaster model



const postMasterRecords = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const results = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });

    const newUsers = [];
    const newRecords = [];
    const updateRecords = [];

    for (const row of results) {
      if (!row.mobNumber || !row.date) {
        console.error(`Skipping row due to missing mobNumber or date: ${JSON.stringify(row)}`);
        continue;
      }

      const [day, month, year] = row.date.split('-');
      const parsedDate = new Date(`20${year}-${month}-${day}`);
      if (isNaN(parsedDate)) {
        console.error(`Skipping row due to invalid date: ${row.date}`);
        continue;
      }

      let user = await OnlineUser.findOne({ mobNumber: row.mobNumber });
      if (!user) {
        user = new OnlineUser({
          name: row.name,
          mobNumber: row.mobNumber,
        });
        newUsers.push(user);
      }

      const userId = user._id || user;
      const existingRecord = user._id
        ? await MasterRecord.findOne({ userId: user._id, date: parsedDate })
        : null;

      const recordData = {
        userId: userId,
        date: parsedDate,
        shippingCharge: row.shippingCharge,
        orderId: row.orderId,
        collector: row.collector,
        driver: row.driver,
        dOut: row.dOut || 'N/A',
        dIn: row.dIn || 'N/A',
        deliveryArea: row.deliveryArea || 'N/A',
        totalAmount: parseFloat(row.totalAmount) || 0,
      };

      if (existingRecord) {
        updateRecords.push({
          filter: { _id: existingRecord._id },
          update: { $set: recordData },
          oldAmount: existingRecord.totalAmount, // Store old amount for PointMaster adjustment
        });
      } else {
        newRecords.push(recordData);
      }
    }

    let savedUsers = [];
    if (newUsers.length > 0) {
      savedUsers = await OnlineUser.insertMany(newUsers);
      const userMap = new Map(savedUsers.map((u) => [u.mobNumber, u._id]));
      newRecords.forEach((record) => {
        if (!record.userId._id) {
          record.userId = userMap.get(record.userId.mobNumber);
        }
      });
      updateRecords.forEach((update) => {
        if (!update.filter._id) {
          update.filter.userId = userMap.get(update.filter.userId.mobNumber);
        }
      });
    }

    let savedRecords = [];
    if (newRecords.length > 0) {
      savedRecords = await MasterRecord.insertMany(newRecords);
    }

    if (updateRecords.length > 0) {
      for (const update of updateRecords) {
        await MasterRecord.updateOne(update.filter, update.update);
      }
    }

    // Step 6: Update PointMaster records
    const allRecords = [
      ...savedRecords.map((record) => ({ userId: record.userId, totalAmount: record.totalAmount })),
      ...updateRecords.map((u) => ({ userId: u.update.$set.userId, totalAmount: u.update.$set.totalAmount, oldAmount: u.oldAmount })),
    ];

    for (const record of allRecords) {
      const master = record.userId;
      const newAmount = record.totalAmount || 0;
      const oldAmount = record.oldAmount || 0; // Will be 0 for new records, non-zero for updates

      if (!master) {
        console.error(`Skipping PointMaster update: userId/master is undefined for record: ${JSON.stringify(record)}`);
        continue;
      }

      let pointMaster = await PointMaster.findOne({ master });
      if (!pointMaster) {
        // Create new PointMaster if it doesn't exist
        pointMaster = new PointMaster({
          master,
          totalAmount: newAmount,
          totalPoints: newAmount,
        });
      } else {
        // Adjust PointMaster: subtract old amount (if update), then add new amount
        pointMaster.totalAmount = pointMaster.totalAmount - oldAmount + newAmount;
        pointMaster.totalPoints = pointMaster.totalAmount; // Sync totalPoints with totalAmount
        pointMaster.updatedAt = new Date();
      }
      await pointMaster.save();
    }

    fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      message: `CSV uploaded and processed successfully: ${newUsers.length} users created, ${newRecords.length} records created, ${updateRecords.length} records updated`,
    });
  } catch (error) {
    console.error('Error processing CSV upload:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: 'Error processing CSV upload', error: error.message });
  }
};



const getAllMasterRecords = async (req, res) => {
    try {
        // Populate the userId field to get the associated OnlineUser data (name, mobNumber)
        const records = await MasterRecord.find().populate('userId', 'name mobNumber');
        res.status(200).json({ success: true, data: records });
      } catch (error) {
        console.error('Error fetching master records:', error);
        res.status(500).json({ success: false, message: 'Error fetching master records', error: error.message });
      }
}



const getAllMasterPoints = async (req, res) => {
  try {
    // Step 1: Fetch all PointMaster records and populate the 'master' field with OnlineUser data
    const pointsData = await PointMaster.find()
      .populate('master', 'name mobNumber'); // Populate 'master' with 'name' and 'mobNumber' from OnlineUser

    // Step 2: Format the data for the frontend DataTable
    const formattedData = pointsData.map((point) => ({
      name: point.master?.name || 'N/A', // Fallback to 'N/A' if name is missing
      mobNumber: point.master?.mobNumber || 'N/A', // Fallback to 'N/A' if mobNumber is missing
      totalAmount: point.totalAmount || 0, // Default to 0 if totalAmount is missing
      totalPoints: point.totalPoints || 0, // Default to 0 if totalPoints is missing
    }));

    // Step 3: Send the formatted data as a response
    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error fetching master points:', error);
    res.status(500).json({ success: false, message: 'Error fetching master points', error: error.message });
  }
};


const getAlleligibleList = async (req, res) => {
  try {
    // Find all PointMaster records where totalAmount >= 2500
    const eligibleRecords = await PointMaster.find({
      totalAmount: { $gte: 2500 }, // Could also use totalPoints since they're equal
    }).populate('master', 'name mobNumber'); // Populate OnlineUser details (name, mobNumber)

    // Return the list to the frontend
    res.status(200).json({
      success: true,
      message: eligibleRecords.length > 0 
        ? `${eligibleRecords.length} eligible users found with totalAmount >= 2500`
        : 'No users found with totalAmount >= 2500',
      data: eligibleRecords,
    });
  } catch (error) {
    console.error('Error fetching eligible list:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching eligible list',
      error: error.message,
    });
  }
};


const postingRedumption = async (req, res) => {
  try {
    const { id, serialNumber, redumptionDate, amount, points, status, remarks } = req.body;

    // Validate required fields
    if (!id || !serialNumber || !redumptionDate || !amount || !points || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Step 1: Fetch the PointMaster record using the provided id
    const pointMaster = await PointMaster.findById(id);
    if (!pointMaster) {
      return res.status(404).json({
        success: false,
        message: `PointMaster record not found for ID: ${id}`,
      });
    }

    // Step 2: Extract the master field (OnlineUser ID) from the PointMaster record
    const master = pointMaster.master; // This is the OnlineUser ID

    // Step 3: Create and save the redemption record
    const newRedumption = new RedumptionMaster({
      master, // Use the OnlineUser ID
      serialNumber,
      redumptionDate,
      amount,
      points,
      status,
      remarks,
    });
    await newRedumption.save();

    // Step 4: Update the PointMaster record by deducting points
    pointMaster.totalAmount -= points; // Subtract from totalAmount
    pointMaster.totalPoints -= points; // Subtract from totalPoints
    pointMaster.updatedAt = new Date();
    await pointMaster.save();

    // Step 5: Send success response
    res.status(200).json({
      success: true,
      message: 'Redemption processed and points deducted',
    });
  } catch (error) {
    console.error('Error creating redemption record:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating redemption record',
      error: error.message,
    });
  }
};




const getAllRedeemedList = async (req, res) => {
  try {
    // Step 1: Fetch all redeemed records and populate the 'master' field with OnlineUser data
    const redeemedRecords = await RedumptionMaster.find()
      .populate('master', 'name mobNumber'); // Populate 'master' with 'name' and 'mobNumber' from OnlineUser

    // Step 2: Format the data for the frontend
    const formattedData = redeemedRecords.map((record) => ({
      name: record.master?.name || 'N/A', // Fallback to 'N/A' if name is missing
      mobNumber: record.master?.mobNumber || 'N/A', // Fallback to 'N/A' if mobNumber is missing
      serialNumber: record.serialNumber || 'N/A',
      redumptionDate: record.redumptionDate || 'N/A',
      amount: record.amount || 0,
      points: record.points || 0,
      status: record.status || 'N/A',
      remarks: record.remarks || 'N/A',
    }));

    // Step 3: Send the formatted data as a response
    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error fetching redeemed records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching redeemed records',
      error: error.message,
    });
  }
};


module.exports = {
  postMasterRecords,getAllMasterRecords,getAllMasterPoints,
  getAlleligibleList,postingRedumption,getAllRedeemedList
};