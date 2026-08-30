const express = require("express");

const router = express.Router();

// Resend inbound email webhook
router.post("/resend", async(req, res) => {
    try {
        const event = req.body;

        console.log("=================================");
        console.log("RESEND WEBHOOK RECEIVED");
        console.log("=================================");
        console.log(JSON.stringify(event, null, 2));

        // Only process received emails
        if (event.type !== "email.received") {
            return res.status(200).json({
                success: true,
                message: "Event ignored"
            });
        }

        const email = event.data;

        console.log("From:", email.from);
        console.log("To:", email.to);
        console.log("Subject:", email.subject);
        console.log("Email ID:", email.email_id);
        console.log("Message ID:", email.message_id);

        return res.status(200).json({
            success: true,
            message: "Email received successfully"
        });

    } catch (error) {
        console.error("Resend webhook error:", error);

        return res.status(500).json({
            success: false,
            message: "Webhook processing failed"
        });
    }
});

module.exports = router;