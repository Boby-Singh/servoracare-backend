const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    full_name: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true
    },

    address: {
        type: String,
        required: true
    },

    service_type: {
        type: String,
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    technician_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    status: {
        type: String,
        default: "Pending"
    },

    technician_comment: {
        type: String,
        default: ""
    },

    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    collection: "bookings"
});

module.exports = mongoose.model("Booking", bookingSchema);