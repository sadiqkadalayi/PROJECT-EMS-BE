const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const resignationSchema = new Schema({
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  lastDutyDate: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['resign'],
    default: 'resign'
  },
  settlementDoc: {
    type: String,
    
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Resignation = mongoose.model('Resignation', resignationSchema);
module.exports = Resignation;