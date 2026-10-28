// const jwt = require("jsonwebtoken");
// const User = require("../models/User");

// async function requireAdmin(req, res, next) {
//     try {
//         const authorization = req.headers.authorization || "";

//         if (!authorization.startsWith("Bearer ")) {
//             return res.status(401).json({
//                 message: "Authentication required.",
//             });
//         }

//         const token = authorization.slice(7);
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);

//         const userId = decoded.id || decoded.userId || decoded._id;

//         if (!userId) {
//             return res.status(401).json({
//                 message: "Invalid authentication token.",
//             });
//         }

//         const user = await User.findById(userId).select("role");

//         if (!user) {
//             return res.status(401).json({
//                 message: "User not found.",
//             });
//         }

//         if (String(user.role).toLowerCase() !== "admin") {
//             return res.status(403).json({
//                 message: "Administrator access required.",
//             });
//         }

//         req.admin = user;
//         next();
//     } catch (error) {
//         if (
//             error.name === "JsonWebTokenError" ||
//             error.name === "TokenExpiredError"
//         ) {
//             return res.status(401).json({
//                 message: "Invalid or expired token.",
//             });
//         }

//         console.error("Admin authentication error:", error);

//         return res.status(500).json({
//             message: "Unable to verify administrator access.",
//         });
//     }
// }

// module.exports = requireAdmin;