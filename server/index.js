const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { summarizeText } = require('./summarize');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AI Text Summarizer API is running',
    timestamp: new Date().toISOString(),
    mode: process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_API_KEY !== 'your_huggingface_api_key_here' ? 'ai' : 'demo'
  });
});

// Summarization endpoint
app.post('/api/summarize', async (req, res) => {
  try {
    console.log('📝 Received summarization request');
    const { text } = req.body;

    // Validate input
    if (!text) {
      console.log('❌ No text provided');
      return res.status(400).json({ 
        error: 'Text is required',
        message: 'Please provide text to summarize'
      });
    }

    if (typeof text !== 'string') {
      console.log('❌ Invalid text type');
      return res.status(400).json({ 
        error: 'Invalid input',
        message: 'Text must be a string'
      });
    }

    if (text.length < 200) {
      console.log(`❌ Text too short: ${text.length} characters`);
      return res.status(400).json({ 
        error: 'Text too short',
        message: 'Text must be at least 200 characters long'
      });
    }

    if (text.length > 100000) {
      console.log(`❌ Text too long: ${text.length} characters`);
      return res.status(400).json({ 
        error: 'Text too long',
        message: 'Text must be less than 100,000 characters'
      });
    }

    console.log(`🔄 Processing text: ${text.length} characters`);

    // Summarize the text
    const result = await summarizeText(text);
    
    console.log(`✅ Summarization successful (${result.mode} mode)`);
    res.json(result);
  } catch (error) {
    console.error('❌ Summarization error:', error);
    
    // Handle specific error types
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

    if (error.message.includes('timeout')) {
      return res.status(408).json({
        error: 'Request Timeout',
        message: 'The request took too long to process. Please try with shorter text.'
      });
    }

    // Generic server error
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while processing your request. Please try again.'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('💥 Unhandled error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 AI Text Summarizer API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Summarize endpoint: http://localhost:${PORT}/api/summarize`);
  console.log(`🔧 Mode: ${process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_API_KEY !== 'your_huggingface_api_key_here' ? 'AI' : 'Demo'}`);
});