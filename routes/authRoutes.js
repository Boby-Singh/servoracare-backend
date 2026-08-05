const express = require("express")
const router = express.Router()
const transporter = require("../config/mailer");
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const db = require("../config/db")

// REGISTER USER
router.post("/register", async(req, res) => {

    try {

        const { name, email, password } = req.body

        // Default role
        const role = "customer"
        const checkEmailSql =
            "SELECT * FROM users WHERE email = ?"

        db.query(

            checkEmailSql,

            [email],

            async(err, result) => {

                if (result.length > 0) {

                    return res.status(400).json({
                        message: "Email Already Exists"
                    })

                }

            }

        )

        // Hash password
        const hashedPassword =
            await bcrypt.hash(password, 10)

        // Insert user
        const sql = `
      INSERT INTO users
      (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `

        db.query(

            sql,

            [name, email, hashedPassword, role],

            (error, result) => {

                if (error) {

                    console.log(error)

                    return res.status(500).json({
                        message: "Registration Failed"
                    })

                }

                res.status(201).json({
                    message: "User Registered Successfully"
                })

            }

        )

    } catch (error) {

        console.log(error)

        res.status(500).json({
            message: "Server Error"
        })

    }

})

// LOGIN USER
router.post("/login", (req, res) => {

    const {
        email,
        password
    } = req.body

    const sql = `
    SELECT * FROM users
    WHERE email = ?
  `

    db.query(sql, [email], async(err, result) => {

        if (err) {

            console.log(err)

            return res.status(500).json({
                message: "Server Error"
            })

        }

        if (result.length === 0) {

            return res.status(401).json({
                message: "Invalid Email"
            })

        }

        const user = result[0]

        const isMatch =
            await bcrypt.compare(
                password,
                user.password
            )

        if (!isMatch) {

            return res.status(401).json({
                message: "Invalid Password"
            })

        }

        const token = jwt.sign(

            {
                id: user.id,
                email: user.email,
                role: user.role
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "7d"
            }

        )

        res.status(200).json({

            message: "Login Successful",

            token,

            user: {

                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role

            }

        })

    })

})

router.post("/forgot-password", async(req, res) => {

    try {

        const { email } = req.body;

        const [user] = await db.query(
            "SELECT * FROM users WHERE email=?", [email]
        );

        if (user.length === 0) {
            return res.json({
                success: false,
                message: "Email not registered"
            });
        }


        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const expiry = new Date(Date.now() + 10 * 60 * 1000);


        await db.query(
            "INSERT INTO password_resets(email, otp, expires_at) VALUES(?,?,?)", [email, otp, expiry]
        );


        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "ServoraCare Password Reset",
            text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
        });


        res.json({
            success: true,
            message: "OTP sent successfully"
        });


    } catch (error) {

        console.log("Forgot password error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });

    }

});

router.post("/verify-otp", async(req, res) => {

    const { email, otp } = req.body;

    const [data] = await db.query(
        "SELECT * FROM password_resets WHERE email=? AND otp=? ORDER BY id DESC LIMIT 1", [email, otp]
    );

    if (data.length === 0) {
        return res.json({
            success: false,
            message: "Invalid OTP"
        });
    }

    if (new Date() > new Date(data[0].expires_at)) {
        return res.json({
            success: false,
            message: "OTP Expired"
        });
    }

    res.json({
        success: true
    });

});

router.post("/reset-password", async(req, res) => {

    const { email, password } = req.body;

    const hash = await bcrypt.hash(password, 10);

    await db.query(
        "UPDATE users SET password=? WHERE email=?", [hash, email]
    );

    await db.query(
        "DELETE FROM password_resets WHERE email=?", [email]
    );

    res.json({
        success: true,
        message: "Password Updated"
    });

});

module.exports = router