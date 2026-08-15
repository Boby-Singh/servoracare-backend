const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("../models/User");
const Booking = require("../models/Booking");


// ==========================================
// ADD TECHNICIAN
// ==========================================

router.post("/add-technician", async(req, res) => {

    try {

        const {
            name,
            email,
            password,
            employee_code,
            phone
        } = req.body;


        if (!name ||
            !email ||
            !password ||
            !employee_code ||
            !phone
        ) {

            return res.status(400).json({
                message: "All technician fields are required"
            });

        }


        // ==========================================
        // CHECK EMAIL
        // ==========================================

        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });


        if (existingUser) {

            return res.status(400).json({
                message: "Email Already Exists"
            });

        }


        // ==========================================
        // CHECK EMPLOYEE CODE
        // ==========================================

        const existingEmployee =
            await User.findOne({
                employee_code
            });


        if (existingEmployee) {

            return res.status(400).json({
                message: "Employee Code Already Exists"
            });

        }


        // ==========================================
        // HASH PASSWORD
        // ==========================================

        const hashedPassword =
            await bcrypt.hash(password, 10);


        // ==========================================
        // CREATE TECHNICIAN
        // ==========================================

        const technician =
            await User.create({

                name,

                email: email.toLowerCase().trim(),

                password: hashedPassword,

                role: "technician",

                employee_code,

                phone

            });


        res.status(201).json({

            message: "Technician Added Successfully",

            technician: {

                id: technician._id,

                name: technician.name,

                email: technician.email,

                role: technician.role,

                employee_code: technician.employee_code,

                phone: technician.phone

            }

        });


    } catch (error) {

        console.error(
            "Add Technician Error:",
            error
        );

        res.status(500).json({
            message: "Server Error"
        });

    }

});


// ==========================================
// ASSIGN TECHNICIAN
// ==========================================

router.put(
    "/assign-technician/:id",
    async(req, res) => {

        try {

            // IMPORTANT:
            // This is MongoDB _id
            const mongoBookingId = req.params.id;


            const {
                technician_id,
                visit_date,
                visit_time
            } = req.body;


            // ==========================================
            // VALIDATE BOOKING MONGODB ID
            // ==========================================

            if (!mongoose.Types.ObjectId.isValid(
                    mongoBookingId
                )) {

                return res.status(400).json({

                    message: "Invalid Booking MongoDB ID"

                });

            }


            // ==========================================
            // VALIDATE TECHNICIAN ID
            // ==========================================

            if (!mongoose.Types.ObjectId.isValid(
                    technician_id
                )) {

                return res.status(400).json({

                    message: "Invalid Technician ID"

                });

            }


            // ==========================================
            // CHECK TECHNICIAN
            // ==========================================

            const technician =
                await User.findOne({

                    _id: technician_id,

                    role: "technician"

                });


            if (!technician) {

                return res.status(404).json({

                    message: "Technician Not Found"

                });

            }


            // ==========================================
            // CHECK BOOKING
            // ==========================================

            const existingBooking =
                await Booking.findById(
                    mongoBookingId
                );


            if (!existingBooking) {

                return res.status(404).json({

                    message: "Booking Not Found"

                });

            }


            // ==========================================
            // UPDATE BOOKING
            // ==========================================

            const booking =
                await Booking.findByIdAndUpdate(

                    mongoBookingId,

                    {

                        technician_id: technician._id,

                        visit_date,

                        visit_time,

                        status: "Accepted",

                        accepted_at: new Date()

                    },

                    {

                        new: true

                    }

                );


            res.json({

                message: "Technician Assigned Successfully",

                booking

            });


        } catch (error) {

            console.error(
                "Assign Technician Error:",
                error
            );

            res.status(500).json({

                message: "Assignment Failed"

            });

        }

    }
);


// ==========================================
// GET CUSTOMERS
// ==========================================

router.get("/customers",
    async(req, res) => {

        try {

            const customers =
                await User.find({

                    role: "customer"

                })

            .select(
                "name email phone"
            )

            .sort({
                _id: -1
            });


            const result =
                await Promise.all(

                    customers.map(
                        async(customer) => {

                            const totalBookings =
                                await Booking.countDocuments({

                                    user_id: customer._id

                                });


                            return {

                                id: customer._id,

                                name: customer.name,

                                email: customer.email,

                                phone: customer.phone,

                                total_bookings: totalBookings,

                                status: totalBookings > 0 ?
                                    "Active" : "Inactive"

                            };

                        }
                    )

                );


            res.json(result);


        } catch (error) {

            console.error(
                "Get Customers Error:",
                error
            );

            res.status(500).json({
                message: "Server Error"
            });

        }

    });


// ==========================================
// GET TECHNICIANS
// ==========================================

router.get(
    "/technicians",
    async(req, res) => {

        try {

            const technicians =
                await User.find({

                    role: "technician"

                })

            .select(
                "name email employee_code phone"
            )

            .sort({
                _id: -1
            });


            const result =
                technicians.map(
                    (technician) => ({

                        id: technician._id,

                        name: technician.name,

                        email: technician.email,

                        employee_code: technician.employee_code,

                        phone: technician.phone

                    })
                );


            res.json(result);


        } catch (error) {

            console.error(
                "Get Technicians Error:",
                error
            );

            res.status(500).json({
                message: "Server Error"
            });

        }

    }
);


// ==========================================
// GET ALL BOOKINGS
// ==========================================

router.get(
    "/all-bookings",
    async(req, res) => {

        try {

            const bookings =
                await Booking.find()

            .populate({

                path: "technician_id",

                select: "name employee_code phone"

            })

            .sort({

                created_at: -1

            });


            const result =
                bookings.map(
                    (booking) => {

                        const data =
                            booking.toObject();


                        return {

                            ...data,

                            technician_name: booking.technician_id ?
                                booking
                                .technician_id
                                .name : null,

                            employee_code: booking.technician_id ?
                                booking
                                .technician_id
                                .employee_code : null,

                            technician_phone: booking.technician_id ?
                                booking
                                .technician_id
                                .phone : null

                        };

                    }
                );


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

    }
);


module.exports = router;