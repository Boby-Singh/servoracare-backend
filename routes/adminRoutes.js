const express = require("express")
const router = express.Router()

const db = require("../config/db")
const bcrypt = require("bcryptjs")

// =========================
// ADD TECHNICIAN
// =========================
router.post(
    "/add-technician",
    async(req, res) => {

        try {

            const {
                name,
                email,
                password,
                employee_code,
                phone
            } = req.body

            // Check email exists
            const checkSql =
                "SELECT * FROM users WHERE email = ?"

            db.query(
                checkSql, [email],
                async(err, result) => {

                    if (err) {

                        console.log(err)

                        return res.status(500).json({
                            message: "Server Error"
                        })

                    }

                    if (result.length > 0) {

                        return res.status(400).json({
                            message: "Email Already Exists"
                        })

                    }

                    const hashedPassword =
                        await bcrypt.hash(password, 10)

                    const sql = `
                    INSERT INTO users
                    (
                    name,
                    email,
                    password,
                    role,
                    employee_code,
                    phone
                    )
                    VALUES
                    (
                    ?, ?, ?, 'technician', ?,?
                    )
                    `

                    db.query(
                        sql, [
                            name,
                            email,
                            hashedPassword,
                            employee_code,
                            phone
                        ],
                        (err, result) => {

                            if (err) {

                                console.log(err)

                                return res.status(500).json({
                                    message: "Failed"
                                })

                            }

                            res.json({
                                message: "Technician Added Successfully"
                            })

                        }
                    )

                }
            )

        } catch (error) {

            console.log(error)

            res.status(500).json({
                message: "Server Error"
            })

        }

    }
)

// =========================
// ASSIGN TECHNICIAN
// =========================
router.put(
    "/assign-technician/:id",
    (req, res) => {
        console.log(req.params.id);
        console.log(req.body);

        const bookingId = req.params.id;

        const {
            technician_id,
            visit_date,
            visit_time
        } = req.body;

        const checkTechSql = `
        SELECT id
        FROM users
        WHERE id = ?
        AND role = 'technician'
        `;

        db.query(
            checkTechSql, [technician_id],
            (err, techResult) => {

                if (err) {

                    console.log(err);

                    return res.status(500).json({
                        message: "Server Error"
                    });

                }

                if (techResult.length === 0) {

                    return res.status(404).json({
                        message: "Technician Not Found"
                    });

                }

                const sql = `
                UPDATE bookings
                SET
                    technician_id = ?,
                    visit_date = ?,
                    visit_time = ?,
                    status = 'Accepted',
                    accepted_at = NOW()
                WHERE id = ?
                `;

                db.query(
                    sql, [
                        technician_id,
                        visit_date,
                        visit_time,
                        bookingId
                    ],
                    (err) => {

                        if (err) {

                            console.log(err);

                            return res.status(500).json({
                                message: "Assignment Failed"
                            });

                        }

                        res.json({
                            message: "Technician Assigned Successfully"
                        });

                    }
                );

            }
        );

    }
);

// =========================
// GET CUSTOMERS
// =========================
router.get("/customers", (req, res) => {

        const sql = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      COUNT(b.id) AS total_bookings,
      CASE
        WHEN COUNT(b.id) > 0
        THEN 'Active'
        ELSE 'Inactive'
      END AS status
    FROM users u
    LEFT JOIN bookings b
      ON u.id = b.user_id
    WHERE u.role = 'customer'
    GROUP BY
      u.id,
      u.name,
      u.email,
      u.phone
    ORDER BY u.id DESC
  `

        db.query(sql, (err, result) => {

            if (err) {

                console.log(err)

                return res.status(500).json({
                    message: "Server Error"
                })

            }

            res.json(result)

        })

    })
    // =========================
    // GET TECHNICIANS
    // =========================
router.get(
    "/technicians",
    (req, res) => {

        const sql = `
        SELECT
        id,
        name,
        email,
        employee_code,
        phone
        FROM users
        WHERE role = 'technician'
        ORDER BY id DESC
        `

        db.query(
            sql,
            (err, result) => {

                if (err) {

                    console.log(err)

                    return res.status(500).json({
                        message: "Server Error"
                    })

                }

                res.json(result)

            }
        )

    }
)

module.exports = router