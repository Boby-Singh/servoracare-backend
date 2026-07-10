const express = require("express")
const router = express.Router()

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
module.exports = router