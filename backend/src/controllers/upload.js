import express from "express";
import multer from "multer";
import { supabase } from "../supabase.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { title, tags, description } = req.body;

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (!title || !description) return res.status(400).json({ error: "Missing required fields" });

    const filePath = `uploads/${Date.now()}-${req.file.originalname}`;

    // ✅ Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from("opennotes")
      .upload(filePath, req.file.buffer, { contentType: req.file.mimetype });

    if (error) throw error;

    // ✅ Generate public URL
    const { data: urlData } = supabase.storage.from("opennotes").getPublicUrl(data.path);
    const filePublicUrl = urlData.publicUrl;

    if (!filePublicUrl) throw new Error("Public URL is undefined");

    // ✅ Store file details in Supabase Database
    const { data: dbData, error: dbError } = await supabase
      .from("opennotes")
      .insert([
        {
          name: req.file.originalname,
          url: filePublicUrl,
          title,
          tags,
          description,
          type: "file",  // 🔹 Mark it as a file
          created_at: new Date(),
        }
      ]);

    if (dbError) throw dbError;

    res.json({ fileUrl: filePublicUrl, message: "File uploaded successfully" });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
