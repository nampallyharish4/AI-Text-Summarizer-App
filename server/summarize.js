const express = require('express');
const axios = require('axios');
const router = express.Router();

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
const API_KEY = process.env.HUGGINGFACE_API_KEY;

function createDemoSummary(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const summaryLength = Math.max(2, Math.min(5, Math.floor(sentences.length / 3)));

  const selectedSentences = [
    ...sentences.slice(0, summaryLength - 1),
    sentences[sentences.length - 1]
  ].filter(Boolean);

  return selectedSentences.join('. ').trim() + '.';
}

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
        timeout: 30000,
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

async function summarizeText(text) {
  const originalLength = text.length;
  const wordCount = text.split(/\s+/).length;

  try {
    let summary;

    if (!API_KEY || API_KEY === 'your_huggingface_api_key_here') {
      console.log('🔄 Using demo summarization mode');
      summary = createDemoSummary(text);
    } else {
      console.log('🤖 Using AI summarization');

      if (text.length <= 1000) {
        summary = await callHuggingFaceAPI(text);
      } else {
        const chunks = chunkText(text, 1000);
        const chunkSummaries = [];

        console.log(`📝 Processing ${chunks.length} chunks...`);

        for (let i = 0; i < chunks.length; i++) {
          console.log(`🔄 Processing chunk ${i + 1}/${chunks.length}`);
          const chunkSummary = await callHuggingFaceAPI(chunks[i]);
          chunkSummaries.push(chunkSummary);

          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        const combinedSummary = chunkSummaries.join(' ');

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

router.post('/summarize', async (req, res) => {
  try {
    console.log('📝 Received summarization request');

    const { text } = req.body;

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

    const result = await summarizeText(text);

    console.log(`✅ Summarization successful (${result.mode} mode)`);

    return res.json(result);

  } catch (error) {
    console.error('❌ Summarization error:', error);

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

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while processing your request. Please try again.'
    });
  }
});

module.exports = router;
