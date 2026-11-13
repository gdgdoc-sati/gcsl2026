import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import profileProgressHandler from './api/profile-progress.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// API Route for Google Cloud Skills Boost Profile Real-time Scraping
app.all('/api/profile-progress', async (req, res) => {
  try {
    await profileProgressHandler(req, res);
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
});

// Serve static frontend build from dist
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback for Single Page Application (SPA) routes
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
