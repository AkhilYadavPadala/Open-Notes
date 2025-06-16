import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

// 🔍 Search uploaded files based on title, tags, or description
router.get("/files", async (req, res) => {
  try {
    const { query } = req.query; // Get search keyword from URL params

    console.log(`📂 Fetching files with search query: "${query}"`);

    let supabaseQuery = supabase.from("opennotes").select("*");

    // If a search query is provided, filter results
    if (query) {
      supabaseQuery = supabaseQuery.or(
        `title.ilike.%${query}%,tags.ilike.%${query}%,description.ilike.%${query}%`
      );
    }

    const { data, error } = await supabaseQuery;

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("❌ Error fetching files:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
