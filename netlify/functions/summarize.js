const axios = require('axios');

// Hugging Face API configuration
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
const API_KEY = process.env.HUGGINGFACE_API_KEY;

/**
 * Demo summarization function for when API key is not configured
 * @param {string} text - Text to summarize
 * @returns {string} Demo summary
 */
function createDemoSummary(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const summaryLength = Math.max(2, Math.min(5, Math.floor(sentences.length / 3)));
  
  // Take first few sentences and last sentence for demo
  const selectedSentences = [
    ...sentences.slice(0, summaryLength - 1),
    sentences[sentences.length - 1]
  ].filter(Boolean);
  
  return selectedSentences.join('. ').trim() + '.';
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
 * Summarize text using Hugging Face BART model or demo mode
 * @param {string} text - Text to summarize
 * @returns {Promise<Object>} Summarization result
 */
async function summarizeText(text) {
  const originalLength = text.length;
  const wordCount = text.split(/\s+/).length;

  try {
    let summary;

    // Check if API key is properly configured
    if (!API_KEY || API_KEY === 'your_huggingface_api_key_here') {
      console.log('🔄 Using demo summarization mode');
      summary = createDemoSummary(text);
    } else {
      // Use actual AI summarization
      console.log('🤖 Using AI summarization');
      
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
      timestamp: new Date().toISOString(),
      mode: (!API_KEY || API_KEY === 'your_huggingface_api_key_here') ? 'demo' : 'ai'
    };
  } catch (error) {
    console.error('❌ Summarization failed:', error.message);
    
    // Fallback to demo mode if AI fails
    if (API_KEY && API_KEY !== 'your_huggingface_api_key_here') {
      console.log('🔄 Falling back to demo mode due to API error');
      const summary = createDemoSummary(text);
      const summaryLength = summary.length;
      const summaryWordCount = summary.split(/\s+/).length;
      const compressionRatio = Math.round(((originalLength - summaryLength) / originalLength) * 100);

      return {
        summary: summary.trim(),
        originalLength,
        summaryLength,
        originalWordCount: wordCount,
        summaryWordCount,
        compressionRatio,
        timestamp: new Date().toISOString(),
        mode: 'demo',
        fallback: true
      };
    }
    
    throw error;
  }
}

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'Method Not Allowed',
        message: 'Only POST requests are allowed'
      }),
    };
  }

  try {
    console.log('📝 Received summarization request');
    
    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (parseError) {
      console.log('❌ Invalid JSON in request body');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        }),
      };
    }

    const { text } = body;

    // Validate input
    if (!text) {
      console.log('❌ No text provided');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Text is required',
          message: 'Please provide text to summarize'
        }),
      };
    }

    if (typeof text !== 'string') {
      console.log('❌ Invalid text type');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid input',
          message: 'Text must be a string'
        }),
      };
    }

    if (text.length < 200) {
      console.log(`❌ Text too short: ${text.length} characters`);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Text too short',
          message: 'Text must be at least 200 characters long'
        }),
      };
    }

    if (text.length > 100000) {
      console.log(`❌ Text too long: ${text.length} characters`);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Text too long',
          message: 'Text must be less than 100,000 characters'
        }),
      };
    }

    console.log(`🔄 Processing text: ${text.length} characters`);

    // Summarize the text
    const result = await summarizeText(text);
    
    console.log(`✅ Summarization successful (${result.mode} mode)`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };

  } catch (error) {
    console.error('❌ Summarization error:', error);
    
    // Handle specific error types
    if (error.message.includes('API key')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'API Configuration Error',
          message: 'Hugging Face API key is not configured properly'
        }),
      };
    }

    if (error.message.includes('Model is loading')) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({
          error: 'Model Loading',
          message: 'The AI model is currently loading. Please try again in a few moments.'
        }),
      };
    }

    if (error.message.includes('timeout')) {
      return {
        statusCode: 408,
        headers,
        body: JSON.stringify({
          error: 'Request Timeout',
          message: 'The request took too long to process. Please try with shorter text.'
        }),
      };
    }

    // Generic server error
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'An error occurred while processing your request. Please try again.'
      }),
    };
  }
};