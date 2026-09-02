const express = require("express");
const router = express.Router();

const SupportEmail = require("../models/SupportEmail");

// ==========================================
// GET ALL SUPPORT EMAILS
// ==========================================
router.get("/", async(req, res) => {
    try {
        const emails = await SupportEmail.find()
            .sort({ receivedAt: -1 })
            .lean();

        res.json({
            success: true,
            emails,
        });
    } catch (error) {
        console.error("Fetch Support Emails Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch support emails",
        });
    }
});

// ==========================================
// GET UNREAD COUNT
// ==========================================
router.get("/unread-count", async(req, res) => {
    try {
        const count = await SupportEmail.countDocuments({
            status: "new",
        });

        res.json({
            success: true,
            count,
        });
    } catch (error) {
        console.error("Unread Count Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get unread count",
        });
    }
});

// ==========================================
// MARK EMAIL AS READ
// ==========================================
router.put("/:id/read", async(req, res) => {
    try {
        const email = await SupportEmail.findByIdAndUpdate(
            req.params.id, {
                status: "read",
            }, {
                new: true,
            }
        );

        if (!email) {
            return res.status(404).json({
                success: false,
                message: "Email not found",
            });
        }

        res.json({
            success: true,
            email,
        });
    } catch (error) {
        console.error("Mark Read Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to mark email as read",
        });
    }
});

// ==========================================
// MARK EMAIL AS REPLIED
// ==========================================
router.put("/:id/replied", async(req, res) => {
    try {
        const email = await SupportEmail.findByIdAndUpdate(
            req.params.id, {
                status: "replied",
            }, {
                new: true,
            }
        );

        if (!email) {
            return res.status(404).json({
                success: false,
                message: "Email not found",
            });
        }

        res.json({
            success: true,
            email,
        });
    } catch (error) {
        console.error("Mark Replied Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to mark email as replied",
        });
    }
});

// ==========================================
// DELETE SUPPORT EMAIL
// ==========================================
router.delete("/:id", async(req, res) => {
    try {
        const email = await SupportEmail.findByIdAndDelete(
            req.params.id
        );

        if (!email) {
            return res.status(404).json({
                success: false,
                message: "Email not found",
            });
        }

        res.json({
            success: true,
            message: "Email deleted successfully",
        });
    } catch (error) {
        console.error("Delete Support Email Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete email",
        });
    }
});

module.exports = router;