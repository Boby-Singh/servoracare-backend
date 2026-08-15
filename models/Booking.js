const mongoose = require("mongoose");


// ==========================================
// BOOKING SCHEMA
// ==========================================

const bookingSchema = new mongoose.Schema(

    {

        // ==========================================
        // 6 DIGIT SERVORACARE BOOKING ID
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


        // ==========================================
        // SERVICE
        // ==========================================

        service_type: {

            type: String,

            required: true

        },


        amount: {

            type: Number,

            required: true

        },


        // ==========================================
        // STATUS
        // ==========================================

        status: {

            type: String,

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


        // ==========================================
        // VISIT
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

        }

    },


    {

        timestamps: {

            createdAt: "created_at",

            updatedAt: "updated_at"

        }

    }

);


module.exports = mongoose.model(
    "Booking",
    bookingSchema
);