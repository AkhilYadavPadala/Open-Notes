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

    // Fetch all liked post_ids for this user
    const { data: likedInteractions, error: likedError } = await supabase
      .from("user_interactions")
      .select("post_id")
      .eq("user_id", user_id)
      .eq("interaction_type", "like");
    if (likedError) throw likedError;
    const likedPostIds = likedInteractions ? likedInteractions.map(i => i.post_id) : [];

    // Add isLiked to each bookmarked post
    // Also add commentCount and bookmarkCount
    const postIds = data.map(entry => entry.opennotes.id);
    let commentCounts = {};
    let bookmarkCounts = {};
    if (postIds.length > 0) {
      const { data: commentData } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds);
      (commentData || []).forEach(row => {
        commentCounts[row.post_id] = (commentCounts[row.post_id] || 0) + 1;
      });

      const { data: bookmarkData } = await supabase
        .from('bookmarks')
        .select('opennote_id')
        .in('opennote_id', postIds);
      (bookmarkData || []).forEach(row => {
        bookmarkCounts[row.opennote_id] = (bookmarkCounts[row.opennote_id] || 0) + 1;
      });
    }

    const bookmarks = data.map(entry => ({
      ...entry.opennotes,
      isLiked: likedPostIds.includes(entry.opennotes.id),
      commentcount: commentCounts[entry.opennotes.id] || 0,
      bookmarkcount: bookmarkCounts[entry.opennotes.id] || 0,
    }));
    res.json({ bookmarks });
  } catch (err) {
    console.error("❌ Fetch Bookmarks Error:", err);
    res.status(500).json({ error: err.message });
  }
});


export default router;
