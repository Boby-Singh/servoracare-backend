const express = require("express");
const router = express.Router();
const generate6DigitId = require("../utils/generateId");
const Booking = require("../models/Booking");
const User = require("../models/User");
const { sendNewBookingEmail } = require("../utils/sendOTP");
const crypto = require("crypto");

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
            rejection_reason,
            completion_comment
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

router.post("/:id/request-completion-otp", async(req, res) => {

    try {

        const { id } = req.params;

        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Only accepted bookings can be completed
        if (booking.status !== "Accepted") {
            return res.status(400).json({
                success: false,
                message: "Only accepted bookings can be completed"
            });
        }

        // Generate secure 6 digit OTP
        const otp = crypto
            .randomInt(100000, 1000000)
            .toString();

        // OTP valid for 5 minutes
        const expires = new Date(
            Date.now() + 5 * 60 * 1000
        );

        booking.completion_otp = otp;
        booking.completion_otp_expires = expires;
        booking.completion_otp_verified = false;

        await booking.save();

        console.log(
            `Completion OTP for booking ${booking.booking_id}: ${otp}`
        );

        res.json({
            success: true,
            message: "OTP generated successfully"
        });

    } catch (error) {

        console.error(
            "Completion OTP Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});

router.post("/:id/verify-completion-otp", async(req, res) => {

    try {

        const { id } = req.params;
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "OTP is required"
            });
        }

        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        if (booking.status !== "Accepted") {
            return res.status(400).json({
                success: false,
                message: "This booking cannot be completed"
            });
        }

        // Check OTP expiry
        if (!booking.completion_otp_expires ||
            booking.completion_otp_expires < new Date()
        ) {

            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new OTP."
            });

        }

        // Check OTP
        if (booking.completion_otp !== otp.toString()) {

            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });

        }

        // ==============================
        // OTP VERIFIED
        // ==============================

        booking.completion_otp_verified = true;

        booking.status = "Completed";

        booking.completed_at = new Date();

        // Remove OTP after successful verification
        booking.completion_otp = null;
        booking.completion_otp_expires = null;

        await booking.save();

        res.json({
            success: true,
            message: "Service completed successfully",
            booking
        });

    } catch (error) {

        console.error(
            "Verify Completion OTP Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});

module.exports = router;