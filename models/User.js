// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({

//     user_id: {
//         type: Number,
//         unique: true,
//         required: true
//     },

//     name: {
//         type: String,
//         required: true
//     },

//     email: {
//         type: String,
//         required: true,
//         unique: true,
//         lowercase: true,
//         trim: true
//     },

//     password: {
//         type: String,
//         required: true
//     },

//     role: {
//         type: String,
//         enum: ["customer", "technician", "admin"],
//         default: "customer"
//     },

//     employee_code: {
//         type: String,
//         default: null
//     },

//     phone: {
//         type: String,
//         default: null
//     },

//     // =========================
//     // PROFILE
//     // =========================

//     profile: {

//         profile_picture: {
//             file_id: {
//                 type: mongoose.Schema.Types.ObjectId,
//                 default: null
//             },
//             filename: {
//                 type: String,
//                 default: null
//             },
//             content_type: {
//                 type: String,
//                 default: null
//             }
//         },

//         // =========================
//         // AADHAAR
//         // =========================

//         aadhaar: {
//             file_id: {
//                 type: mongoose.Schema.Types.ObjectId,
//                 default: null
//             },
//             filename: {
//                 type: String,
//                 default: null
//             },
//             content_type: {
//                 type: String,
//                 default: null
//             },
//             verified: {
//                 type: Boolean,
//                 default: false
//             }
//         },

//         // =========================
//         // RESUME
//         // =========================

//         resume: {
//             file_id: {
//                 type: mongoose.Schema.Types.ObjectId,
//                 default: null
//             },
//             filename: {
//                 type: String,
//                 default: null
//             },
//             content_type: {
//                 type: String,
//                 default: null
//             }
//         }

//     },

//     // ==========================================
//     // LOCATION
//     // ==========================================

//     location: {
//         latitude: {
//             type: Number,
//             default: null
//         },

//         longitude: {
//             type: Number,
//             default: null
//         },

//         updated_at: {
//             type: Date,
//             default: null
//         }
//     },

//     created_at: {
//         type: Date,
//         default: Date.now
//     }

// });

// module.exports = mongoose.model("User", userSchema);



const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    user_id: {
        type: Number,
        unique: true,
        required: true,
    },

    name: {
        type: String,
        required: true,
        trim: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },

    password: {
        type: String,
        required: true,
    },

    role: {
        type: String,
        enum: ["customer", "technician", "admin"],
        default: "customer",
    },

    employee_code: {
        type: String,
        default: null,
        trim: true,
    },

    phone: {
        type: String,
        default: null,
        trim: true,
    },

    // ==========================================
    // TECHNICIAN DETAILS
    // ==========================================

    address: {
        type: String,
        default: null,
        trim: true,
        maxlength: 500,
    },

    city: {
        type: String,
        default: null,
        trim: true,
        maxlength: 100,
    },

    specialization: {
        type: String,
        enum: [
            "Electrician",
            "Plumber",
            "AC Technician",
            "CCTV Technician",
            "Painter",
            "Cleaning Professional",
            "Multi-skilled Technician",
            "Other",
            null,
        ],
        default: null,
        trim: true,
    },

    // ==========================================
    // PROFILE DOCUMENTS
    // ==========================================

    profile: {
        profile_picture: {
            file_id: {
                type: mongoose.Schema.Types.ObjectId,
                default: null,
            },
            filename: {
                type: String,
                default: null,
            },
            content_type: {
                type: String,
                default: null,
            },
        },

        // Aadhaar document
        aadhaar: {
            file_id: {
                type: mongoose.Schema.Types.ObjectId,
                default: null,
            },
            filename: {
                type: String,
                default: null,
            },
            content_type: {
                type: String,
                default: null,
            },
            verified: {
                type: Boolean,
                default: false,
            },
        },

        // Resume document
        resume: {
            file_id: {
                type: mongoose.Schema.Types.ObjectId,
                default: null,
            },
            filename: {
                type: String,
                default: null,
            },
            content_type: {
                type: String,
                default: null,
            },
        },
    },

    // ==========================================
    // GPS LOCATION
    // ==========================================

    location: {
        latitude: {
            type: Number,
            default: null,
        },

        longitude: {
            type: Number,
            default: null,
        },

        updated_at: {
            type: Date,
            default: null,
        },
    },

    // ==========================================
    // ACCOUNT CREATION DATE
    // ==========================================

    created_at: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("User", userSchema);