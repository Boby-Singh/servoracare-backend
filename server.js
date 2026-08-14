// const dns = require("dns");

// dns.setServers(["8.8.8.8", "1.1.1.1"]);

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

app.use(
    "/uploads",
    express.static("uploads")
);

app.get("/", (req, res) => {
    res.send("ServoraCare API Running")
})

app.listen(process.env.PORT, () => {
    console.log(
        `Server Running On Port ${process.env.PORT}`
    )
})












// const express = require("express")
// const cors = require("cors")
// require("dotenv").config()
// process.env.TZ = "Asia/Kolkata";
// const bookingRoutes = require("./routes/bookingRoutes")
// const authRoutes = require("./routes/authRoutes")
// const adminRoutes = require("./routes/adminRoutes")
// const jobRoutes = require("./routes/jobRoutes");


// const app = express()

// app.use(cors({
//     origin: [
//         "https://www.servoracare.in",
//         "https://servoracare.in",
//         "http://localhost:5173/",
//         "https://servoracare.vercel.app" // Replace after deploying to Vercel
//     ],
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"]
// }));
// app.use(express.json())

// app.use("/api", bookingRoutes)
// app.use("/api/auth", authRoutes)
// app.use("/api/admin", adminRoutes)
// app.use("/api", jobRoutes); // Apply Job
// app.use(
//     "/uploads",
//     express.static("uploads")
// );
// app.get("/", (req, res) => {
//     res.send("ServoraCare API Running")
// })

// app.listen(process.env.PORT, () => {

//     console.log(
//         `Server Running On Port ${process.env.PORT}`
//     )

// })