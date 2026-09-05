const express = require("express")
const cors = require("cors")
require("dotenv").config()
process.env.TZ = "Asia/Kolkata";
const connectDB = require("./config/db");
const path = require("path");
const bookingRoutes = require("./routes/bookingRoutes")
const authRoutes = require("./routes/authRoutes")
const adminRoutes = require("./routes/adminRoutes")
const jobRoutes = require("./routes/jobRoutes");
const resendWebhookRoutes = require("./routes/resendWebhookRoutes");
const supportRoutes = require("./routes/supportRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const app = express()

connectDB();

app.use(cors({
    origin: [
        "https://www.servoracare.in",
        "https://servoracare.in",
        "http://localhost:5173",
        "https://servoracare.vercel.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json())
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);
app.use("/api", bookingRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api", jobRoutes);
app.use("/api/webhooks", resendWebhookRoutes);
app.use("/api/support-emails", supportRoutes);
app.use("/api", paymentRoutes);

app.get("/", (req, res) => {
    res.send("ServoraCare API Running")
})

app.listen(process.env.PORT, () => {
    console.log(
        `Server Running On Port ${process.env.PORT}`
    )
})