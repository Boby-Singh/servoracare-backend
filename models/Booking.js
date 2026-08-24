const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({

    // ==========================================
    // USER-FACING 6 DIGIT BOOKING ID
    // Example: 985680
    // ==========================================

    booking_id: {

        type: Number,

        required: true,

        unique: true,

        index: true

    },


    // ==========================================
    // CUSTOMER
    // ==========================================

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


    // ==========================================
    // BOOKING STATUS
    // ==========================================

    status: {

        type: String,

        enum: [
            "Pending",
            "Accepted",
            "Completed",
            "Rejected"
        ],

        default: "Pending"

    },


    // ==========================================
    // TECHNICIAN
    // ==========================================

    technician_id: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null

    },


    technician_comment: {

        type: String,

        default: ""

    },

    rejection_reason: {
        type: String,
        default: null,
        trim: true
    },

    completion_comment: {
        type: String,
        trim: true,
        default: null
    },

    completion_otp: {
        type: String,
        default: null
    },

    completion_otp_expires: {
        type: Date,
        default: null
    },

    completion_otp_verified: {
        type: Boolean,
        default: false
    },

    completed_at: {
        type: Date,
        default: null
    },


    // ==========================================
    // VISIT DETAILS
    // ==========================================

    visit_date: {

        type: String,

        default: null

    },


    visit_time: {

        type: String,

        default: null

    },


    accepted_at: {

        type: Date,

        default: null

    },


    // ==========================================
    // CREATED DATE
    // ==========================================

    created_at: {

        type: Date,

        default: Date.now

    }

});


module.exports =
    mongoose.model(
        "Booking",
        bookingSchema
    );