const express = require("express");
const router = express.Router();

const Booking = require("../models/Booking");
const User = require("../models/User");


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


        // Check user exists

        const user = await User.findById(user_id);

        if (!user) {

            return res.status(404).json({
                message: "User not found"
            });

        }


        // Create booking

        const booking = await Booking.create({

            user_id: user._id,

            full_name,

            phone,

            address,

            service_type,

            amount

        });


        res.status(201).json({

            message: "Booking Successful",

            booking

        });

    } catch (err) {

        console.error("Booking Error:", err);

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


        const result = bookings.map((booking) => ({

            ...booking.toObject(),

            technician_name: booking.technician_id ?
                booking.technician_id.name : null,

            employee_code: booking.technician_id ?
                booking.technician_id.employee_code : null,

            technician_phone: booking.technician_id ?
                booking.technician_id.phone : null

        }));


        res.json(result);

    } catch (err) {

        console.error("Get All Bookings Error:", err);

        res.status(500).json({

            message: "Server Error"

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

        } catch (err) {

            console.error(
                "Technician Jobs Error:",
                err
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

router.put(
    "/update-status/:id",
    async(req, res) => {

        try {

            const { id } = req.params;

            const {
                status,
                technician_comment
            } = req.body;


            const booking =
                await Booking.findByIdAndUpdate(

                    id,

                    {
                        status,
                        technician_comment
                    },

                    {
                        new: true
                    }

                );


            if (!booking) {

                return res.status(404).json({

                    message: "Booking not found"

                });

            }


            res.json({

                message: "Updated Successfully",

                booking

            });

        } catch (err) {

            console.error(
                "Update Status Error:",
                err
            );

            res.status(500).json({

                message: "Update Failed"

            });

        }

    }
);


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


            const result = bookings.map((booking) => ({

                ...booking.toObject(),

                technician_name: booking.technician_id ?
                    booking.technician_id.name : null,

                employee_code: booking.technician_id ?
                    booking.technician_id.employee_code : null,

                technician_phone: booking.technician_id ?
                    booking.technician_id.phone : null

            }));


            res.json(result);

        } catch (err) {

            console.error(
                "My Bookings Error:",
                err
            );

            res.status(500).json({

                message: "Server Error"

            });

        }

    }
);


module.exports = router;