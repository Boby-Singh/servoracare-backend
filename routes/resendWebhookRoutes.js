const express = require("express");
const SupportEmail = require("../models/SupportEmail");

const router = express.Router();

// Resend inbound email webhook
router.post("/resend", async(req, res) => {
    try {
        const event = req.body;

        console.log("=================================");
        console.log("RESEND WEBHOOK RECEIVED");
        console.log("=================================");
        console.log(JSON.stringify(event, null, 2));

        // Only process inbound emails
        if (event.type !== "email.received") {
            return res.status(200).json({
                success: true,
                message: "Event ignored",
            });
        }

        const email = event.data;

        // Check if this email was already saved
        const existingEmail = await SupportEmail.findOne({
            emailId: email.email_id,
        });

        if (existingEmail) {
            console.log("Email already exists:", email.email_id);

            return res.status(200).json({
                success: true,
                message: "Email already saved",
            });
        }

        // Save email to MongoDB
        const supportEmail = new SupportEmail({
            emailId: email.email_id,
            from: email.from,
            to: email.to || [],
            subject: email.subject || "",
            messageId: email.message_id || "",
            attachments: email.attachments || [],
            status: "new",
            receivedAt: email.created_at ?
                new Date(email.created_at) :
                new Date(),
        });

        await supportEmail.save();

        console.log("✅ Support email saved to MongoDB");
        console.log("Email ID:", email.email_id);
        console.log("From:", email.from);
        console.log("Subject:", email.subject);

        return res.status(200).json({
            success: true,
            message: "Email received and saved",
        });

    } catch (error) {
        console.error("❌ Resend webhook error:", error);

        return res.status(500).json({
            success: false,
            message: "Webhook processing failed",
        });
    }
});

module.exports = router;