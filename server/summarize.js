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
    throw new Error('Hugging Face API key not configured. Please set HUGGINGFACE_API_KEY in your .env file.');
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
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      if (response.data && response.data[0] && response.data[0].summary_text) {
        return response.data[0].summary_text;
      } else if (response.data.error) {
        throw new Error(response.data.error);
      } else {
        throw new Error('Unexpected response format from Hugging Face API');
      }
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 503 && data.error && data.error.includes('loading')) {
          if (attempt < retries) {
            console.log(`Model is loading, waiting 10 seconds before retry ${attempt + 1}...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
            continue;
          } else {
            throw new Error('Model is still loading. Please try again in a few minutes.');
          }
        } else if (status === 401) {
          throw new Error('Invalid API key. Please check your Hugging Face API key.');
        } else if (status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else {
          throw new Error(`API Error (${status}): ${data.error || 'Unknown error'}`);
        }
      }
      
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
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
        error: 'Invalid input',
        message: 'Text is required and must be a string'
      });
    }

    const trimmedText = text.trim();
    
    if (trimmedText.length < MIN_TEXT_LENGTH) {
      return res.status(400).json({
        error: 'Text too short',
        message: `Text must be at least ${MIN_TEXT_LENGTH} characters long`
      });
    }

    if (trimmedText.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({
        error: 'Text too long',
        message: `Text must be no more than ${MAX_TEXT_LENGTH} characters long`
      });
    }

    console.log(`Processing text of ${trimmedText.length} characters...`);

    // Split text into chunks if necessary
    const chunks = splitTextIntoChunks(trimmedText);
    console.log(`Split into ${chunks.length} chunk(s)`);

    // Summarize each chunk
    const summaryPromises = chunks.map(chunk => callHuggingFaceAPI(chunk));
    const chunkSummaries = await Promise.all(summaryPromises);

    // Combine summaries
    let finalSummary;
    if (chunkSummaries.length === 1) {
      finalSummary = chunkSummaries[0];
    } else {
      // If we have multiple chunk summaries, summarize them again
      const combinedSummaries = chunkSummaries.join(' ');
      if (combinedSummaries.length > MAX_CHUNK_SIZE) {
        finalSummary = await callHuggingFaceAPI(combinedSummaries);
      } else {
        finalSummary = combinedSummaries;
      }
    }

    // Calculate statistics
    const originalLength = trimmedText.length;
    const summaryLength = finalSummary.length;
    const compressionRatio = Math.round(((originalLength - summaryLength) / originalLength) * 100);

    console.log(`Summary generated: ${summaryLength} characters (${compressionRatio}% compression)`);

    res.json({
      summary: finalSummary,
      originalLength,
      summaryLength,
      compressionRatio,
      chunksProcessed: chunks.length
    });

  } catch (error) {
    console.error('Summarization error:', error.message);
    
    res.status(500).json({
      error: 'Summarization failed',
      message: error.message
    });
  }
});

module.exports = router;