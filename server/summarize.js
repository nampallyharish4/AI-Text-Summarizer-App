const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/summarize', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // For now, return a simple summary
    // In a real implementation, you would integrate with an AI service
    const summary = `Summary: ${text.substring(0, 100)}...`;
    
    res.json({ summary });
  } catch (error) {
    console.error('Error summarizing text:', error);
    res.status(500).json({ error: 'Failed to summarize text' });
  }
});

module.exports = router;