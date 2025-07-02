import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

// ✅ API to post a comment on a post
router.post("/comment", async (req, res) => {
  try {
    const { user_id, post_id, comment_text } = req.body;

    if (!user_id || !post_id || !comment_text) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Insert the comment into the comments table
    const { data, error } = await supabase
      .from("comments")
      .insert([{ user_id, post_id, comment_text }])
      .select();

    if (error) throw error;

    res.json({ message: "Comment posted successfully", data });
  } catch (err) {
    console.error("❌ Comment Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ API to fetch comments for a specific post
router.get("/comment/:post_id", async (req, res) => {
  try {
    const { post_id } = req.params;

    // Join comments with users to get user info
    const { data, error } = await supabase
      .from("comments")
      .select("*, user:users(id, name, avatar_url)")
      .eq("post_id", post_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ comments: data });
  } catch (err) {
    console.error("❌ Fetch Comments Error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
