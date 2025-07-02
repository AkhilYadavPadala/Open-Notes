import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

// 🔍 Search uploaded files based on title, tags, or description
router.get("/files", async (req, res) => {
  try {
    const { query, user_id } = req.query; // Get search keyword and user_id from URL params

    console.log(`📂 Fetching files with search query: "${query}"`);

    let supabaseQuery = supabase.from("opennotes").select("*");

    // If a search query is provided, filter results
    if (query) {
      supabaseQuery = supabaseQuery.or(
        `title.ilike.%${query}%,tags.ilike.%${query}%,description.ilike.%${query}%`
      );
    }

    const { data: posts, error } = await supabaseQuery;
    if (error) throw error;

    let likedPostIds = [];
    let bookmarkedPostIds = [];
    if (user_id) {
      const { data: likedInteractions, error: likedError } = await supabase
        .from("user_interactions")
        .select("post_id")
        .eq("user_id", user_id)
        .eq("interaction_type", "like");
      if (likedError) throw likedError;
      likedPostIds = likedInteractions ? likedInteractions.map(i => i.post_id) : [];

      // Fetch bookmarked post ids for this user
      const { data: bookmarksData, error: bookmarksError } = await supabase
        .from("bookmarks")
        .select("opennote_id")
        .eq("user_id", user_id);
      if (bookmarksError) throw bookmarksError;
      bookmarkedPostIds = bookmarksData ? bookmarksData.map(b => b.opennote_id) : [];
    }

    // Fetch comment and bookmark counts for all posts
    const postIds = posts.map(post => post.id);
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

    const postsWithCounts = posts.map(post => ({
      ...post,
      isLiked: user_id ? likedPostIds.includes(post.id) : false,
      isBookmarked: user_id ? bookmarkedPostIds.includes(post.id) : false,
      commentcount: commentCounts[post.id] || 0,
      bookmarkcount: bookmarkCounts[post.id] || 0,
    }));

    res.json(postsWithCounts);
  } catch (err) {
    console.error("❌ Error fetching files:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
