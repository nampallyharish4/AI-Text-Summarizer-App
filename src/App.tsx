import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  Sparkles,
  Copy,
  Download,
  RefreshCw,
} from 'lucide-react';
import TextInput from './components/TextInput';
import SummaryOutput from './components/SummaryOutput';
import LoadingAnimation from './components/LoadingAnimation';
import StatsCard from './components/StatsCard';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [summaryStats, setSummaryStats] = useState<{
    originalLength: number;
    summaryLength: number;
    compressionRatio: number;
  } | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (
      savedTheme === 'dark' ||
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Check API status
    checkApiStatus();
  }, []);

  const getApiUrl = (path: string) => {
    const isDev = import.meta.env.DEV;
    if (isDev) {
      return `http://localhost:3001${path}`;
    }
    return `/.netlify/functions${path.replace(/^\/api/, '')}`;
  };

  const checkApiStatus = async () => {
    try {
      const url = getApiUrl('/api/health');
      await fetch(url);
      // Health check - mode is tracked on the server side
    } catch (error) {
      console.log('Health check failed, using demo mode');
    }
  };

  // Client-side demo summarization function (fallback when server is unavailable)
  // Uses extractive summarization to preserve key content
  const createDemoSummary = (text: string) => {
    // Normalize text - ensure it ends with punctuation
    const normalizedText = text.trim();
    if (!normalizedText) {
      return text;
    }

    // Split into sentences while preserving punctuation
    // Improved regex to handle various sentence endings and edge cases
    const sentenceRegex = /([^.!?\n]+[.!?]+[\s]*)/g;
    const sentences: string[] = [];
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

    const wordFreq: { [key: string]: number } = {};
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];

    words.forEach((word) => {
      if (!stopWords.has(word) && word.length > 2) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    // Score sentences based on word importance and position
    const sentenceScores: Array<{
      sentence: string;
      score: number;
      index: number;
    }> = sentences.map((sentence, index) => {
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
    const selectedIndices = new Set<number>();

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
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSummarize = async () => {
    if (inputText.length < 200) {
      setError('Text must be at least 200 characters long');
      return;
    }

    if (inputText.length > 100000) {
      setError('Text is too long. Maximum 100,000 characters allowed');
      return;
    }

    setIsLoading(true);
    setError('');
    setSummary('');
    setSummaryStats(null);

    try {
      const url = getApiUrl('/api/summarize');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
        }),
      });

      // Check if response is ok and has content
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const responseText = await response.text();
      if (!responseText) {
        throw new Error('Empty response from server');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error('Invalid JSON response from server');
      }

      setSummary(data.summary);
      setSummaryStats({
        originalLength: data.originalLength,
        summaryLength: data.summaryLength,
        compressionRatio: data.compressionRatio,
      });
    } catch (err: any) {
      console.error('Summarization error:', err);

      // Handle connection errors by falling back to client-side demo mode
      if (
        err.message.includes('Failed to fetch') ||
        err.message.includes('ECONNREFUSED') ||
        err.message.includes('NetworkError')
      ) {
        console.log(
          'Server unavailable, falling back to client-side demo mode'
        );

        // Use client-side demo summarization as fallback
        const demoSummary = createDemoSummary(inputText);
        const originalLength = inputText.length;
        const summaryLength = demoSummary.length;
        const compressionRatio = Math.round(
          ((originalLength - summaryLength) / originalLength) * 100
        );

        setSummary(demoSummary);
        setSummaryStats({
          originalLength,
          summaryLength,
          compressionRatio,
        });
        // Don't set error - just use demo mode silently
        return;
      } else if (err.message.includes('timeout')) {
        setError(
          'Request timed out. Please try with shorter text or try again later.'
        );
      } else if (err.message.includes('Rate limit')) {
        setError(
          'Rate limit exceeded. Please wait a few minutes before trying again.'
        );
      } else if (err.message.includes('API key')) {
        setError('API configuration error. Please contact the administrator.');
      } else if (err.message.includes('model is loading')) {
        setError('AI model is loading. Please try again in a few moments.');
      } else if (
        err.message.includes('Empty response') ||
        err.message.includes('Invalid JSON')
      ) {
        setError('Server communication error. Please try again.');
      } else {
        setError(err.message || 'Failed to summarize text. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const downloadSummary = () => {
    const element = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `summary-${timestamp}.txt`;

    let content = `AI Text Summary\n`;
    content += `Generated on: ${new Date().toLocaleString()}\n`;
    content += `Original text length: ${
      summaryStats?.originalLength || inputText.length
    } characters\n`;
    content += `Summary length: ${
      summaryStats?.summaryLength || summary.length
    } characters\n`;
    content += `Compression ratio: ${summaryStats?.compressionRatio || 0}%\n`;
    content += `\n${'='.repeat(50)}\n\n`;
    content += summary;

    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const clearAll = () => {
    setInputText('');
    setSummary('');
    setError('');
    setSummaryStats(null);
  };

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        darkMode ? 'dark-gradient-bg' : 'light-gradient-bg'
      }`}
    >
      <div className="min-h-screen backdrop-blur-sm">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong sticky top-0 z-50 border-b-2 border-gray-200 dark:border-gray-700 shadow-xl"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <motion.div
                className="flex items-center"
                whileHover={{ scale: 1.05 }}
              >
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                  AI Text Summarizer
                </h1>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleDarkMode}
                className="p-3 rounded-full glass hover:glass-strong transition-all duration-300 border border-gray-200 dark:border-gray-600 shadow-lg"
              >
                <AnimatePresence mode="wait">
                  {darkMode ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Sun className="w-5 h-5 text-yellow-400" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Moon className="w-5 h-5 text-blue-600" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-gray-800 dark:text-white mb-6 leading-tight">
              Transform Long Text into
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Concise Summaries
              </span>
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Leverage the power of AI to quickly summarize articles, research
              papers, and any lengthy text content with precision and clarity.
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            <StatsCard
              title="Character Count"
              value={inputText.length.toLocaleString()}
              subtitle="characters entered"
              icon="📝"
            />
            <StatsCard
              title="Word Count"
              value={inputText
                .split(/\s+/)
                .filter((word) => word.length > 0)
                .length.toLocaleString()}
              subtitle="words to summarize"
              icon="📊"
            />
            <StatsCard
              title="Compression"
              value={summaryStats ? `${summaryStats.compressionRatio}%` : '0%'}
              subtitle="text reduction"
              icon="⚡"
            />
          </motion.div>

          {/* Input and Output Section */}
          <div className="flex flex-col gap-8 mb-8">
            {/* Input Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <TextInput
                value={inputText}
                onChange={setInputText}
                onSummarize={handleSummarize}
                error={error}
              />
            </motion.div>

            {/* Output Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {isLoading ? (
                <LoadingAnimation />
              ) : (
                <SummaryOutput
                  summary={summary}
                  onCopy={() => copyToClipboard(summary)}
                  onDownload={downloadSummary}
                  stats={summaryStats}
                />
              )}
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSummarize}
              disabled={isLoading || inputText.length < 200}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 border border-blue-400 dark:border-blue-600"
            >
              <Sparkles className="w-5 h-5" />
              <span>{isLoading ? 'Summarizing...' : 'Summarize Text'}</span>
            </motion.button>

            {summary && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => copyToClipboard(summary)}
                  className="px-6 py-4 glass-strong text-gray-800 dark:text-white font-semibold rounded-2xl hover:bg-white/50 dark:hover:bg-black/70 transition-all duration-300 flex items-center space-x-2 border border-gray-200 dark:border-gray-600 shadow-lg"
                >
                  <Copy className="w-5 h-5" />
                  <span>Copy Summary</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={downloadSummary}
                  className="px-6 py-4 glass-strong text-gray-800 dark:text-white font-semibold rounded-2xl hover:bg-white/50 dark:hover:bg-black/70 transition-all duration-300 flex items-center space-x-2 border border-gray-200 dark:border-gray-600 shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  <span>Download</span>
                </motion.button>
              </>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearAll}
              className="px-6 py-4 glass-strong text-gray-800 dark:text-white font-semibold rounded-2xl hover:bg-white/50 dark:hover:bg-black/70 transition-all duration-300 flex items-center space-x-2 border border-gray-200 dark:border-gray-600 shadow-lg"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Clear All</span>
            </motion.button>
          </motion.div>
        </main>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="glass-strong border-t-2 border-gray-200 dark:border-gray-700 mt-16 shadow-xl"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-gray-700 dark:text-gray-300">
                Developed with ❤️ by Harish Nampally
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                Powered by Hugging Face AI • Built with React & Tailwind CSS •
                Deployed on Netlify
              </p>
            </div>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}

export default App;
