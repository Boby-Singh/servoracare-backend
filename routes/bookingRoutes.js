const express = require("express");
const router = express.Router();

const generate6DigitId = require("../utils/generateId");

const Booking = require("../models/Booking");
const User = require("../models/User");

const {
    sendNewBookingEmail,
    sendCompletionOTP
} = require("../utils/sendOTP");

const crypto = require("crypto");


// =====================================================
// CREATE PAYMENT
// =====================================================

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


// =====================================================
// CREATE BOOKING
// =====================================================

router.post("/book-service", async(req, res) => {

    try {

        const {
            user_id,
            full_name,
            phone,
            address,
            service_type,
            amount,
            latitude,
            longitude
        } = req.body;


        // =================================================
        // VALIDATION
        // =================================================

        if (!user_id ||
            !full_name ||
            !phone ||
            !address ||
            !service_type ||
            amount === undefined
        ) {

            return res.status(400).json({
                success: false,
                message: "All booking fields are required"
            });

        }


        // =================================================
        // LOCATION VALIDATION
        // =================================================

        if (
            latitude === undefined ||
            longitude === undefined ||
            latitude === null ||
            longitude === null ||
            !Number.isFinite(Number(latitude)) ||
            !Number.isFinite(Number(longitude))
        ) {

            return res.status(400).json({
                success: false,
                message: "Customer location is required"
            });

        }


        const customerLatitude = Number(latitude);
        const customerLongitude = Number(longitude);


        // =================================================
        // VALIDATE GPS RANGE
        // =================================================

        if (
            customerLatitude < -90 ||
            customerLatitude > 90 ||
            customerLongitude < -180 ||
            customerLongitude > 180
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid customer location"
            });

        }


        // =================================================
        // CHECK USER
        // =================================================

        const user = await User.findById(user_id);

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        }


        // =================================================
        // GENERATE 6-DIGIT BOOKING ID
        // =================================================

        let bookingId;

        let exists = true;

        while (exists) {

            bookingId = generate6DigitId();

            exists = await Booking.exists({
                booking_id: bookingId
            });

        }


        // =================================================
        // CREATE BOOKING
        // =================================================

        const booking = await Booking.create({

            booking_id: bookingId,

            user_id: user._id,

            full_name,

            phone,

            address,

            service_type,

            amount,

            status: "Pending",

            customer_location: {

                latitude: customerLatitude,

                longitude: customerLongitude

            }

        });


        // =================================================
        // SEND EMAIL TO ADMIN
        // =================================================

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


        // =================================================
        // RESPONSE
        // =================================================

        res.status(201).json({

            success: true,

            message: "Booking Successful",

            booking

        });


    } catch (error) {

        console.error(
            "Booking Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Booking Failed"
        });

    }

});


// =====================================================
// GET ALL BOOKINGS
// =====================================================

