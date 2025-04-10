import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

// ✅ API to record user interaction (like/view)
router.post("/interact", async (req, res) => {
  try {
    const { user_id, post_id, interaction_type } = req.body;

    if (!user_id || !post_id || !interaction_type) {
      return res.status(400).json({ error: "Missing fields" });
    }

    if (!["like", "view"].includes(interaction_type)) {
      return res.status(400).json({ error: "Invalid interaction type" });
    }

    // ✅ Insert into user_interactions table
    const { data, error } = await supabase
      .from("user_interactions")
      .insert([{ user_id, post_id, interaction_type }]);

    if (error) throw error;

    res.json({ message: `${interaction_type} recorded successfully` });
  } catch (err) {
    console.error("❌ Interaction Error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
