const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const db = require("../config/db");

// Storage

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

const upload = multer({ storage });

// Apply Job

router.post(

    "/apply-job",

    upload.fields([
        { name: "resume", maxCount: 1 },
        { name: "aadhaar_file", maxCount: 1 },
        { name: "photo", maxCount: 1 }
    ]),

    (req, res) => {

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

        const resume =
            req.files.resume ?
            req.files.resume[0].filename :
            null;

        const aadhaar_file =
            req.files.aadhaar_file ?
            req.files.aadhaar_file[0].filename :
            null;

        const photo =
            req.files.photo ?
            req.files.photo[0].filename :
            null;

        const sql = `
        INSERT INTO job_applications
        (
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
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(

            sql,

            [
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
            ],

            (err) => {

                if (err) {

                    console.log(err);

                    return res.status(500).json({
                        success: false,
                        message: "Database Error"
                    });

                }

                res.json({
                    success: true,
                    message: "Application Submitted Successfully"
                });

            }

        );

    }

);

router.get("/admin/job-applications", (req, res) => {

    db.query(

        "SELECT * FROM job_applications ORDER BY created_at DESC",

        (err, result) => {

            if (err)
                return res.status(500).json(err);

            res.json(result);

        }

    );

});

router.put("/admin/job-status/:id", (req, res) => {

    const { status } = req.body;

    db.query(

        "UPDATE job_applications SET status=? WHERE id=?",

        [status, req.params.id],

        (err) => {

            if (err)
                return res.status(500).json(err);

            res.json({
                message: "Status Updated"
            });

        }

    );

});

module.exports = router;