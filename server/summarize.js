const express = require('express');
const axios = require('axios');
const router = express.Router();

// Hugging Face API configuration
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
const API_KEY = process.env.HUGGINGFACE_API_KEY;

// Helper function to chunk text if it's too long
function chunkText(text, maxLength = 1024) {
  if (text.length <= maxLength) {
    return [text];
  }
  
  const chunks = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (currentChunk.length + trimmedSentence.length + 1 <= maxLength) {
      currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk + '.');
        currentChunk = trimmedSentence;
      } else {
        // If single sentence is too long, split by words
        const words = trimmedSentence.split(' ');
        let wordChunk = '';
        for (const word of words) {
          if (wordChunk.length + word.length + 1 <= maxLength) {
            wordChunk += (wordChunk ? ' ' : '') + word;
          } else {
            if (wordChunk) chunks.push(wordChunk);
            wordChunk = word;
          }
        }
        if (wordChunk) currentChunk = wordChunk;
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk + '.');
  }
  
  return chunks;
}

// Function to call Hugging Face API
async function callHuggingFaceAPI(text, retries = 3) {
  try {
    const response = await axios.post(
      HUGGINGFACE_API_URL,
      {
        inputs: text,
        parameters: {
          max_length: 150,
          min_length: 30,
          do_sample: false,
          early_stopping: true,
          num_beams: 4,
          temperature: 1.0,
          repetition_penalty: 1.2
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    if (response.data && response.data[0] && response.data[0].summary_text) {
      return response.data[0].summary_text;
    } else if (response.data && response.data.error) {
      throw new Error(response.data.error);
    } else {
      throw new Error('Unexpected response format from Hugging Face API');
    }
  } catch (error) {
    if (error.response?.status === 503 && retries > 0) {
      // Model is loading, wait and retry
      console.log('Model is loading, retrying in 10 seconds...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      return callHuggingFaceAPI(text, retries - 1);
    }
    throw error;
  }
}

// Summarize route
router.post('/summarize', async (req, res) => {
  try {
    const { text } = req.body;
    
    // Validation
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'Text must be a string' });
    }

    if (text.length < 200) {
      return res.status(400).json({ error: 'Text must be at least 200 characters long' });
    }

    if (text.length > 100000) {
      return res.status(400).json({ error: 'Text is too long. Maximum 100,000 characters allowed' });
    }

    // Check if API key is configured
    if (!API_KEY) {
      return res.status(500).json({ 
        error: 'Hugging Face API key not configured. Please set HUGGINGFACE_API_KEY environment variable.' 
      });
    }

    console.log(`Processing text summarization request (${text.length} characters)`);

    // Clean and prepare text
    const cleanText = text.trim().replace(/\s+/g, ' ');
    
    // For very long texts, chunk them and summarize each chunk
    const chunks = chunkText(cleanText, 1024);
    console.log(`Text split into ${chunks.length} chunks`);

    let summaries = [];
    
    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);
      try {
        const chunkSummary = await callHuggingFaceAPI(chunks[i]);
        summaries.push(chunkSummary);
      } catch (error) {
        console.error(`Error processing chunk ${i + 1}:`, error.message);
        // Continue with other chunks even if one fails
        summaries.push(`[Error summarizing section ${i + 1}]`);
      }
    }

    // Combine summaries
    let finalSummary = summaries.join(' ');

    // If we have multiple chunks and the combined summary is still long, 
    // summarize the combined summaries
    if (chunks.length > 1 && finalSummary.length > 500) {
      console.log('Creating final summary from combined chunks');
      try {
        finalSummary = await callHuggingFaceAPI(finalSummary);
      } catch (error) {
        console.error('Error creating final summary:', error.message);
        // Use the combined summaries as fallback
      }
    }

    // Clean up the final summary
    finalSummary = finalSummary.trim();
    
    // Ensure the summary ends with proper punctuation
    if (finalSummary && !finalSummary.match(/[.!?]$/)) {
      finalSummary += '.';
    }

    console.log(`Summary generated successfully (${finalSummary.length} characters)`);

    res.json({ 
      summary: finalSummary,
      originalLength: text.length,
      summaryLength: finalSummary.length,
      compressionRatio: Math.round((1 - finalSummary.length / text.length) * 100)
    });

  } catch (error) {
    console.error('Error in summarize route:', error);
    
    // Handle specific error types
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error || error.message;
      
      if (status === 401) {
        return res.status(500).json({ 
          error: 'Invalid Hugging Face API key. Please check your configuration.' 
        });
      } else if (status === 429) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded. Please try again in a few minutes.' 
        });
      } else if (status === 503) {
        return res.status(503).json({ 
          error: 'AI model is currently loading. Please try again in a few moments.' 
        });
      } else {
        return res.status(500).json({ 
          error: `API Error: ${message}` 
        });
      }
    } else if (error.code === 'ECONNABORTED') {
      return res.status(408).json({ 
        error: 'Request timeout. The text might be too long or the service is busy.' 
      });
    } else {
      return res.status(500).json({ 
        error: 'An unexpected error occurred while processing your request.' 
      });
    }
  }
});

// Health check route
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    apiConfigured: !!API_KEY
  });
});

module.exports = router;