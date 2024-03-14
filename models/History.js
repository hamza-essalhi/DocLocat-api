const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const loginHistorySchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String
    },
    location: {
        type: String
    }
},
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

const LoginHistory = mongoose.model('LoginHistory', loginHistorySchema);

module.exports = LoginHistory;
