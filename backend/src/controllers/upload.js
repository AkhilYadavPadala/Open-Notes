import express from "express";
import multer from "multer";
import { supabase } from "../supabase.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Utility: Generate clean filename to avoid encoding issues
function generateCleanFileName(originalName) {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop().toLowerCase();
  const baseName = originalName.replace(/\.[^/.]+$/, ''); // Remove extension
  const cleanBaseName = baseName
    .replace(/[^a-zA-Z0-9]/g, '_') // Replace special chars with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
  
  return `${timestamp}_${cleanBaseName}.${extension}`;
}

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { title, tags, description } = req.body;

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (!title || !description) return res.status(400).json({ error: "Missing required fields" });

    // ✅ Generate clean filename to avoid encoding issues
    const cleanFileName = generateCleanFileName(req.file.originalname);
    const filePath = `uploads/${cleanFileName}`;

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
          name: req.file.originalname, // Keep original name for display
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

// Upload a PDF to a text post (with title, description, tags, file)
router.post("/upload-to-post/:postId", upload.single("file"), async (req, res) => {
  try {
    console.log("Start upload-to-post handler");
    const { title, tags, description } = req.body;
    const { postId } = req.params;
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    if (!req.file) {
      console.log("No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }
    if (!title || !description) {
      console.log("Missing required fields");
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Generate clean filename to avoid encoding issues
    const cleanFileName = generateCleanFileName(req.file.originalname);
    const filePath = `uploads/${cleanFileName}`;
    console.log("Uploading to storage:", filePath);

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from("opennotes")
      .upload(filePath, req.file.buffer, { contentType: req.file.mimetype });

    if (error) {
      console.log("Storage upload error:", error);
      throw error;
    }

    // Generate public URL
    const { data: urlData } = supabase.storage.from("opennotes").getPublicUrl(data.path);
    const filePublicUrl = urlData.publicUrl;
    console.log("Public URL:", filePublicUrl);

    if (!filePublicUrl) throw new Error("Public URL is undefined");

    // Store file details in opennotes table, link to parent post
    const { data: dbData, error: dbError } = await supabase
      .from("opennotes")
      .insert([
        {
          name: req.file.originalname, // Keep original name for display
          url: filePublicUrl,
          title,
          tags,
          description,
          type: "file",
          created_at: new Date(),
          parent_post_id: postId,
        }
      ]);

    if (dbError) {
      console.log("DB insert error:", dbError);
      throw dbError;
    }

    res.json({ fileUrl: filePublicUrl, message: "File uploaded to post successfully" });
  } catch (err) {
    console.error("❌ Upload to post error:", err);
    res.status(500).json({ error: err.message });
  }
});

// List all PDFs for a text post
router.get("/uploads-for-post/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const { data, error } = await supabase
      .from("opennotes")
      .select("*")
      .eq("parent_post_id", postId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ uploads: data });
  } catch (err) {
    console.error("❌ List uploads for post error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
