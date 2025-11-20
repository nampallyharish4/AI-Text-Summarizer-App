const express = require('express');
const axios = require('axios');
const router = express.Router();

const HUGGINGFACE_API_URL =
  'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
const API_KEY = process.env.HUGGINGFACE_API_KEY;

function createDemoSummary(text) {
  // Normalize text - ensure it ends with punctuation
  const normalizedText = text.trim();
  if (!normalizedText) {
    return text;
  }

  // Split into sentences while preserving punctuation
  // Improved regex to handle various sentence endings and edge cases
  const sentenceRegex = /([^.!?\n]+[.!?]+[\s]*)/g;
  const sentences = [];
  let match;
  
  while ((match = sentenceRegex.exec(normalizedText)) !== null) {
    const sentence = match[0].trim();
    if (sentence.length > 10) {
      // Filter out very short fragments
      sentences.push(sentence);
    }
  }

  // If regex didn't match well, try splitting by periods, exclamation, question marks
  if (sentences.length === 0) {
    const fallbackSentences = normalizedText
      .split(/[.!?]+\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);
    sentences.push(...fallbackSentences);
  }

  // If still no sentences, split by newlines or long spaces
  if (sentences.length === 0) {
    const paragraphSplit = normalizedText
      .split(/\n\s*\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);
    if (paragraphSplit.length > 0) {
      sentences.push(...paragraphSplit);
    } else {
      // Last resort: split by double spaces or return first portion
      const chunks = normalizedText.split(/\s{2,}/).filter((s) => s.trim().length > 10);
      if (chunks.length > 0) {
        sentences.push(...chunks);
      }
    }
  }

  // If we still have very few sentences, return a condensed version
  if (sentences.length <= 2) {
    // Return first 60% of text as summary
    const targetLength = Math.floor(normalizedText.length * 0.6);
    return normalizedText.substring(0, targetLength).trim() + '...';
  }

  if (sentences.length <= 3) {
    return sentences.join(' ').trim();
  }

  // Calculate word frequencies (excluding common stop words)
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'this',
    'that',
    'these',
    'those',
    'i',
    'you',
    'he',
    'she',
    'it',
    'we',
    'they',
    'what',
    'which',
    'who',
    'when',
    'where',
    'why',
    'how',
  ]);

  const wordFreq = {};
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];

  words.forEach((word) => {
    if (!stopWords.has(word) && word.length > 2) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  // Score sentences based on word importance and position
  const sentenceScores = sentences.map((sentence, index) => {
    const sentenceWords = sentence.toLowerCase().match(/\b\w+\b/g) || [];
    let score = 0;

    // Score based on important word frequency
    sentenceWords.forEach((word) => {
      if (wordFreq[word]) {
        score += wordFreq[word];
      }
    });

    // Boost score for first sentence (usually contains main topic)
    if (index === 0) {
      score *= 1.5;
    }

    // Boost score for last sentence (often contains conclusion)
    if (index === sentences.length - 1) {
      score *= 1.3;
    }

    // Boost score for sentences with numbers, dates, or proper nouns (capitalized words)
    if (/\d+/.test(sentence) || /[A-Z][a-z]+/.test(sentence)) {
      score *= 1.2;
    }

    // Normalize by sentence length (avoid division by zero)
    score = sentenceWords.length > 0 ? score / Math.sqrt(sentenceWords.length) : 0;

    return { sentence, score, index };
  });

  // Sort by score (highest first)
  sentenceScores.sort((a, b) => b.score - a.score);

  // Calculate target summary length (30-40% of original, but at least 3 sentences)
  const targetRatio = 0.35;
  const targetSentences = Math.max(
    3,
    Math.min(
      Math.ceil(sentences.length * targetRatio),
      Math.floor(sentences.length * 0.6) // Never exceed 60% of original
    )
  );

  // Select top sentences, but ensure we include first and last
  const selectedIndices = new Set();

  // Always include first sentence
  selectedIndices.add(0);

  // Always include last sentence if different from first
  if (sentences.length > 1) {
    selectedIndices.add(sentences.length - 1);
  }

  // Add top-scoring sentences
  for (const item of sentenceScores) {
    if (selectedIndices.size >= targetSentences) break;
    selectedIndices.add(item.index);
  }

  // Sort selected indices to maintain original order
  const sortedIndices = Array.from(selectedIndices).sort((a, b) => a - b);

  // Build summary maintaining original order
  const summary = sortedIndices
    .map((idx) => sentences[idx])
    .filter((s) => s && s.trim().length > 0)
    .join(' ');

  // Ensure we return a meaningful summary
  if (!summary || summary.trim().length === 0) {
    // Fallback: return first portion of text
    const fallbackLength = Math.min(normalizedText.length, Math.floor(normalizedText.length * 0.4));
    return normalizedText.substring(0, fallbackLength).trim() + '...';
  }

  return summary.trim();
}

function chunkText(text, maxLength = 1000) {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
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
          max_length: Math.min(250, Math.max(80, Math.floor(text.length / 8))), // Dynamic max length based on input
          min_length: Math.min(50, Math.floor(text.length / 20)), // Dynamic min length
          do_sample: false,
          num_beams: 4, // Better quality with beam search
          length_penalty: 1.2, // Encourage longer summaries that preserve content
        },
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
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

        const sanitizedChunkCount = String(chunks.length || 0);
        console.log(`📝 Processing ${sanitizedChunkCount} chunks...`);

        for (let i = 0; i < chunks.length; i++) {
          const sanitizedChunkNum = String((i + 1) || 0);
        const sanitizedTotalChunks = String(chunks.length || 0);
        console.log(`🔄 Processing chunk ${sanitizedChunkNum}/${sanitizedTotalChunks}`);
          const chunkSummary = await callHuggingFaceAPI(chunks[i]);
          chunkSummaries.push(chunkSummary);

          if (i < chunks.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
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
    const compressionRatio = Math.round(
      ((originalLength - summaryLength) / originalLength) * 100
    );

    const sanitizedOriginalLength = String(originalLength || 0);
    const sanitizedSummaryLength = String(summaryLength || 0);
    const sanitizedCompressionRatio = String(compressionRatio || 0);
    console.log(
      `✅ Summarization complete: ${sanitizedOriginalLength} → ${sanitizedSummaryLength} chars (${sanitizedCompressionRatio}% compression)`
    );

    return {
      summary: summary.trim(),
      originalLength,
      summaryLength,
      originalWordCount: wordCount,
      summaryWordCount,
      compressionRatio,
      timestamp: new Date().toISOString(),
      mode:
        !API_KEY || API_KEY === 'your_huggingface_api_key_here' ? 'demo' : 'ai',
    };
  } catch (error) {
    const sanitizedErrorMessage = error instanceof Error ? String(error.message || 'Unknown error').substring(0, 200) : 'Unknown error';
    console.error('❌ Summarization failed:', sanitizedErrorMessage);

    if (API_KEY && API_KEY !== 'your_huggingface_api_key_here') {
      console.log('🔄 Falling back to demo mode due to API error');
      const summary = createDemoSummary(text);
      const summaryLength = summary.length;
      const summaryWordCount = summary.split(/\s+/).length;
      const compressionRatio = Math.round(
        ((originalLength - summaryLength) / originalLength) * 100
      );

      return {
        summary: summary.trim(),
        originalLength,
        summaryLength,
        originalWordCount: wordCount,
        summaryWordCount,
        compressionRatio,
        timestamp: new Date().toISOString(),
        mode: 'demo',
        fallback: true,
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
        message: 'Please provide text to summarize',
      });
    }

    if (typeof text !== 'string') {
      console.log('❌ Invalid text type');
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Text must be a string',
      });
    }

    if (text.length < 200) {
      const sanitizedLength = String(text.length || 0);
      console.log(`❌ Text too short: ${sanitizedLength} characters`);
      return res.status(400).json({
        error: 'Text too short',
        message: 'Text must be at least 200 characters long',
      });
    }

    if (text.length > 100000) {
      const sanitizedLength = String(text.length || 0);
      console.log(`❌ Text too long: ${sanitizedLength} characters`);
      return res.status(400).json({
        error: 'Text too long',
        message: 'Text must be less than 100,000 characters',
      });
    }

    const sanitizedLength = String(text.length || 0);
    console.log(`🔄 Processing text: ${sanitizedLength} characters`);

    const result = await summarizeText(text);

    const sanitizedMode = String(result.mode || 'unknown');
    console.log(`✅ Summarization successful (${sanitizedMode} mode)`);

    return res.json(result);
  } catch (error) {
    const sanitizedError = error instanceof Error 
      ? String(error.message || 'Unknown error').substring(0, 200)
      : String(error || 'Unknown error').substring(0, 200);
    console.error('❌ Summarization error:', sanitizedError);

    if (error.message.includes('API key')) {
      return res.status(401).json({
        error: 'API Configuration Error',
        message: 'Hugging Face API key is not configured properly',
      });
    }

    if (error.message.includes('Model is loading')) {
      return res.status(503).json({
        error: 'Model Loading',
        message:
          'The AI model is currently loading. Please try again in a few moments.',
      });
    }

    if (error.message.includes('timeout')) {
      return res.status(408).json({
        error: 'Request Timeout',
        message:
          'The request took too long to process. Please try with shorter text.',
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message:
        'An error occurred while processing your request. Please try again.',
    });
  }
});

module.exports = router;
