const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  }
}, { _id: false });

const vehicleSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl: { type: String, required: true },
  location: { type: String, required: true },
  availability: {
    type: availabilitySchema,
    required: true
  }
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
module.exports= Vehicle