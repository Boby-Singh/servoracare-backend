const express = require("express");
const router = express.Router();
const generate6DigitId = require("../utils/generateId");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("../models/User");
const Booking = require("../models/Booking");
const { sendTechnicianAssignedEmail, sendCustomerAssignedEmail } = require("../utils/sendOTP");

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

        let userId;
        let exists = true;

        while (exists) {

            userId = generate6DigitId();

            exists = await User.exists({
                user_id: userId
            });

        }
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

                user_id: technician.user_id,

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
    "/assign-technician/:bookingId",
    async(req, res) => {

        try {

            const bookingId =
                Number(req.params.bookingId);

            const {
                technician_id,
                visit_date,
                visit_time
            } = req.body;


            // ==========================================
            // VALIDATE BOOKING ID
            // ==========================================

            if (!bookingId ||
                !/^\d{6}$/.test(req.params.bookingId)
            ) {

                return res.status(400).json({

                    message: "Invalid 6-digit Booking ID"

                });

            }


            // ==========================================
            // VALIDATE TECHNICIAN
            // ==========================================

            if (!technician_id) {

                return res.status(400).json({

                    message: "Technician ID is required"

                });

            }


            // ==========================================
            // FIND TECHNICIAN
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
            // FIND BOOKING
            // ==========================================

            const booking =
                await Booking.findOne({

                    booking_id: bookingId

                });


            if (!booking) {

                return res.status(404).json({

                    message: "Booking Not Found"

                });

            }


            // ==========================================
            // FIND CUSTOMER
            // ==========================================

            const customer =
                await User.findById(
                    booking.user_id
                );


            if (!customer) {

                return res.status(404).json({

                    message: "Customer Not Found"

                });

            }


            // ==========================================
            // ASSIGN TECHNICIAN
            // ==========================================

            booking.technician_id =
                technician._id;

            booking.visit_date =
                visit_date || null;

            booking.visit_time =
                visit_time || null;

            booking.status =
                "Accepted";

            booking.accepted_at =
                new Date();


            await booking.save();


            // ==========================================
            // SEND EMAIL TO TECHNICIAN
            // ==========================================

            if (technician.email) {

                try {

                    await sendTechnicianAssignedEmail(

                        technician.email,

                        technician.name,

                        booking

                    );

                    console.log(
                        "Technician assignment email sent:",
                        technician.email
                    );

                } catch (emailError) {

                    console.error(
                        "Technician email failed:",
                        emailError
                    );

                }

            }


            // ==========================================
            // SEND EMAIL TO CUSTOMER
            // ==========================================

            if (customer.email) {

                try {

                    await sendCustomerAssignedEmail(

                        customer.email,

                        customer.name,

                        booking,

                        technician.name,

                        technician.phone

                    );

                    console.log(
                        "Customer assignment email sent:",
                        customer.email
                    );

                } catch (emailError) {

                    console.error(
                        "Customer email failed:",
                        emailError
                    );

                }

            }


            // ==========================================
            // RESPONSE
            // ==========================================

            return res.json({

                message: "Technician Assigned Successfully",

                booking

            });


        } catch (error) {

            console.error(
                "Assign Technician Error:",
                error
            );

            return res.status(500).json({

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