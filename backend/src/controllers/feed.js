import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

const commonWords = new Set([
    'this', 'is', 'the', 'and', 'or', 'of', 'a', 'an', 'to', 'in', 
    'for', 'with', 'on', 'at', 'by', 'from', 'up', 'about'
]);

router.get("/personalizedfeed/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params;

        // 1. Get user's interests
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("interests")
            .eq("id", user_id)
            .single();

        if (userError) throw userError;
        const interests = user?.interests ? user.interests.split(",").map(tag => tag.trim()) : [];

        // 2. Get user's past interactions
        const { data: interactions, error: interactionError } = await supabase
            .from("user_interactions")
            .select("post_id")
            .eq("user_id", user_id);

        if (interactionError) throw interactionError;

        let interactionKeywords = [];
        let interactedPostIds = [];

        if (interactions && interactions.length > 0) {
            interactedPostIds = interactions.map(i => i.post_id);

            // Get keywords from interacted posts (but exclude these exact posts from results)
            const { data: interactedPosts, error: tagsError } = await supabase
                .from("opennotes")
                .select("tags, title, description")
                .in("id", interactedPostIds);

            if (tagsError) throw tagsError;

            interactedPosts.forEach((post) => {
                if (post.tags) {
                    interactionKeywords.push(...post.tags.split(",").map(tag => tag.trim()));
                }
                if (post.title) {
                    interactionKeywords.push(
                        ...post.title.split(" ")
                            .map(word => word.trim().toLowerCase())
                            .filter(word => word.length > 3 && !commonWords.has(word))
                    );
                }
                if (post.description) {
                    interactionKeywords.push(
                        ...post.description.split(" ")
                            .map(word => word.trim().toLowerCase())
                            .filter(word => word.length > 3 && !commonWords.has(word))
                    );
                }
            });

            interactionKeywords = [...new Set(interactionKeywords)];
        }

        // 3. Combine interests and interaction keywords
        const searchKeywords = [...new Set([...interests, ...interactionKeywords])]
            .filter(keyword => keyword && keyword.length > 2);

        // 4. Query for recommended posts (excluding already interacted posts)
        let query = supabase
            .from("opennotes")
.select(`*,
  user_interactions:user_interactions!left(user_id, interaction_type, post_id),
  bookmarks:bookmarks!left(user_id, opennote_id)`)

            .order("created_at", { ascending: false });

        if (searchKeywords.length > 0) {
            // Create search conditions
            const conditions = searchKeywords.map(tag => 
                `tags.ilike.%${tag}%,title.ilike.%${tag}%,description.ilike.%${tag}%`
            ).join(",");

            query = query.or(conditions);
        }

        const { data: recommendedFeed, error: feedError } = await query;
        if (feedError) throw feedError;

        // Fetch all liked post_ids for this user
        const { data: likedInteractions, error: likedError } = await supabase
          .from("user_interactions")
          .select("post_id")
          .eq("user_id", user_id)
          .eq("interaction_type", "like");
        if (likedError) throw likedError;
        const likedPostIds = likedInteractions ? likedInteractions.map(i => i.post_id) : [];

        // Fetch all bookmarked post_ids for this user
        const { data: bookmarksData, error: bookmarksError } = await supabase
          .from("bookmarks")
          .select("opennote_id")
          .eq("user_id", user_id);
        if (bookmarksError) throw bookmarksError;
        const bookmarkedPostIds = bookmarksData ? bookmarksData.map(b => b.opennote_id) : [];

        // Fetch comment counts for all posts
        const postIds = recommendedFeed.map(post => post.id);
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

        // 5. Add basic ranking (posts with more matching keywords first)
        if (recommendedFeed && recommendedFeed.length > 0 && searchKeywords.length > 0) {
            recommendedFeed.forEach(post => {
                let score = 0;
                const postText = `${post.tags || ''} ${post.title || ''} ${post.description || ''}`.toLowerCase();
                
                searchKeywords.forEach(keyword => {
                    if (postText.includes(keyword.toLowerCase())) {
                        score++;
                    }
                });

                post.relevanceScore = score;
            });

            // Sort by relevance score (highest first), then by date
            recommendedFeed.sort((a, b) => {
                if (b.relevanceScore !== a.relevanceScore) {
                    return b.relevanceScore - a.relevanceScore;
                }
                return new Date(b.created_at) - new Date(a.created_at);
            });
        }

        res.json({
            feed: recommendedFeed.map(post => ({
              ...post,
              isLiked: likedPostIds.includes(post.id),
              isBookmarked: bookmarkedPostIds.includes(post.id),
              commentcount: commentCounts[post.id] || 0,
              bookmarkcount: bookmarkCounts[post.id] || 0,
              showPdf: false,
              showDescription: false
            }))
          });
          
          

    } catch (err) {
        console.error("❌ Personalized Feed error:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;