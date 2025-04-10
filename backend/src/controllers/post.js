import express from "express";
import multer from "multer";
import { supabase } from "../supabase.js";

const router = express.Router();
const upload = multer(); // Middleware for parsing form-data

router.post("/post", upload.none(), async (req, res) => {
  try {
    console.log("📩 Incoming Request Body:", req.body);  // Debugging

    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // ✅ Store text post in Supabase
    const { data, error } = await supabase
      .from("opennotes")
      .insert([
        {
          name: null,  
          url: null,  
          title,
          tags: "", 
          description,
          type: "text",  
          created_at: new Date(),
        }
      ]);

    if (error) throw error;

    res.json({ message: "Text post created successfully" });
  } catch (err) {
    console.error("❌ Post error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
