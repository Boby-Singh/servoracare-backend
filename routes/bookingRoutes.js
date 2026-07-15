const express = require("express")
const router = express.Router()

const db = require("../config/db")

router.post("/create-payment", async(req, res) => {

    try {

        const { bookingId, amount } = req.body;

        const upiId = "7828908522@axl"; // Replace with your actual UPI ID

        const paymentUrl =
            `upi://pay?pa=${upiId}&pn=ServoraCare&am=${amount}&cu=INR`;

        res.json({
            success: true,
            redirectUrl: paymentUrl
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Payment creation failed"
        });

    }

});

router.post("/book-service", (req, res) => {

    const {
        user_id,
        full_name,
        phone,
        address,
        service_type,
        amount
    } = req.body

    const sql = `
    INSERT INTO bookings
    (user_id, full_name, phone, address, service_type, amount)
    VALUES (?, ?, ?, ?, ?, ?)
    `

    db.query(
        sql, [user_id, full_name, phone, address, service_type, amount],
        (err, result) => {

            if (err) {
                console.log(err)
                res.status(500).json({
                    message: "Booking Failed"
                })
            } else {
                res.status(201).json({
                    message: "Booking Successful"
                })
            }

        }
    )

})

// fetch all BOOKING STATUS
router.get("/all-bookings", (req, res) => {

    const sql = `
    SELECT
      bookings.*,
      users.name AS technician_name
    FROM bookings
    LEFT JOIN users
      ON bookings.technician_id = users.id
    ORDER BY bookings.created_at DESC
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

//Technician Should See Assigned Jobs

router.get(
        "/technician-jobs/:id",
        (req, res) => {

            const technicianId = req.params.id

            const sql = `
      SELECT *
      FROM bookings
      WHERE technician_id = ?
    `

            db.query(
                sql, [technicianId],
                (err, result) => {

                    if (err)
                        return res.status(500).json(err)

                    res.json(result)
                }
            )
        }
    )
    // UPDATE BOOKING STATUS
router.put("/update-status/:id", (req, res) => {

    const { id } = req.params

    const {
        status,
        technician_comment
    } = req.body

    const sql = `
    UPDATE bookings
    SET status = ?,
        technician_comment = ?
    WHERE id = ?
  `

    db.query(
        sql, [status, technician_comment, id],
        (err) => {

            if (err) {
                return res.status(500).json({
                    message: "Update Failed"
                })
            }

            res.json({
                message: "Updated Successfully"
            })

        }
    )

})

router.get(
    "/my-bookings/:id",
    (req, res) => {

        const userId = req.params.id

        const sql = `
      SELECT
        bookings.*,
        users.name AS technician_name,
        users.employee_code,
        users.phone AS technician_phone
      FROM bookings
      LEFT JOIN users
      ON bookings.technician_id = users.id
      WHERE bookings.user_id = ?
      ORDER BY bookings.created_at DESC
    `

        db.query(
            sql, [userId],
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