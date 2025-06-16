import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

// ✅ Register a New User
router.post("/", async (req, res) => {
  try {
    const { name, email, interests } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    // ✅ Insert User into Database
    const { data, error } = await supabase
      .from("users")
      .insert([{ name, email, interests }]);

    if (error) throw error;

    res.json({ message: "User registered successfully", user: data });
  } catch (err) {
    console.error("❌ Registration Error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
