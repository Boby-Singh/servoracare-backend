const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Booking = require("../models/Booking");


// =====================================================
// UPI CONFIGURATION
// =====================================================

const UPI_ID = "7828908522@axl";
const UPI_NAME = "ServoraCare";


// =====================================================
// CREATE PAYMENT
// =====================================================
// Customer requests payment link for an ACCEPTED booking.
// IMPORTANT:
// - booking_id is the ServoraCare business booking ID
// - amount is NEVER trusted from frontend
// - amount is taken from MongoDB
// =====================================================

router.post("/create-payment", async(req, res) => {
            try {
                const { bookingId, userId } = req.body;

                // -------------------------------------------------
                // VALIDATION
                // -------------------------------------------------

                if (!bookingId) {
                    return res.status(400).json({
                        success: false,
                        message: "Booking ID is required",
                    });
                }

                if (!userId) {
                    return res.status(400).json({
                        success: false,
                        message: "User ID is required",
                    });
                }

                // -------------------------------------------------
                // FIND BOOKING
                // -------------------------------------------------

                const booking = await Booking.findOne({
                    booking_id: Number(bookingId),
                });

                if (!booking) {
                    return res.status(404).json({
                        success: false,
                        message: "Booking not found",
                    });
                }

                // -------------------------------------------------
                // OWNERSHIP CHECK
                // -------------------------------------------------

                if (booking.user_id.toString() !== userId.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: "You are not authorized to pay for this booking",
                    });
                }

                // -------------------------------------------------
                // BOOKING MUST BE ACCEPTED
                // -------------------------------------------------

                if (booking.status !== "Accepted") {
                    return res.status(400).json({
                        success: false,
                        message: "Payment is available only after booking acceptance",
                    });
                }

                // -------------------------------------------------
                // ALREADY PAID
                // -------------------------------------------------

                if (booking.payment_status === "Paid") {
                    return res.status(400).json({
                        success: false,
                        message: "This booking has already been paid",
                    });
                }

                // -------------------------------------------------
                // GENERATE PAYMENT REFERENCE
                // -------------------------------------------------

                const paymentReference =
                    booking.payment_reference ||
                    `SC${booking.booking_id}${Date.now()
        .toString()
        .slice(-6)}`;

                if (!booking.payment_reference) {
                    booking.payment_reference = paymentReference;
                    await booking.save();
                }

                // -------------------------------------------------
                // USE DATABASE AMOUNT
                // -------------------------------------------------

                const amount = Number(booking.amount);

                if (!Number.isFinite(amount) || amount <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid booking amount",
                    });
                }

                // -------------------------------------------------
                // CREATE UPI DEEP LINK
                // -------------------------------------------------

                const paymentUrl =
                    `upi://pay?pa=${encodeURIComponent(UPI_ID)}` +
                    `&pn=${encodeURIComponent(UPI_NAME)}` +
                    `&tn=${encodeURIComponent(
        `ServoraCare Booking #${booking.booking_id} ${paymentReference}`
      )}` +
      `&am=${encodeURIComponent(amount.toFixed(2))}` +
      `&cu=INR`;

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.json({
      success: true,

      bookingId: booking.booking_id,

      amount,

      paymentReference,

      upiId: UPI_ID,

      paymentUrl,
    });
  } catch (error) {
    console.error("CREATE PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Payment creation failed",
    });
  }
});


// =====================================================
// SUBMIT PAYMENT
// =====================================================
// Customer clicks "I Have Paid"
// and optionally enters UTR.
// This DOES NOT mark payment as Paid.
// It changes payment_status -> Submitted.
// =====================================================

router.post("/submit-payment", async (req, res) => {
  try {
    const { bookingId, userId, utr } = req.body;

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // -------------------------------------------------
    // FIND BOOKING
    // -------------------------------------------------

    const booking = await Booking.findOne({
      booking_id: Number(bookingId),
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // -------------------------------------------------
    // OWNERSHIP
    // -------------------------------------------------

    if (booking.user_id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized payment submission",
      });
    }

    // -------------------------------------------------
    // CHECK BOOKING STATUS
    // -------------------------------------------------

    if (booking.status !== "Accepted") {
      return res.status(400).json({
        success: false,
        message: "Payment cannot be submitted for this booking",
      });
    }

    // -------------------------------------------------
    // ALREADY PAID
    // -------------------------------------------------

    if (booking.payment_status === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Payment is already verified",
      });
    }

    // -------------------------------------------------
    // ALREADY SUBMITTED
    // -------------------------------------------------

    if (booking.payment_status === "Submitted") {
      return res.status(400).json({
        success: false,
        message:
          "Payment is already submitted and awaiting verification",
      });
    }

    // -------------------------------------------------
    // SAVE PAYMENT SUBMISSION
    // -------------------------------------------------

    booking.payment_status = "Submitted";

    booking.payment_utr = utr?.trim() || null;

    booking.payment_submitted_at = new Date();

    booking.payment_rejection_reason = null;

    await booking.save();

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.json({
      success: true,
      message:
        "Payment submitted successfully. It will be verified by ServoraCare.",
      booking: {
        booking_id: booking.booking_id,
        payment_status: booking.payment_status,
        payment_utr: booking.payment_utr,
        payment_submitted_at:
          booking.payment_submitted_at,
      },
    });
  } catch (error) {
    console.error("SUBMIT PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit payment",
    });
  }
});


// =====================================================
// ADMIN VERIFY PAYMENT
// =====================================================
// Admin checks bank/UPI transaction and marks Paid.
// =====================================================

router.post("/admin/verify-payment", async (req, res) => {
  try {
    const { bookingId, action, rejectionReason } = req.body;

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment action",
      });
    }

    // -------------------------------------------------
    // FIND BOOKING
    // -------------------------------------------------

    const booking = await Booking.findOne({
      booking_id: Number(bookingId),
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // -------------------------------------------------
    // APPROVE
    // -------------------------------------------------

    if (action === "approve") {
      booking.payment_status = "Paid";

      booking.payment_verified_at = new Date();

      booking.payment_rejection_reason = null;

      await booking.save();

      return res.json({
        success: true,
        message: "Payment verified successfully",
        booking: {
          booking_id: booking.booking_id,
          payment_status: booking.payment_status,
        },
      });
    }

    // -------------------------------------------------
    // REJECT
    // -------------------------------------------------

    booking.payment_status = "Rejected";

    booking.payment_rejected_at = new Date();

    booking.payment_rejection_reason =
      rejectionReason?.trim() ||
      "Payment could not be verified.";

    await booking.save();

    return res.json({
      success: true,
      message: "Payment rejected",
      booking: {
        booking_id: booking.booking_id,
        payment_status: booking.payment_status,
        payment_rejection_reason:
          booking.payment_rejection_reason,
      },
    });
  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment",
    });
  }
});


// =====================================================
// GET PAYMENT STATUS
// =====================================================

router.get("/payment-status/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({
      booking_id: Number(bookingId),
    }).select(
      "booking_id amount status payment_status payment_reference payment_utr payment_submitted_at payment_verified_at payment_rejection_reason"
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("GET PAYMENT STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to get payment status",
    });
  }
});


module.exports = router;