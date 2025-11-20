const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  const hasApiKey = process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_API_KEY !== 'your_huggingface_api_key_here';
  res.json({
    status: 'OK',
    message: 'Server is running',
    mode: hasApiKey ? 'ai' : 'demo'
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
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});