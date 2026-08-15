const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    user_id: {
        type: Number,
        unique: true,
        required: true
    },

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["customer", "technician", "admin"],
        default: "customer"
    },

    employee_code: {
        type: String,
        default: null
    },

    phone: {
        type: String,
        default: null
    },

    created_at: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("User", userSchema);