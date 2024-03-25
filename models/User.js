const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'doctor', 'user'],
        default: 'user'
    },
    profilePicture: {
        type: String
    },
    about: {
        type: String,
    },
    category: {
        type: String,
    },
    address:{
        type: String,
    },
    city:{
        type: String,
    },
    verified:{
        type:Boolean,
        default:false
    }

},
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
