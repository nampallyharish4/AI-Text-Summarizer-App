require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    mode:
      process.env.HUGGINGFACE_API_KEY &&
      process.env.HUGGINGFACE_API_KEY !== 'your_huggingface_api_key_here'
        ? 'ai'
        : 'demo',
  });
});

// Import and use summarize routes
let summarizeRoutes;
try {
  summarizeRoutes = require('./summarize');
  app.use('/api', summarizeRoutes);
} catch (error) {
  console.warn('Summarize routes not found or failed to load. Continuing without them.');
}

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
