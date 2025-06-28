const axios = require('axios');

// Hugging Face API configuration
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
const API_KEY = process.env.HUGGINGFACE_API_KEY;

if (!API_KEY) {
  console.error('❌ HUGGINGFACE_API_KEY is not set in environment variables');
  console.log('📝 Please add your Hugging Face API key to the .env file');
}

/**
 * Chunk text into smaller pieces for processing
 * @param {string} text - The text to chunk
 * @param {number} maxLength - Maximum length per chunk
 * @returns {string[]} Array of text chunks
 */
function chunkText(text, maxLength = 1000) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (currentChunk.length + trimmedSentence.length + 1 <= maxLength) {
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

/**
 * Call Hugging Face API to summarize text
 * @param {string} text - Text to summarize
 * @returns {Promise<string>} Summarized text
 */
async function callHuggingFaceAPI(text) {
  try {
    const response = await axios.post(
      HUGGINGFACE_API_URL,
      { inputs: text },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    if (Array.isArray(response.data) && response.data[0]?.summary_text) {
      return response.data[0].summary_text;
    }

    throw new Error('Unexpected API response format');
  } catch (error) {
    if (error.response?.status === 503) {
      throw new Error('Model is loading, please try again in a few moments');
    }
    
    if (error.response?.status === 401) {
      throw new Error('API key is invalid or not configured');
    }

    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - the text might be too long');
    }

    throw new Error(`API request failed: ${error.message}`);
  }
}

/**
 * Summarize text using Hugging Face BART model
 * @param {string} text - Text to summarize
 * @returns {Promise<Object>} Summarization result
 */
async function summarizeText(text) {
  if (!API_KEY) {
    throw new Error('API key not configured');
  }

  const originalLength = text.length;
  const wordCount = text.split(/\s+/).length;

  try {
    let summary;

    // For shorter texts, summarize directly
    if (text.length <= 1000) {
      summary = await callHuggingFaceAPI(text);
    } else {
      // For longer texts, chunk and summarize
      const chunks = chunkText(text, 1000);
      const chunkSummaries = [];

      console.log(`📝 Processing ${chunks.length} chunks...`);

      for (let i = 0; i < chunks.length; i++) {
        console.log(`🔄 Processing chunk ${i + 1}/${chunks.length}`);
        const chunkSummary = await callHuggingFaceAPI(chunks[i]);
        chunkSummaries.push(chunkSummary);
        
        // Add delay between requests to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Combine chunk summaries
      const combinedSummary = chunkSummaries.join(' ');
      
      // If combined summary is still long, summarize it again
      if (combinedSummary.length > 1000) {
        console.log('🔄 Final summarization pass...');
        summary = await callHuggingFaceAPI(combinedSummary);
      } else {
        summary = combinedSummary;
      }
    }

    const summaryLength = summary.length;
    const summaryWordCount = summary.split(/\s+/).length;
    const compressionRatio = Math.round(((originalLength - summaryLength) / originalLength) * 100);

    console.log(`✅ Summarization complete: ${originalLength} → ${summaryLength} chars (${compressionRatio}% compression)`);

    return {
      summary: summary.trim(),
      originalLength,
      summaryLength,
      originalWordCount: wordCount,
      summaryWordCount,
      compressionRatio,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Summarization failed:', error.message);
    throw error;
  }
}

module.exports = { summarizeText };