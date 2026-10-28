const express = require("express");
const mongoose = require("mongoose");
const Blog = require("../models/Blog");


const router = express.Router();

// Create a URL-friendly slug from a title.
function makeSlug(value) {
    return String(value || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 150);
}

// Generate a unique slug.
async function uniqueSlug(title, excludeId = null) {
    const base = makeSlug(title) || "article";
    let slug = base;
    let count = 2;

    while (
        await Blog.exists({
            slug,
            ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        })
    ) {
        slug = `${base}-${count++}`;
    }

    return slug;
}

// Convert tags into an array.
function parseTags(value) {
    if (Array.isArray(value)) {
        return value
            .map(String)
            .map((tag) => tag.trim())
            .filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);
    }

    return [];
}
// Validate required article fields.
function validateArticle(body) {
    if (!body.title || !body.title.trim()) {
        return "Title is required.";
    }

    if (!body.excerpt || !body.excerpt.trim()) {
        return "Excerpt is required.";
    }

    if (!body.content || !body.content.trim()) {
        return "Content is required.";
    }

    if (!body.category || !body.category.trim()) {
        return "Category is required.";
    }

    if (
        body.status &&
        !["draft", "published"].includes(body.status)
    ) {
        return "Status must be draft or published.";
    }

    return null;
}

// Extract allowed article fields.
function articleFields(body) {
    return {
        title: String(body.title || "").trim(),
        excerpt: String(body.excerpt || "").trim(),
        content: String(body.content || ""),
        coverImage: String(body.coverImage || "").trim(),
        category: String(body.category || "Home Maintenance").trim(),
        tags: parseTags(body.tags),
        author: String(body.author || "ServoraCare Team").trim(),
        featured: body.featured === true || body.featured === "true",
        metaTitle: String(body.metaTitle || "").trim(),
        metaDescription: String(body.metaDescription || "").trim(),
    };
}

// PUBLIC: List published articles.
router.get("/", async(req, res) => {
    try {
        const page = Math.max(
            1,
            Number.parseInt(req.query.page, 10) || 1
        );

        const limit = Math.min(
            50,
            Math.max(1, Number.parseInt(req.query.limit, 10) || 50)
        );

        const filter = { status: "published" };

        if (req.query.category) {
            filter.category = String(req.query.category);
        }

        if (req.query.search) {
            const search = String(req.query.search)
                .trim()
                .slice(0, 100);

            if (search) {
                const escaped = search.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                );

                filter.$or = [
                    { title: { $regex: escaped, $options: "i" } },
                    { excerpt: { $regex: escaped, $options: "i" } },
                    { category: { $regex: escaped, $options: "i" } },
                    { tags: { $regex: escaped, $options: "i" } },
                ];
            }
        }

        const [posts, total] = await Promise.all([
            Blog.find(filter)
            .select("-content")
            .sort({ featured: -1, publishedAt: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),

            Blog.countDocuments(filter),
        ]);

        return res.json({
            posts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("List blogs error:", error);

        return res.status(500).json({
            message: "Unable to load articles.",
        });
    }
});

// PUBLIC: List published categories.
// Keep this before the /:slug route.
router.get("/categories", async(req, res) => {
    try {
        const categories = await Blog.distinct("category", {
            status: "published",
        });

        return res.json({
            categories: categories.filter(Boolean).sort(),
        });
    } catch (error) {
        console.error("Blog categories error:", error);

        return res.status(500).json({
            message: "Unable to load categories.",
        });
    }
});

// ADMIN: List all articles, including drafts.
router.get("/admin", async(req, res) => {
    try {
        const posts = await Blog.find({})
            .sort({ updatedAt: -1 })
            .lean();

        return res.json({ posts });
    } catch (error) {
        console.error("Admin blog list error:", error);

        return res.status(500).json({
            message: "Unable to load admin articles.",
        });
    }
});

// ADMIN: Create an article.
router.post("/admin", async(req, res) => {
    try {
        const validationError = validateArticle(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError,
            });
        }

        const fields = articleFields(req.body);
        const status = req.body.status || "draft";
        const slug = await uniqueSlug(fields.title);

        const post = await Blog.create({
            ...fields,
            slug,
            status,
            publishedAt: status === "published" ? new Date() : null,
        });

        return res.status(201).json({
            message: "Article created successfully.",
            post,
        });
    } catch (error) {
        console.error("Create blog error:", error);

        return res.status(500).json({
            message: "Unable to create article.",
        });
    }
});

// ADMIN: Update an article.
router.put("/admin/:id", async(req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid article ID.",
            });
        }

        const post = await Blog.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Article not found.",
            });
        }

        const mergedData = {
            ...post.toObject(),
            ...req.body,
        };

        const validationError = validateArticle(mergedData);

        if (validationError) {
            return res.status(400).json({
                message: validationError,
            });
        }

        const fields = articleFields(mergedData);
        const previousStatus = post.status;
        const nextStatus = req.body.status || previousStatus;

        if (!["draft", "published"].includes(nextStatus)) {
            return res.status(400).json({
                message: "Status must be draft or published.",
            });
        }

        if (
            req.body.title &&
            req.body.title.trim() !== post.title
        ) {
            post.slug = await uniqueSlug(fields.title, post._id);
        }

        Object.assign(post, fields);
        post.status = nextStatus;

        if (nextStatus === "published" && !post.publishedAt) {
            post.publishedAt = new Date();
        }

        if (nextStatus === "draft") {
            post.publishedAt = null;
        }

        await post.save();

        return res.json({
            message: "Article updated successfully.",
            post,
        });
    } catch (error) {
        console.error("Update blog error:", error);

        return res.status(500).json({
            message: "Unable to update article.",
        });
    }
});

// ADMIN: Delete an article.
router.delete("/admin/:id", async(req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid article ID.",
            });
        }

        const post = await Blog.findByIdAndDelete(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Article not found.",
            });
        }

        return res.json({
            message: "Article deleted successfully.",
        });
    } catch (error) {
        console.error("Delete blog error:", error);

        return res.status(500).json({
            message: "Unable to delete article.",
        });
    }
});

// PUBLIC: Fetch one published article by slug.
// Keep this route after /categories and /admin routes.
router.get("/:slug", async(req, res) => {
    try {
        const post = await Blog.findOne({
            slug: req.params.slug,
            status: "published",
        }).lean();

        if (!post) {
            return res.status(404).json({
                message: "Article not found.",
            });
        }

        return res.json({ post });
    } catch (error) {
        console.error("Get blog detail error:", error);

        return res.status(500).json({
            message: "Unable to load article.",
        });
    }
});

module.exports = router;