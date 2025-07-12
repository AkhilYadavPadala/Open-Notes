import express from "express";
import cors from "cors";
import os from "os";
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
app.use(cors({origin:"*"}));
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
app.listen(PORT, '0.0.0.0', () => {
  // It's better to log your actual IP address for easier access from other devices
  const networkInterfaces = os.networkInterfaces();
  let localIp = 'localhost';

  // Try to find a non-internal IPv4 address
  for (const iface of Object.values(networkInterfaces)) {
    for (const config of iface) {
      if (config.family === 'IPv4' && !config.internal) {
        localIp = config.address;
        break;
      }
    }
  }

  console.log(`🚀 Server is running on:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${localIp}:${PORT}`);
  console.log("📂 File upload API is ready at /api/upload");
  console.log("📜 File retrieval API is available at /api/files");
});

