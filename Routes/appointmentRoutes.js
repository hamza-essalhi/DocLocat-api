const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require("../models/User")



router.post('/add', async (req, res) => {
  try {
    const { doctorId, date, hour } = req.body;

    // Find the logged-in user
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user already has an appointment with the same doctor
    const existingAppointment = await Appointment.findOne({
      userId: req.user.userId,
      doctorId
    });

    if (existingAppointment) {
      return res.status(400).json({ error: "You already have an appointment with this doctor" });
    }

    // Find the doctor
    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    // Create appointment details
    const doctorName = `${doctor.firstName} ${doctor.lastName}`;
    const userName = `${user.firstName} ${user.lastName}`;
    const userId = user.id;

    // Create a new appointment
    const newAppointment = new Appointment({
      doctorId,
      userId,
      doctorName,
      userName,
      date,
      hour
    });

    // Save the appointment
    const savedAppointment = await newAppointment.save();

    res.status(201).json(savedAppointment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});




// Update an appointment by ID
router.put('/id/:id', async (req, res) => {
  try {
    const userId = req.user.userId; // Get the user ID from the request
    const data = await Appointment.find({ doctorId: userId });

    if (!data || data.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }   

    const updatedAppointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    res.json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete an appointment by ID
router.delete('/id/:id', async (req, res) => {
  try {

    const deletedAppointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!deletedAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    res.json(deletedAppointment);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get appointment by ID
router.get('/id/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get appointments by User ID
router.get('/all', async (req, res) => {
  try {
    const userId = req.user.userId; // Assuming userId is in headers

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let appointments;
    if (user.role === "doctor") {
      // If the user is a doctor, find appointments where the doctorId or userId matches
      appointments = await Appointment.find({
        $or: [
          { doctorId: userId },
          { userId: userId }
        ]
      }).sort({ createdAt: -1 });
    } else {
      // If the user is not a doctor, find appointments where the userId matches
      appointments = await Appointment.find({ userId: userId }).sort({ createdAt: -1 });
    }

    if (appointments.length === 0) {
      return res.status(404).json({ message: "No appointments found for this user" });
    }

    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get('/user/:id', async (req, res) => {
  const id =req.params.id
  try {
    const user = await User.findById(req.user.userId);
    const  userId =user.id
    const appointment = await Appointment.find({ userId: userId,doctorId:id });
    res.json(appointment[0]);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;
