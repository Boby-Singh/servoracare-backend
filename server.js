const express = require("express")
const cors = require("cors")
require("dotenv").config()
const bookingRoutes = require("./routes/bookingRoutes")
const authRoutes = require("./routes/authRoutes")
const adminRoutes = require("./routes/adminRoutes")


const app = express()

app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://servoracare.vercel.app" // Replace after deploying to Vercel
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json())

app.use("/api", bookingRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.get("/", (req, res) => {
    res.send("ServoraCare API Running")
})

app.listen(process.env.PORT, () => {

    console.log(
        `Server Running On Port ${process.env.PORT}`
    )

})
