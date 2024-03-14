const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const appointmentSchema = new Schema({
  doctorId: {
    type: String,
    required: true,

  },
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  hour: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
},
{
    timestamps: true, // Automatically adds createdAt and updatedAt fields
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
