const mongoose = require("mongoose");

const passwordResetSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },

    otp: {
        type: String,
        required: true
    },

    expires_at: {
        type: Date,
        required: true
    },

    verified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    collection: "password_resets"
});

module.exports = mongoose.model(
    "PasswordReset",
    passwordResetSchema
);