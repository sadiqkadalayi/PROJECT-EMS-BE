const mongoose = require('mongoose');

const companyDocSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  documentType: { type: String, required: true },
  documentNumber: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  documentUrl: { type: String, required: true }, // Cloudinary URL
  cloudinaryId: { type: String, required: true }, // Cloudinary public ID
  createdAt: { type: Date, default: Date.now },
});

const CompanyDoc = mongoose.model('CompanyDoc', companyDocSchema);

module.exports = CompanyDoc;