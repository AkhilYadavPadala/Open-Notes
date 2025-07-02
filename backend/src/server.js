import express from "express";
import cors from "cors";
import uploadRoutes from "./controllers/upload.js";
import fileRoutes from "./controllers/retrieve.js";
import signup from "./controllers/register.js";
import post from "./controllers/post.js";
import interact from "./controllers/interactions.js";
import feed from "./controllers/feed.js";
import comment from "./controllers/comment.js"
import bookmark from "./controllers/bookmark.js"
import oauthRouter from "./controllers/oauth.js";

const app = express();
app.use(cors());
app.use(express.json());

// Middleware to log incoming requests
app.use((req, res, next) => {
  console.log(`📩 [${new Date().toISOString()}] ${req.method} request to ${req.url}`);
  next();
});

// Routes
app.use("/upload", uploadRoutes);
app.use("/retrieve", fileRoutes);
app.use("/register",signup);
app.use("/post",post);
app.use("/interact",interact);
app.use("/feed",feed);
app.use("/comment",comment);
app.use("/bookmark",bookmark);
app.use("/oauth", oauthRouter);

const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log("📂 File upload API is ready at /api/upload");
  console.log("📜 File retrieval API is available at /api/files");
});
