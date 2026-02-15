const mongoose = require('mongoose');

const medicalSchema = new mongoose.Schema({
    heart_beat: {
        type: Number,
        required: false
    },
    blood_group: {
        type: String,
        required: false
    },
    temperature: {
        type: Number,
        required: false
    }
});

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: false
    },
    gender: {
        type: String,
        required: false
    },
    medical: [medicalSchema],
    symptoms: {
        type: [[String]],
        default: []
    },
    risk: {
        type: String,
        required: false
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);