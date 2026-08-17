const express = require("express");
const router = express.Router();

const multer = require("multer");
const mongoose = require("mongoose");
const fs = require("fs");

const JobApplication = require("../models/JobApplication");

// ==========================================
// MULTER STORAGE
// ==========================================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },

    filename: (req, file, cb) => {

        cb(
            null,
            Date.now() + "-" + file.originalname
        );

    }

});

// ==========================================
// MULTER UPLOAD
// ==========================================

// ==========================================
// FILE SIZE LIMITS
// ==========================================

const fileSizeLimits = {

    resume: 2 * 1024 * 1024, // 2 MB

    aadhaar_file: 200 * 1024, // 500 KB

    photo: 100 * 1024 // 300 KB

};

// ==========================================
// ALLOWED FILE TYPES
// ==========================================

const allowedTypes = {

    resume: [

        "application/pdf"

    ],

    aadhaar_file: [

        "application/pdf",

        "image/jpeg",

        "image/png"

    ],

    photo: [

        "image/jpeg",

        "image/png"

    ]

};


// ==========================================
// MULTER UPLOAD
// ==========================================

const upload = multer({

    storage: storage,

    limits: {
        fileSize: 2 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        const allowed =
            allowedTypes[file.fieldname];

        if (!allowed) {

            return cb(
                new Error("Invalid upload field")
            );

        }

        // ==========================================
        // CHECK MIME TYPE
        // ==========================================

        if (!allowed.includes(file.mimetype)) {

            return cb(
                new Error(
                    `Invalid file type for ${file.fieldname}`
                )
            );

        }


        cb(null, true);

    }

});

// ==========================================
// APPLY FOR JOB
// ==========================================

router.post(

    "/apply-job",

    upload.fields([

        {
            name: "resume",
            maxCount: 1
        },

        {
            name: "aadhaar_file",
            maxCount: 1
        },

        {
            name: "photo",
            maxCount: 1
        }

    ]),

    async(req, res) => {

        try {

            const {

                full_name,
                phone,
                email,
                city,
                position,
                experience,
                aadhaar,
                pan

            } = req.body;

            // ==================================
            // VALIDATION
            // ==================================

            if (!full_name ||
                !phone ||
                !email ||
                !city ||
                !position
            ) {

                return res.status(400).json({

                    success: false,

                    message: "Required fields are missing"

                });

            }

            // ==================================
            // FILE NAMES
            // ==================================

            const resume =
                req.files && req.files.resume ?
                req.files.resume[0].filename :
                null;

            const aadhaar_file =
                req.files && req.files.aadhaar_file ?
                req.files.aadhaar_file[0].filename :
                null;

            const photo =
                req.files && req.files.photo ?
                req.files.photo[0].filename :
                null;

            // ==================================
            // CREATE JOB APPLICATION
            // ==================================

            const application =
                await JobApplication.create({

                    full_name,

                    phone,

                    email,

                    city,

                    position,

                    experience,

                    aadhaar,

                    pan,

                    resume,

                    aadhaar_file,

                    photo

                });

            // ==================================
            // RESPONSE
            // ==================================

            res.status(201).json({

                success: true,

                message: "Application Submitted Successfully",

            });

        } catch (error) {

            console.error(
                "Job Application Error:",
                error
            );

            res.status(500).json({

                success: false,

                message: "Database Error"

            });

        }

    }

);

// ==========================================
// GET ALL JOB APPLICATIONS
// ADMIN
// ==========================================

router.get(

    "/admin/job-applications",

    async(req, res) => {

        try {

            const applications =
                await JobApplication.find()
                .sort({
                    created_at: -1
                });

            res.json(applications);

        } catch (error) {

            console.error(
                "Get Job Applications Error:",
                error
            );

            res.status(500).json({

                message: "Failed to fetch applications"

            });

        }

    }

);

// ==========================================
// UPDATE JOB APPLICATION STATUS
// ADMIN
// ==========================================

router.put(

    "/admin/job-status/:id",

    async(req, res) => {

        try {

            const { status } = req.body;

            const { id } = req.params;

            // ==================================
            // VALIDATE ID
            // ==================================

            if (!mongoose.Types.ObjectId.isValid(id)) {

                return res.status(400).json({

                    message: "Invalid Application ID"

                });

            }

            // ==================================
            // VALIDATE STATUS
            // ==================================

            if (!status) {

                return res.status(400).json({

                    message: "Status is required"

                });

            }

            // ==================================
            // UPDATE STATUS
            // ==================================

            const application =
                await JobApplication.findByIdAndUpdate(

                    id,

                    {
                        status: status
                    },

                    {
                        new: true
                    }

                );

            // ==================================
            // APPLICATION NOT FOUND
            // ==================================

            if (!application) {

                return res.status(404).json({

                    message: "Application Not Found"

                });

            }

            // ==================================
            // RESPONSE
            // ==================================

            res.json({

                message: "Status Updated",

                application

            });

        } catch (error) {

            console.error(
                "Update Job Status Error:",
                error
            );

            res.status(500).json({

                message: "Failed to update status"

            });

        }

    }

);

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;