router.get("/all-bookings", async(req, res) => {

    try {

        const bookings = await Booking.find()

        .populate({

            path: "technician_id",

            select: "name employee_code phone location"

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


// =====================================================
// TECHNICIAN JOBS
// =====================================================

router.get("/technician-jobs/:id",
    async(req, res) => {

        try {

            const technicianId =
                req.params.id;


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


// =====================================================
// UPDATE BOOKING STATUS
// =====================================================

router.put("/update-status/:id",
    async(req, res) => {

        try {

            const { id } = req.params;

            const {
                status,
                technician_comment,
                rejection_reason,
                completion_comment
            } = req.body;


            // =============================================
            // VALIDATE STATUS
            // =============================================

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


            // =============================================
            // REJECTION VALIDATION
            // =============================================

            if (
                status === "Rejected" &&
                (!rejection_reason ||
                    rejection_reason.trim() === ""
                )
            ) {

                return res.status(400).json({

                    message: "Rejection reason is required"

                });

            }


            // =============================================
            // UPDATE DATA
            // =============================================

            const updateData = {

                status

            };


            // =============================================
            // TECHNICIAN COMMENT
            // =============================================

            if (
                technician_comment !== undefined
            ) {

                updateData.technician_comment =
                    technician_comment;

            }


            // =============================================
            // COMPLETION COMMENT
            // =============================================

            if (
                completion_comment !== undefined
            ) {

                updateData.completion_comment =
                    completion_comment;

            }


            // =============================================
            // REJECTION REASON
            // =============================================

            if (status === "Rejected") {

                updateData.rejection_reason =
                    rejection_reason.trim();

            } else {

                updateData.rejection_reason = null;

            }


            // =============================================
            // UPDATE BOOKING
            // =============================================

            const booking =
                await Booking.findByIdAndUpdate(

                    id,

                    updateData,

                    {
                        new: true,
                        runValidators: true
                    }

                );


            // =============================================
            // BOOKING NOT FOUND
            // =============================================

            if (!booking) {

                return res.status(404).json({

                    message: "Booking not found"

                });

            }


            // =============================================
            // SUCCESS
            // =============================================

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

    }
);

// =====================================================
// TECHNICIAN ACCEPT / REJECT JOB
// =====================================================

router.put("/technician-response/:bookingId", async(req, res) => {
    try {

        const { bookingId } = req.params;

        const {
            technician_id,
            response,
            rejection_reason
        } = req.body;

        // =============================================
        // VALIDATE BOOKING ID
        // =============================================

        if (!/^\d{6}$/.test(String(bookingId))) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID"
            });
        }

        // =============================================
        // VALIDATE TECHNICIAN ID
        // =============================================

        if (!technician_id) {
            return res.status(400).json({
                success: false,
                message: "Technician ID is required"
            });
        }

        // =============================================
        // VALIDATE RESPONSE
        // =============================================

        if (
            response !== "Accepted" &&
            response !== "Rejected"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid technician response"
            });
        }

        // =============================================
        // VALIDATE REJECTION REASON
        // =============================================

        if (response === "Rejected") {

            if (!rejection_reason ||
                rejection_reason.trim() === ""
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Rejection reason is required"
                });
            }

            if (rejection_reason.trim().length > 500) {
                return res.status(400).json({
                    success: false,
                    message: "Rejection reason cannot exceed 500 characters"
                });
            }
        }

        // =============================================
        // FIND BOOKING
        // =============================================

        const booking = await Booking.findOne({
            booking_id: Number(bookingId)
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // =============================================
        // VERIFY ASSIGNED TECHNICIAN
        // =============================================

        if (!booking.technician_id ||
            booking.technician_id.toString() !==
            technician_id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this booking"
            });
        }

        // =============================================
        // PREVENT DOUBLE RESPONSE
        // =============================================

        if (
            booking.technician_response &&
            booking.technician_response !== "Pending"
        ) {
            return res.status(400).json({
                success: false,
                message: `This job has already been ${booking.technician_response.toLowerCase()}`
            });
        }

        // =============================================
        // ACCEPT JOB
        // =============================================

        if (response === "Accepted") {

            const updatedBooking =
                await Booking.findOneAndUpdate({
                    booking_id: Number(bookingId),
                    technician_id: technician_id,
                    $or: [{
                            technician_response: "Pending"
                        },
                        {
                            technician_response: {
                                $exists: false
                            }
                        },
                        {
                            technician_response: null
                        }
                    ]
                }, {
                    $set: {
                        technician_response: "Accepted",
                        status: "Accepted",
                        technician_rejection_reason: "",
                        technician_response_at: new Date(),
                        accepted_at: new Date()
                    }
                }, {
                    new: true,
                    runValidators: true
                });

            if (!updatedBooking) {
                return res.status(400).json({
                    success: false,
                    message: "Job could not be accepted. It may have already been updated."
                });
            }

            return res.json({
                success: true,
                message: "Job accepted successfully",
                booking: updatedBooking
            });
        }

        // =============================================
        // REJECT JOB
        // =============================================

        if (response === "Rejected") {

            const updatedBooking =
                await Booking.findOneAndUpdate({
                    booking_id: Number(bookingId),
                    technician_id: technician_id,
                    $or: [{
                            technician_response: "Pending"
                        },
                        {
                            technician_response: {
                                $exists: false
                            }
                        },
                        {
                            technician_response: null
                        }
                    ]
                }, {
                    $set: {
                        technician_response: "Rejected",

                        // IMPORTANT:
                        // Keep booking Pending so admin
                        // can assign another technician.
                        status: "Pending",

                        technician_rejection_reason: rejection_reason.trim(),

                        technician_response_at: new Date(),

                        accepted_at: null
                    }
                }, {
                    new: true,
                    runValidators: true
                });

            if (!updatedBooking) {
                return res.status(400).json({
                    success: false,
                    message: "Job could not be rejected. It may have already been updated."
                });
            }

            return res.json({
                success: true,
                message: "Job rejected successfully",
                booking: updatedBooking
            });
        }

    } catch (error) {

        // =============================================
        // DETAILED SERVER ERROR
        // =============================================

        console.error(
            "Technician Response Error:",
            error
        );

        console.error(
            "Error Name:",
            error.name
        );

        console.error(
            "Error Message:",
            error.message
        );

        if (error.errors) {
            console.error(
                "Validation Errors:",
                Object.keys(error.errors).map((key) => ({
                    field: key,
                    message: error.errors[key].message
                }))
            );
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update technician response",
            error: process.env.NODE_ENV === "production" ?
                undefined : error.message
        });
    }
});

// =====================================================
// MY BOOKINGS
// =====================================================

router.get("/my-bookings/:id",
    async(req, res) => {

        try {

            const userId =
                req.params.id;


            const bookings =
                await Booking.find({

                    user_id: userId

                })

            .populate({

                path: "technician_id",

                select: "name employee_code phone"

            })

            .sort({

                created_at: -1

            });


            const result =
                bookings.map((booking) => {

                    const data =
                        booking.toObject();


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


// =====================================================
// REQUEST COMPLETION OTP
// =====================================================

router.post("/bookings/:id/request-completion-otp",
    async(req, res) => {

        try {

            const { id } = req.params;


            // =============================================
            // FIND BOOKING
            // =============================================

            const booking =
                await Booking.findById(id);


            if (!booking) {

                return res.status(404).json({

                    success: false,

                    message: "Booking not found"

                });

            }


            // =============================================
            // ONLY ACCEPTED BOOKINGS
            // =============================================

            if (
                booking.status !== "Accepted"
            ) {

                return res.status(400).json({

                    success: false,

                    message: "Only accepted bookings can be completed"

                });

            }


            // =============================================
            // FIND CUSTOMER
            // =============================================

            const customer =
                await User.findById(
                    booking.user_id
                );


            if (!customer) {

                return res.status(404).json({

                    success: false,

                    message: "Customer not found"

                });

            }


            // =============================================
            // CHECK CUSTOMER EMAIL
            // =============================================

            if (!customer.email) {

                return res.status(400).json({

                    success: false,

                    message: "Customer email not found"

                });

            }


            // =============================================
            // GENERATE 6 DIGIT OTP
            // =============================================

            const otp =
                crypto
                .randomInt(
                    100000,
                    1000000
                )
                .toString();


            // =============================================
            // OTP EXPIRES IN 5 MINUTES
            // =============================================

            const expires =
                new Date(
                    Date.now() +
                    5 * 60 * 1000
                );


            // =============================================
            // SAVE OTP
            // =============================================

            booking.completion_otp =
                otp;

            booking.completion_otp_expires =
                expires;

            booking.completion_otp_verified =
                false;


            await booking.save();


            console.log(
                `Completion OTP generated for booking ${booking.booking_id}: ${otp}`
            );


            // =============================================
            // SEND EMAIL TO CUSTOMER
            // =============================================

            try {

                await sendCompletionOTP(

                    customer.email,

                    customer.name,

                    booking,

                    otp

                );


                console.log(

                    `Completion OTP email sent to ${customer.email}`

                );


            } catch (emailError) {

                console.error(

                    "COMPLETION OTP EMAIL FAILED:",

                    emailError

                );


                return res.status(500).json({

                    success: false,

                    message: "OTP generated but email could not be sent"

                });

            }


            // =============================================
            // RESPONSE
            // =============================================

            return res.json({

                success: true,

                message: "Completion OTP sent to customer email"

            });


        } catch (error) {

            console.error(

                "Completion OTP Error:",

                error

            );


            return res.status(500).json({

                success: false,

                message: "Server error"

            });

        }

    }
);


// =====================================================
// VERIFY COMPLETION OTP
// =====================================================

router.post("/bookings/:id/verify-completion-otp",
    async(req, res) => {

        try {

            const { id } =
            req.params;

            const { otp } =
            req.body;


            // =============================================
            // OTP REQUIRED
            // =============================================

            if (!otp) {

                return res.status(400).json({

                    success: false,

                    message: "OTP is required"

                });

            }


            // =============================================
            // FIND BOOKING
            // =============================================

            const booking =
                await Booking.findById(id);


            if (!booking) {

                return res.status(404).json({

                    success: false,

                    message: "Booking not found"

                });

            }


            // =============================================
            // CHECK STATUS
            // =============================================

            if (
                booking.status !== "Accepted"
            ) {

                return res.status(400).json({

                    success: false,

                    message: "This booking cannot be completed"

                });

            }


            // =============================================
            // CHECK OTP EXPIRY
            // =============================================

            if (!booking.completion_otp_expires ||
                booking.completion_otp_expires <
                new Date()
            ) {

                return res.status(400).json({

                    success: false,

                    message: "OTP has expired. Please request a new OTP."

                });

            }


            // =============================================
            // CHECK OTP
            // =============================================

            if (
                booking.completion_otp !==
                otp.toString()
            ) {

                return res.status(400).json({

                    success: false,

                    message: "Invalid OTP"

                });

            }


            // =============================================
            // OTP VERIFIED
            // =============================================

            booking.completion_otp_verified =
                true;

            booking.status =
                "Completed";

            booking.completed_at =
                new Date();


            // =============================================
            // REMOVE OTP
            // =============================================

            booking.completion_otp =
                null;

            booking.completion_otp_expires =
                null;


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

    }
);


// =====================================================
// FIND NEARBY TECHNICIANS
// =====================================================

router.get("/nearby-technicians/:bookingId",
    async(req, res) => {

        try {

            const { bookingId } =
            req.params;


            // =============================================
            // FIND BOOKING
            // =============================================

            const booking =
                await Booking.findById(
                    bookingId
                );


            if (!booking) {

                return res.status(404).json({

                    success: false,

                    message: "Booking not found"

                });

            }


            // =============================================
            // CHECK CUSTOMER LOCATION
            // =============================================

            const customerLocation =
                booking.customer_location;


            if (!customerLocation ||
                customerLocation.latitude === null ||
                customerLocation.longitude === null ||
                customerLocation.latitude === undefined ||
                customerLocation.longitude === undefined
            ) {

                return res.status(400).json({

                    success: false,

                    message: "Customer location is not available"

                });

            }


            const customerLat =
                Number(
                    customerLocation.latitude
                );

            const customerLng =
                Number(
                    customerLocation.longitude
                );


            if (!Number.isFinite(customerLat) ||
                !Number.isFinite(customerLng)
            ) {

                return res.status(400).json({

                    success: false,

                    message: "Invalid customer location"

                });

            }


            // =============================================
            // MAXIMUM SEARCH RADIUS
            // =============================================

            const MAX_DISTANCE_KM = 20;


            // =============================================
            // GET TECHNICIANS
            // =============================================

            const technicians =
                await User.find({

                    role: "technician",

                    "location.latitude": {
                        $ne: null
                    },

                    "location.longitude": {
                        $ne: null
                    }

                }).select(
                    "name email phone employee_code location"
                );


            // =============================================
            // HAVERSINE DISTANCE FUNCTION
            // =============================================

            const toRadians =
                (degrees) => {

                    return (
                        degrees *
                        Math.PI /
                        180
                    );

                };


            const calculateDistance =
                (
                    lat1,
                    lon1,
                    lat2,
                    lon2
                ) => {

                    const R = 6371;


                    const dLat =
                        toRadians(
                            lat2 - lat1
                        );


                    const dLon =
                        toRadians(
                            lon2 - lon1
                        );


                    const a =

                        Math.sin(
                            dLat / 2
                        ) *
                        Math.sin(
                            dLat / 2
                        )

                    +

                    Math.cos(
                        toRadians(lat1)
                    )

                    *

                    Math.cos(
                        toRadians(lat2)
                    )

                    *

                    Math.sin(
                        dLon / 2
                    )

                    *

                    Math.sin(
                        dLon / 2
                    );


                    const c =
                        2 *
                        Math.atan2(
                            Math.sqrt(a),
                            Math.sqrt(1 - a)
                        );


                    return R * c;

                };


            // =============================================
            // CALCULATE DISTANCES
            // =============================================

            const nearbyTechnicians =

                technicians

                .map((technician) => {

                const technicianLat =
                    Number(
                        technician.location.latitude
                    );


                const technicianLng =
                    Number(
                        technician.location.longitude
                    );


                const distance =
                    calculateDistance(

                        customerLat,

                        customerLng,

                        technicianLat,

                        technicianLng

                    );


                return {

                    _id: technician._id,

                    name: technician.name,

                    email: technician.email,

                    phone: technician.phone,

                    employee_code: technician.employee_code,

                    latitude: technicianLat,

                    longitude: technicianLng,

                    distance_km: Number(
                        distance.toFixed(2)
                    )

                };

            })

            .filter(
                (technician) =>
                technician.distance_km <=
                MAX_DISTANCE_KM
            )

            .sort(
                (a, b) =>
                a.distance_km -
                b.distance_km
            );


            // =============================================
            // RESPONSE
            // =============================================

            return res.json({

                success: true,

                radius_km: MAX_DISTANCE_KM,

                customer_location: {

                    latitude: customerLat,

                    longitude: customerLng

                },

                count: nearbyTechnicians.length,

                technicians: nearbyTechnicians

            });


        } catch (error) {

            console.error(

                "Nearby Technicians Error:",

                error

            );


            return res.status(500).json({

                success: false,

                message: "Failed to find nearby technicians"

            });

        }

    }
);


module.exports = router;