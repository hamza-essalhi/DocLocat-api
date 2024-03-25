const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: 'info'
    },
    read: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
