const express = require('express');
const axios = require('axios');
const router = express.Router();

// Hugging Face API configuration
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
const MAX_CHUNK_SIZE = 1024; // Maximum tokens per chunk
const MIN_TEXT_LENGTH = 200;
const MAX_TEXT_LENGTH = 100000;

// Helper function to split text into chunks
function splitTextIntoChunks(text, maxChunkSize = MAX_CHUNK_SIZE) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (currentChunk.length + trimmedSentence.length + 1 <= maxChunkSize) {
      currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk + '.');
      }
      currentChunk = trimmedSentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk + '.');
  }

  return chunks.length > 0 ? chunks : [text];
}

// Helper function to call Hugging Face API
async function callHuggingFaceAPI(text, retries = 3) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    throw new Error('Hugging Face API key not configured');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(
        HUGGINGFACE_API_URL,
        { 
          inputs: text,
          parameters: {
            max_length: 150,
            min_length: 30,
            do_sample: false
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (response.data && response.data[0] && response.data[0].summary_text) {
        return response.data[0].summary_text;
      } else {
        throw new Error('Invalid response format from Hugging Face API');
      }
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      if (error.response?.status === 503 && attempt < retries) {
        // Model is loading, wait and retry
        console.log('Model is loading, waiting 10 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        continue;
      }
      
      if (attempt === retries) {
        if (error.response?.status === 503) {
          throw new Error('AI model is currently loading. Please try again in a few minutes.');
        } else if (error.response?.status === 401) {
          throw new Error('Invalid API key. Please check your Hugging Face API key.');
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. The text might be too long or the service is busy.');
        } else {
          throw new Error(`AI service error: ${error.message}`);
        }
      }
    }
  }
}

// POST /api/summarize
router.post('/summarize', async (req, res) => {
  try {
    const { text } = req.body;

    // Validation
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        error: 'Text is required and must be a string' 
      });
    }

    const trimmedText = text.trim();
    
    if (trimmedText.length < MIN_TEXT_LENGTH) {
      return res.status(400).json({ 
        error: `Text must be at least ${MIN_TEXT_LENGTH} characters long` 
      });
    }

    if (trimmedText.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ 
        error: `Text must be less than ${MAX_TEXT_LENGTH} characters long` 
      });
    }

    console.log(`Processing text of ${trimmedText.length} characters...`);

    let summary;

    // For shorter texts, summarize directly
    if (trimmedText.length <= MAX_CHUNK_SIZE) {
      summary = await callHuggingFaceAPI(trimmedText);
    } else {
      // For longer texts, split into chunks and summarize each
      const chunks = splitTextIntoChunks(trimmedText);
      console.log(`Split text into ${chunks.length} chunks`);

      const chunkSummaries = [];
      
      for (let i = 0; i < chunks.length; i++) {
        console.log(`Processing chunk ${i + 1}/${chunks.length}...`);
        const chunkSummary = await callHuggingFaceAPI(chunks[i]);
        chunkSummaries.push(chunkSummary);
        
        // Add a small delay between requests to be respectful to the API
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Combine chunk summaries
      const combinedSummary = chunkSummaries.join(' ');
      
      // If the combined summary is still long, summarize it again
      if (combinedSummary.length > MAX_CHUNK_SIZE) {
        console.log('Final summarization of combined chunks...');
        summary = await callHuggingFaceAPI(combinedSummary);
      } else {
        summary = combinedSummary;
      }
    }

    // Calculate statistics
    const originalLength = trimmedText.length;
    const summaryLength = summary.length;
    const compressionRatio = Math.round(((originalLength - summaryLength) / originalLength) * 100);

    console.log(`Summarization complete: ${originalLength} → ${summaryLength} chars (${compressionRatio}% compression)`);

    res.json({
      summary: summary.trim(),
      originalLength,
      summaryLength,
      compressionRatio
    });

  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to summarize text' 
    });
  }
});

module.exports = router;