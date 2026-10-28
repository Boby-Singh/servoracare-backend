const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },

    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true,
    },

    excerpt: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
    },

    content: {
        type: String,
        required: true,
    },

    coverImage: {
        type: String,
        default: "",
        trim: true,
    },

    category: {
        type: String,
        required: true,
        trim: true,
        default: "Home Maintenance",
    },

    tags: {
        type: [String],
        default: [],
    },

    author: {
        type: String,
        default: "ServoraCare Team",
        trim: true,
    },

    featured: {
        type: Boolean,
        default: false,
    },

    status: {
        type: String,
        enum: ["draft", "published"],
        default: "draft",
        index: true,
    },

    publishedAt: {
        type: Date,
        default: null,
    },

    metaTitle: {
        type: String,
        default: "",
        trim: true,
        maxlength: 200,
    },

    metaDescription: {
        type: String,
        default: "",
        trim: true,
        maxlength: 320,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model("Blog", blogSchema);