const mongoose = require("mongoose");

const supportEmailSchema = new mongoose.Schema({
    emailId: {
        type: String,
        required: true,
        unique: true,
    },

    from: {
        type: String,
        required: true,
    },

    to: {
        type: [String],
        default: [],
    },

    subject: {
        type: String,
        default: "",
    },

    messageId: {
        type: String,
        default: "",
    },

    text: {
        type: String,
        default: "",
    },

    html: {
        type: String,
        default: "",
    },

    attachments: {
        type: Array,
        default: [],
    },

    status: {
        type: String,
        enum: ["new", "read", "replied"],
        default: "new",
    },

    receivedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model("SupportEmail", supportEmailSchema);