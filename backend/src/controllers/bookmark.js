import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

// ✅ API to bookmark a post
router.post("/bookmark", async (req, res) => {
  try {
    const { user_id, opennote_id } = req.body;

    if (!user_id || !opennote_id) {
      return res.status(400).json({ error: "Missing user_id or opennote_id" });
    }

    // ✅ Check if the bookmark already exists
    const { data: existing, error: fetchError } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user_id)
      .eq("opennote_id", opennote_id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

    if (existing) {
      // ✅ Already bookmarked — remove it (toggle off)
      const { error: deleteError } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user_id)
        .eq("opennote_id", opennote_id);

      if (deleteError) throw deleteError;

      return res.json({ message: "Bookmark removed successfully", status: "removed" });
    }

    // ✅ Not bookmarked — insert it (toggle on)
    const { data, error } = await supabase
      .from("bookmarks")
      .insert([{ user_id, opennote_id }]);

    if (error) throw error;

    res.json({ message: "Post bookmarked successfully", status: "added", data });
  } catch (err) {
    console.error("❌ Bookmark Toggle Error:", err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ Optional: API to remove bookmark
router.delete("/bookmark", async (req, res) => {
  try {
    const { user_id, opennote_id } = req.body;

    if (!user_id || !opennote_id) {
      return res.status(400).json({ error: "Missing user_id or opennote_id" });
    }

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", user_id)
      .eq("opennote_id", opennote_id);

    if (error) throw error;

    res.json({ message: "Bookmark removed successfully" });
  } catch (err) {
    console.error("❌ Delete Bookmark Error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/bookmark/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("opennotes(*)") // join to get post details
      .eq("user_id", user_id);

    if (error) throw error;

    const bookmarks = data.map(entry => entry.opennotes);
    res.json({ bookmarks });
  } catch (err) {
    console.error("❌ Fetch Bookmarks Error:", err);
    res.status(500).json({ error: err.message });
  }
});


export default router;
