const express = require("express");
const router = express.Router();
const generate6DigitId = require("../utils/generateId");
const Booking = require("../models/Booking");
const User = require("../models/User");
const { sendNewBookingEmail } = require("../utils/sendOTP");

// ==========================================
// CREATE PAYMENT
// ==========================================

router.post("/create-payment", async(req, res) => {

    try {

        const { bookingId, amount } = req.body;

        const upiId = "7828908522@axl";

        const paymentUrl =
            `upi://pay?pa=${encodeURIComponent(upiId)}` +
            `&pn=${encodeURIComponent("ServoraCare")}` +
            `&tn=${encodeURIComponent("Service Booking")}` +
            `&am=${amount}` +
            `&cu=INR`;

        res.json({
            success: true,
            paymentUrl
        });

    } catch (err) {

        console.error("Payment Error:", err);

        res.status(500).json({
            success: false,
            message: "Payment creation failed"
        });

    }

});

// ==========================================
// CREATE BOOKING
// ==========================================

router.post("/book-service", async(req, res) => {

    try {

        const {
            user_id,
            full_name,
            phone,
            address,
            service_type,
            amount
        } = req.body;


        // ==========================================
        // VALIDATION
        // ==========================================

        if (!user_id ||
            !full_name ||
            !phone ||
            !address ||
            !service_type ||
            amount === undefined
        ) {

            return res.status(400).json({
                message: "All booking fields are required"
            });

        }


        // ==========================================
        // CHECK USER
        // ==========================================

        const user = await User.findById(user_id);

        if (!user) {

            return res.status(404).json({
                message: "User not found"
            });

        }


        // ==========================================
        // GENERATE 6-DIGIT BOOKING ID
        // ==========================================

        let bookingId;
        let exists = true;

        while (exists) {

            bookingId = generate6DigitId();

            exists = await Booking.exists({
                booking_id: bookingId
            });

        }


        // ==========================================
        // CREATE BOOKING
        // ==========================================

        const booking = await Booking.create({

            booking_id: bookingId,

            user_id: user._id,

            full_name,

            phone,

            address,

            service_type,

            amount,

            status: "Pending"

        });

        // ==========================================
        // SEND EMAIL TO ADMIN
        // ==========================================

        const admins = await User.find({
            role: "admin"
        }).select("email");

        for (const admin of admins) {

            if (admin.email) {

                try {

                    await sendNewBookingEmail(
                        admin.email,
                        booking
                    );

                } catch (emailError) {

                    console.error(
                        "ADMIN BOOKING EMAIL FAILED:",
                        emailError
                    );

                }

            }

        }


        // ==========================================
        // RESPONSE
        // ==========================================

        res.status(201).json({

            message: "Booking Successful",

            booking

        });


    } catch (error) {

        console.error(
            "Booking Error:",
            error
        );

        res.status(500).json({
            message: "Booking Failed"
        });

    }

});


// ==========================================
// GET ALL BOOKINGS
// ==========================================

router.get("/all-bookings", async(req, res) => {

    try {

        const bookings = await Booking.find()

        .populate({
            path: "technician_id",
            select: "name employee_code phone"
        })

        .sort({
            created_at: -1
        });


        const result = bookings.map((booking) => {

            const data = booking.toObject();

            return {

                ...data,

                technician_name: booking.technician_id ?
                    booking.technician_id.name : null,

                employee_code: booking.technician_id ?
                    booking.technician_id.employee_code : null,

                technician_phone: booking.technician_id ?
                    booking.technician_id.phone : null

            };

        });


        res.status(200).json(result);


    } catch (error) {

        console.error(
            "Get All Bookings Error:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch bookings"
        });

    }

});


// ==========================================
// TECHNICIAN JOBS
// ==========================================

router.get(
    "/technician-jobs/:id",
    async(req, res) => {

        try {

            const technicianId = req.params.id;

            const jobs = await Booking.find({

                technician_id: technicianId

            })

            .populate({
                path: "user_id",
                select: "name email phone"
            })

            .sort({
                created_at: -1
            });


            res.json(jobs);


        } catch (error) {

            console.error(
                "Technician Jobs Error:",
                error
            );

            res.status(500).json({
                message: "Server Error"
            });

        }

    }
);


// ==========================================
// UPDATE BOOKING STATUS
// ==========================================

router.put("/update-status/:id", async(req, res) => {

    try {

        const { id } = req.params;

        const {
            status,
            technician_comment,
            rejection_reason
        } = req.body;


        // ==========================================
        // VALIDATE STATUS
        // ==========================================

        const allowedStatuses = [
            "Pending",
            "Accepted",
            "Completed",
            "Rejected"
        ];

        if (!allowedStatuses.includes(status)) {

            return res.status(400).json({
                message: "Invalid booking status"
            });

        }


        // ==========================================
        // REJECTION VALIDATION
        // ==========================================

        if (
            status === "Rejected" &&
            (!rejection_reason ||
                rejection_reason.trim() === "")
        ) {

            return res.status(400).json({
                message: "Rejection reason is required"
            });

        }


        // ==========================================
        // UPDATE DATA
        // ==========================================

        const updateData = {
            status
        };


        // ==========================================
        // TECHNICIAN COMMENT
        // ==========================================

        if (technician_comment !== undefined) {

            updateData.technician_comment =
                technician_comment;

        }


        // ==========================================
        // REJECTION REASON
        // ==========================================

        if (status === "Rejected") {

            updateData.rejection_reason =
                rejection_reason.trim();

        } else {

            updateData.rejection_reason = null;

        }


        // ==========================================
        // UPDATE BOOKING
        // ==========================================

        const booking =
            await Booking.findByIdAndUpdate(
                id,
                updateData, {
                    new: true,
                    runValidators: true
                }
            );


        // ==========================================
        // BOOKING NOT FOUND
        // ==========================================

        if (!booking) {

            return res.status(404).json({
                message: "Booking not found"
            });

        }


        // ==========================================
        // SUCCESS
        // ==========================================

        return res.json({
            message: "Updated Successfully",
            booking
        });


    } catch (error) {

        console.error(
            "Update Status Error:",
            error
        );

        return res.status(500).json({
            message: "Update Failed"
        });

    }

});


// ==========================================
// MY BOOKINGS
// ==========================================

router.get(
    "/my-bookings/:id",
    async(req, res) => {

        try {

            const userId = req.params.id;


            const bookings = await Booking.find({

                user_id: userId

            })

            .populate({
                path: "technician_id",
                select: "name employee_code phone"
            })

            .sort({
                created_at: -1
            });


            const result = bookings.map((booking) => {

                const data = booking.toObject();

                return {

                    ...data,

                    technician_name: booking.technician_id ?
                        booking.technician_id.name : null,

                    employee_code: booking.technician_id ?
                        booking.technician_id.employee_code : null,

                    technician_phone: booking.technician_id ?
                        booking.technician_id.phone : null

                };

            });


            res.json(result);


        } catch (error) {

            console.error(
                "My Bookings Error:",
                error
            );

            res.status(500).json({
                message: "Server Error"
            });

        }

    }
);


module.exports = router;