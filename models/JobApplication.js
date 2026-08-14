const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema({

    full_name: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    city: {
        type: String,
        required: true
    },

    position: {
        type: String,
        required: true
    },

    experience: {
        type: String,
        default: ""
    },

    aadhaar: {
        type: String,
        default: ""
    },

    pan: {
        type: String,
        default: ""
    },

    resume: {
        type: String,
        default: null
    },

    aadhaar_file: {
        type: String,
        default: null
    },

    photo: {
        type: String,
        default: null
    },

    status: {
        type: String,
        default: "Pending"
    },

    created_at: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model(
    "JobApplication",
    jobApplicationSchema
);