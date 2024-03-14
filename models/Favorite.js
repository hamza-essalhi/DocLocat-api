const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const favoriteSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    doctorId: {
        type: String,
        required: true
    },
    doctorName: {
        type: String,
        required: true
    },
    doctorAddress: {
        type: String,
        required: true
    },
    doctorPhone: {
        type: String,
        required: true
    },
},
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;
