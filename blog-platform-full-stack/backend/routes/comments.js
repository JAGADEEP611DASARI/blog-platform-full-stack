import express from "express";
import Comment from "../models/Comment.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.delete("/:id", protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }
    await comment.deleteOne();
    res.json({ message: "Comment deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
