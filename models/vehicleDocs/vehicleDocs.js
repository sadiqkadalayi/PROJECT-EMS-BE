const mongoose = require('mongoose');

const vehicleDocSchema = new mongoose.Schema({
  vehicleName: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  registrationExpiryDate: { type: Date, required: true },
  insuranceExpiryDate: { type: Date, required: true },
  depUsing: { type: String, required: true },
  ownershipName: { type: String, required: true },
  insuranceDocumentUrl: { type: String, required: true }, // Cloudinary URL for insurance
  insuranceCloudinaryId: { type: String, required: true }, // Cloudinary public ID for insurance
  registrationDocumentUrl: { type: String, required: true }, // Cloudinary URL for registration
  registrationCloudinaryId: { type: String, required: true }, // Cloudinary public ID for registration
  createdAt: { type: Date, default: Date.now },
});

const VehicleDoc = mongoose.model('VehicleDoc', vehicleDocSchema);

module.exports = VehicleDoc;