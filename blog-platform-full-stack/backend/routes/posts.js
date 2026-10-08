import express from "express";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().populate("author", "name email").sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("author", "name email");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post("/", protect, async (req, res) => {
  try {
    const { title, content } = req.body;
    const post = await Post.create({ title, content, author: req.user.id });
    res.status(201).json(await post.populate("author", "name email"));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }
    post.title = req.body.title ?? post.title;
    post.content = req.body.content ?? post.content;
    await post.save();
    res.json(await post.populate("author", "name email"));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }
    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get("/:id/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id }).populate("author", "name").sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post("/:id/comments", protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Comment text is required" });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const comment = await Comment.create({ text, post: post._id, author: req.user.id });
    res.status(201).json(await comment.populate("author", "name"));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
