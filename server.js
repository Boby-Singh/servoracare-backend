const express = require("express")
const cors = require("cors")
require("dotenv").config()
process.env.TZ = "Asia/Kolkata";
const connectDB = require("./config/db");

const bookingRoutes = require("./routes/bookingRoutes")
const authRoutes = require("./routes/authRoutes")
const adminRoutes = require("./routes/adminRoutes")
const jobRoutes = require("./routes/jobRoutes");

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

app.use("/api", bookingRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api", jobRoutes);



app.get("/", (req, res) => {
    res.send("ServoraCare API Running")
})

app.listen(process.env.PORT, () => {
    console.log(
        `Server Running On Port ${process.env.PORT}`
    )
})