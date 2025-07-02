import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

router.post("/interact", async (req, res) => {
  try {
    const { user_id, post_id, interaction_type } = req.body;

    if (!user_id || !post_id || !interaction_type) {
      return res.status(400).json({ error: "Missing fields" });
    }

    if (!["like", "view", "share"].includes(interaction_type)) {
      return res.status(400).json({ error: "Invalid interaction type" });
    }

    let columnToUpdate = null;
    if (interaction_type === "like") columnToUpdate = "likecount";
    else if (interaction_type === "view") columnToUpdate = "viewcount";
    else if (interaction_type === "share") columnToUpdate = "sharecount";

    // Check if interaction already exists
    const { data: existing, error: checkError } = await supabase
      .from("user_interactions")
      .select("*")
      .eq("user_id", user_id)
      .eq("post_id", post_id)
      .eq("interaction_type", interaction_type)
      .maybeSingle();

    let likecount = 0;
    let viewcount = 0;
    let isLiked = false;

    if (!existing) {
      // Insert new interaction (always for share, like, view)
      const { error: insertError } = await supabase
        .from("user_interactions")
        .insert([{ user_id, post_id, interaction_type }]);
      if (insertError) throw insertError;

      // Increment counter if like, view, or share
      if (columnToUpdate) {
        const { error: updateError } = await supabase
          .rpc("increment_opennote_counter", {
            postid: post_id,
            columnname: columnToUpdate,
          });
        if (updateError) throw updateError;
      }

      // After incrementing, fetch the updated post manually
      const { data: post, error: fetchError } = await supabase
        .from("opennotes")
        .select("likecount, viewcount, sharecount")
        .eq("id", post_id)
        .single();
      if (fetchError) throw fetchError;

      likecount = post.likecount;
      viewcount = post.viewcount;
      const sharecount = post.sharecount;
      isLiked = interaction_type === "like" ? true : false;

      return res.json({
        message: `${interaction_type} interaction processed`,
        likecount,
        viewcount,
        sharecount,
        isLiked,
      });
    } else {
      if (interaction_type === "like") {
        // Remove like interaction
        const { error: deleteError } = await supabase
          .from("user_interactions")
          .delete()
          .eq("id", existing.id);
        if (deleteError) throw deleteError;

        // Decrement likeCount using another RPC or raw SQL
        const { error: decError } = await supabase
          .rpc("decrement_opennote_counter", {
            postid: post_id,
            columnname: "likecount",
          });
        if (decError) throw decError;

        // Always fetch the updated post after decrementing
        const { data: post, error: fetchError } = await supabase
          .from("opennotes")
          .select("likecount, viewcount")
          .eq("id", post_id)
          .single();
        if (fetchError) throw fetchError;

        likecount = post.likecount;
        viewcount = post.viewcount;
        isLiked = false;

      } else {
        // For view, don't remove interaction
        const { data: post, error: fetchError } = await supabase
          .from("opennotes")
          .select("likecount, viewcount")
          .eq("id", post_id)
          .single();
        if (fetchError) throw fetchError;

        likecount = post.likecount;
        viewcount = post.viewcount;
      }
    }

    res.json({
      message: `${interaction_type} interaction processed`,
      likecount,
      viewcount,
      isLiked,
    });

  } catch (err) {
    console.error("❌ Interaction Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
