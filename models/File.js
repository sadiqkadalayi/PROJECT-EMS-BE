const mongoose = require('mongoose');
const Schema = require('mongoose')

// Define the schema for uploaded files
const fileSchema = new mongoose.Schema({
  fileUrl: { type: String, required: true },
  date: { type: Date, required: true },
  text: {
          type: Schema.Types.ObjectId,
          ref: "Employee",
          required:true
      },
  name:{type:String},
  status:{
    type:String,
    enum:["Expired","Expire within 2 weeks","Expire within 1 Month","Valid"],
    default:"Valid",
    required:true
},
  applieddAt: {type:Date, default:Date.now},
  updatedAt: {type:Date, default:Date.now},
});



// Export the model
const FileModel = mongoose.model('File', fileSchema);
module.exports = FileModel;
