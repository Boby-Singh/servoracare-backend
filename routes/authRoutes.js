const express = require("express");
const router = express.Router();
const generate6DigitId = require("../utils/generateId");
const sendOTP = require("../utils/sendOTP");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");


// =====================================================
// REGISTER USER
// =====================================================

router.post("/register", async(req, res) => {

    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if user already exists
        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email Already Exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // ==========================================
        // GENERATE NEXT USER ID
        // ==========================================

        const users = await User.find({})
            .select("user_id")
            .lean();

        const validUserIds = users
            .map(user => Number(user.user_id))
            .filter(id => Number.isInteger(id) && id > 0);

        const nextUserId =
            validUserIds.length > 0 ?
            Math.max(...validUserIds) + 1 :
            1;

        // Create user
        const user = await User.create({
            user_id: nextUserId,
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role: "customer"
        });

        return res.status(201).json({
            message: "User Registered Successfully"
        });

    } catch (error) {

        console.log("Register Error:", error);

        return res.status(500).json({
            message: "Server Error"
        });
    }
});


// =====================================================
// LOGIN USER
// =====================================================

router.post("/login", async(req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Find user
        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid Email"
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid Password"
            });
        }

        // Create JWT
        const token = jwt.sign({
                id: user._id.toString(),
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET, {
                expiresIn: "7d"
            }
        );

        return res.status(200).json({

            message: "Login Successful",

            token,

            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role
            }

        });

    } catch (error) {

        console.log("Login Error:", error);

        return res.status(500).json({
            message: "Server Error"
        });
    }
});


// =====================================================
// FORGOT PASSWORD
// =====================================================

router.post("/forgot-password", async(req, res) => {

    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check user exists
        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.json({
                success: false,
                message: "Email not registered"
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        // OTP expires after 5 minutes
        const expiry = new Date(
            Date.now() + 5 * 60 * 1000
        );

        // Remove previous OTP
        await PasswordReset.deleteMany({
            email: normalizedEmail
        });

        // Save new OTP
        await PasswordReset.create({
            email: normalizedEmail,
            otp,
            expires_at: expiry,
            verified: false
        });

        console.log("OTP SAVED:", {
            email: normalizedEmail,
            otp,
            expires: expiry
        });

        // Send OTP
        try {

            await sendOTP(normalizedEmail, otp);

            console.log(
                "OTP EMAIL SENT SUCCESSFULLY"
            );

        } catch (emailError) {

            console.log(
                "RESEND EMAIL ERROR:",
                emailError
            );

            // Remove OTP if email failed
            await PasswordReset.deleteMany({
                email: normalizedEmail
            });

            return res.status(500).json({
                success: false,
                message: "Failed to send OTP email"
            });
        }

        return res.json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (error) {

        console.log(
            "Forgot password error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});


// =====================================================
// VERIFY OTP
// =====================================================

router.post("/verify-otp", async(req, res) => {

    try {

        const {
            email,
            otp
        } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Find valid OTP
        const resetData = await PasswordReset.findOne({
            email: normalizedEmail,
            otp: otp,
            expires_at: {
                $gt: new Date()
            }
        }).sort({
            createdAt: -1
        });

        console.log("OTP DATA:", resetData);

        if (!resetData) {
            return res.json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        // Mark OTP as verified
        resetData.verified = true;

        await resetData.save();

        return res.json({
            success: true,
            message: "OTP verified"
        });

    } catch (error) {

        console.log(
            "Verify OTP Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});


// =====================================================
// RESET PASSWORD
// =====================================================

router.post("/reset-password", async(req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check OTP was verified
        const resetData = await PasswordReset.findOne({
            email: normalizedEmail,
            verified: true,
            expires_at: {
                $gt: new Date()
            }
        }).sort({
            createdAt: -1
        });

        if (!resetData) {
            return res.status(400).json({
                success: false,
                message: "OTP verification required"
            });
        }

        // Hash new password
        const hash = await bcrypt.hash(
            password,
            10
        );

        // Update user password
        const updatedUser = await User.findOneAndUpdate({
            email: normalizedEmail
        }, {
            password: hash
        }, {
            new: true
        });

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Delete reset records
        await PasswordReset.deleteMany({
            email: normalizedEmail
        });

        return res.json({
            success: true,
            message: "Password updated successfully"
        });

    } catch (error) {

        console.log(
            "Reset Password Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

// ==========================================
// UPDATE USER PROFILE
// ==========================================

router.put("/update-profile/:userId", async(req, res) => {
    try {

        const { userId } = req.params;
        const { name, phone } = req.body;

        // -----------------------------
        // VALIDATION
        // -----------------------------

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name is required"
            });
        }

        // -----------------------------
        // FIND USER
        // -----------------------------

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // -----------------------------
        // UPDATE
        // -----------------------------

        user.name = name.trim();

        if (phone !== undefined) {
            user.phone = phone.trim();
        }

        await user.save();

        // -----------------------------
        // RESPONSE
        // -----------------------------

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",

            user: {
                id: user._id,
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });

    } catch (error) {

        console.error(
            "Update Profile Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error while updating profile"
        });
    }
});



module.exports = router;