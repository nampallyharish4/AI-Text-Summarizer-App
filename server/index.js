const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { summarizeText } = require('./summarize');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AI Text Summarizer API is running',
    timestamp: new Date().toISOString()
  });
});

// Summarization endpoint
app.post('/api/summarize', async (req, res) => {
  try {
    const { text } = req.body;

    // Validate input
    if (!text) {
      return res.status(400).json({ 
        error: 'Text is required',
        message: 'Please provide text to summarize'
      });
    }

    if (text.length < 200) {
      return res.status(400).json({ 
        error: 'Text too short',
        message: 'Text must be at least 200 characters long'
      });
    }

    if (text.length > 100000) {
      return res.status(400).json({ 
        error: 'Text too long',
        message: 'Text must be less than 100,000 characters'
      });
    }

    // Summarize the text
    const result = await summarizeText(text);
    
    res.json(result);
  } catch (error) {
    console.error('Summarization error:', error);
    
    if (error.message.includes('API key')) {
      return res.status(401).json({
        error: 'API Configuration Error',
        message: 'Hugging Face API key is not configured properly'
      });
    }

    if (error.message.includes('Model is loading')) {
      return res.status(503).json({
        error: 'Model Loading',
        message: 'The AI model is currently loading. Please try again in a few moments.'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while processing your request'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Text Summarizer API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Summarize endpoint: http://localhost:${PORT}/api/summarize`);
});