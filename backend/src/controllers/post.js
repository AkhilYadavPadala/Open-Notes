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

// New: Upload a PDF for a text post (many PDFs per post)
router.post('/:postId/upload', upload.single('file'), async (req, res) => {
  try {
    const { postId } = req.params;
    const user_id = req.body.user_id || null;
    if (!postId || !req.file) {
      return res.status(400).json({ error: 'Missing postId or file' });
    }
    // ✅ Generate clean filename to avoid encoding issues
    const cleanFileName = generateCleanFileName(req.file.originalname);
    const filePath = `uploads/${cleanFileName}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('opennotes')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });
    if (uploadError) throw uploadError;
    // Get public URL
    const { data: publicUrlData } = supabase.storage.from('opennotes').getPublicUrl(filePath);
    const pdfUrl = publicUrlData.publicUrl;
    // Insert into uploads table
    const { data: uploadRow, error: insertError } = await supabase
      .from('uploads')
      .insert([
        {
          post_id: postId,
          user_id,
          url: pdfUrl,
          filename: req.file.originalname, // Keep original name for display
          created_at: new Date(),
        },
      ])
      .select();
    if (insertError) throw insertError;
    res.json({ message: 'PDF uploaded for post', upload: uploadRow[0] });
  } catch (err) {
    console.error('❌ Upload PDF error:', err);
    res.status(500).json({ error: err.message });
  }
});

// New: List all uploads for a text post
router.get('/:postId/uploads', async (req, res) => {
  try {
    const { postId } = req.params;
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ uploads: data });
  } catch (err) {
    console.error('❌ List uploads error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
