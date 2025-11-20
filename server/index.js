const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

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
try {
  const summarizeRoutes = require('./summarize');
  app.use('/api', summarizeRoutes);
} catch (error) {
  console.log('Summarize routes not found, continuing without them');
}

// Start server
app.listen(process.env.PORT || 3001, () => {
  console.log(`Server is running on port ${process.env.PORT || 3001}`);
});
