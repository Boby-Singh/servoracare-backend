const express = require("express");
const { Resend } = require("resend");
const SupportEmail = require("../models/SupportEmail");

const router = express.Router();

const resend = new Resend(process.env.RESEND_API_KEY);

router.post("/resend", async(req, res) => {
    try {
        const event = req.body;

        console.log("=================================");
        console.log("RESEND WEBHOOK RECEIVED");
        console.log("=================================");

        // Only process received emails
        if (event.type !== "email.received") {
            return res.status(200).json({
                success: true,
                message: "Event ignored",
            });
        }

        const email = event.data;

        // Prevent duplicate emails
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

        // Get the complete received email from Resend
        const { data: receivedEmail, error } =
        await resend.emails.receiving.get(email.email_id);

        if (error) {
            console.error("Failed to retrieve email:", error);

            return res.status(500).json({
                success: false,
                message: "Could not retrieve received email",
            });
        }

        // Save complete email to MongoDB
        const supportEmail = new SupportEmail({
            emailId: email.email_id,
            from: email.from,
            to: email.to || [],
            subject: email.subject || "",
            messageId: email.message_id || "",
            text: receivedEmail ? receivedEmail.text : "",
            html: receivedEmail ? receivedEmail.html : "",
            attachments: email.attachments || [],
            status: "new",
            receivedAt: email.created_at ?
                new Date(email.created_at) : new Date(),
        });



        await supportEmail.save();

        console.log("Complete support email saved");
        console.log("From:", email.from);
        console.log("Subject:", email.subject);
        console.log("Email ID:", email.email_id);

        return res.status(200).json({
            success: true,
            message: "Email received and saved",
        });

    } catch (error) {
        console.error("Resend webhook error:", error);

        return res.status(500).json({
            success: false,
            message: "Webhook processing failed",
        });
    }
});

module.exports = router;