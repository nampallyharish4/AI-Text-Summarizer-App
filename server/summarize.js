const express = require('express');
const axios = require('axios');
const router = express.Router();

// Summarize endpoint
router.post('/summarize', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // For now, return a simple summary
    // This can be replaced with actual AI summarization logic
    const summary = text.length > 100 
      ? text.substring(0, 100) + '...' 
      : text;

    res.json({ 
      summary,
      originalLength: text.length,
      summaryLength: summary.length
    });
  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({ error: 'Failed to summarize text' });
  }
});

module.exports = router;