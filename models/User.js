const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },

    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String
    },

    created_at: {
        type: Date,
        default: Date.now
    },

    role: {
        type: String,
        default: "customer"
    },

    employee_code: {
        type: String,
        trim: true
    },

    phone: {
        type: String,
        trim: true
    }
}, {
    collection: "users"
});

module.exports = mongoose.model("User", userSchema);