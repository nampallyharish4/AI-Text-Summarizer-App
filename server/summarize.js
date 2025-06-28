const express = require('express');
const axios = require('axios');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'AI Text Summarizer API'
  });
});

// Summarize endpoint
router.post('/summarize', async (req, res) => {
  try {
    const { text, maxLength = 150, minLength = 30 } = req.body;

    // Validate input
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid input', 
        message: 'Text is required and must be a string' 
      });
    }

    if (text.trim().length < 10) {
      return res.status(400).json({ 
        error: 'Text too short', 
        message: 'Text must be at least 10 characters long' 
      });
    }

    // Check if Hugging Face API key is available
    if (!process.env.HUGGINGFACE_API_KEY) {
      return res.status(500).json({ 
        error: 'Configuration error', 
        message: 'Hugging Face API key not configured' 
      });
    }

    console.log(`Summarizing text of length: ${text.length}`);

    // Call Hugging Face API
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
      {
        inputs: text,
        parameters: {
          max_length: Math.min(maxLength, 500),
          min_length: Math.max(minLength, 10),
          do_sample: false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    // Extract summary from response
    const summary = response.data[0]?.summary_text || response.data[0]?.generated_text;
    
    if (!summary) {
      throw new Error('No summary generated from the API response');
    }

    console.log('Summary generated successfully');

    res.json({
      success: true,
      summary: summary,
      originalLength: text.length,
      summaryLength: summary.length,
      compressionRatio: ((text.length - summary.length) / text.length * 100).toFixed(1)
    });

  } catch (error) {
    console.error('Summarization error:', error.message);

    // Handle specific error types
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({ 
        error: 'Request timeout', 
        message: 'The summarization request took too long to complete' 
      });
    }

    if (error.response?.status === 503) {
      return res.status(503).json({ 
        error: 'Service unavailable', 
        message: 'The AI model is currently loading. Please try again in a few moments.' 
      });
    }

    if (error.response?.status === 401) {
      return res.status(401).json({ 
        error: 'Authentication failed', 
        message: 'Invalid Hugging Face API key' 
      });
    }

    if (error.response?.status === 400) {
      return res.status(400).json({ 
        error: 'Bad request', 
        message: 'The text provided could not be processed' 
      });
    }

    // Generic error response
    res.status(500).json({ 
      error: 'Summarization failed', 
      message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while processing your request'
    });
  }
});

module.exports = router;