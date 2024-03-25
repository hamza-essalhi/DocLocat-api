const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// GET all notifications for a specific user
router.get('/all', (req, res) => {
    const userId = req.user.userId; // Assuming you have the user ID in the request

    Notification.find({ userId }).sort({ updatedAt: -1 })
        .then(notifications => {
            res.json(notifications);
        })
        .catch(error => {
            console.error('Error fetching notifications:', error);
            res.status(500).json({ error: 'Error fetching notifications' });
        });
});

// POST a new notification
router.post('/add', (req, res) => {
    const { message, type, userId, appointmentId } = req.body;

    const newNotification = new Notification({
        message,
        type,
        userId,
        appointmentId
    });

    newNotification.save()
        .then(savedNotification => {
            res.status(201).json(savedNotification);
        })
        .catch(error => {
            console.error('Error saving notification:', error);
            res.status(500).json({ error: 'Error saving notification' });
        });
});

// DELETE a notification by ID
router.delete('/id/:id', (req, res) => {
    const notificationId = req.params.id;
    const userId = req.user.userId; // Assuming you have the user ID in the request

    Notification.findOneAndDelete({ _id: notificationId, userId })
        .then(deletedNotification => {
            if (!deletedNotification) {
                return res.status(404).json({ error: 'Notification not found' });
            }
            res.json(deletedNotification);
        })
        .catch(error => {
            console.error('Error deleting notification:', error);
            res.status(500).json({ error: 'Error deleting notification' });
        });
});

router.delete('/delete-all',async (req, res) => {
  
    const userId = req.user.userId; // Assuming you have the user ID in the request

    const notifications = Notification.find({userId:userId})
    if (!notifications || notifications.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }  
    await Notification.deleteMany({ userId: userId }) .then(deletedNotifications => {
        if (!deletedNotifications) {
            return res.status(404).json({ error: 'Notifications not found' });
        }
        res.json(deletedNotifications);
    })
    .catch(error => {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Error deleting notifications' });
    });
    
});


// PUT (Update) a notification by ID
router.put('/id/:id', (req, res) => {
    const notificationId = req.params.id;
    const { message, type, userId } = req.body;
    // Assuming you have the user ID in the request

    Notification.findOneAndUpdate({ id: notificationId, userId }, { message, type }, { new: true })
        .then(updatedNotification => {
            if (!updatedNotification) {
                return res.status(404).json({ error: 'Notification not found' });
            }
            res.json(updatedNotification);
        })
        .catch(error => {
            console.error('Error updating notification:', error);
            res.status(500).json({ error: 'Error updating notification' });
        });
});

module.exports = router;
