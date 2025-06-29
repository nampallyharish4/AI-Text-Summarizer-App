import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Sparkles, Copy, Download, RefreshCw, AlertTriangle } from 'lucide-react';
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
  const [apiMode, setApiMode] = useState<'demo' | 'ai'>('demo');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Check API status
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const response = await fetch('/.netlify/functions/health');
      if (response.ok) {
        const data = await response.json();
        setApiMode(data.mode);
      }
    } catch (error) {
      console.log('Health check failed, using demo mode');
      setApiMode('demo');
    }
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
      const response = await fetch('/.netlify/functions/summarize', {
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
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
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
        compressionRatio: data.compressionRatio
      });

      // Update API mode based on response
      if (data.mode) {
        setApiMode(data.mode);
      }

    } catch (err: any) {
      console.error('Summarization error:', err);
      
      // Handle different types of errors
      if (err.message.includes('Failed to fetch') || err.message.includes('ECONNREFUSED')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else if (err.message.includes('timeout')) {
        setError('Request timed out. Please try with shorter text or try again later.');
      } else if (err.message.includes('Rate limit')) {
        setError('Rate limit exceeded. Please wait a few minutes before trying again.');
      } else if (err.message.includes('API key')) {
        setError('API configuration error. Please contact the administrator.');
      } else if (err.message.includes('model is loading')) {
        setError('AI model is loading. Please try again in a few moments.');
      } else if (err.message.includes('Empty response') || err.message.includes('Invalid JSON')) {
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
    content += `Original text length: ${summaryStats?.originalLength || inputText.length} characters\n`;
    content += `Summary length: ${summaryStats?.summaryLength || summary.length} characters\n`;
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
    <div className={`min-h-screen transition-all duration-500 ${
      darkMode ? 'dark-gradient-bg' : 'light-gradient-bg'
    }`}>
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
                className="flex items-center space-x-3"
                whileHover={{ scale: 1.05 }}
              >
                <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg border border-blue-300 dark:border-blue-700">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
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
              Leverage the power of AI to quickly summarize articles, research papers, 
              and any lengthy text content with precision and clarity.
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
              value={inputText.split(/\s+/).filter(word => word.length > 0).length.toLocaleString()}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Input Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <TextInput
                value={inputText}
                onChange={setInputText}
                onSummarize={handleSummarize}
                isLoading={isLoading}
                error={error}
              />
            </motion.div>

            {/* Output Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
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

          {/* API Status Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-2xl shadow-lg"
          >
            <div className="flex items-center space-x-3">
              <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                  {apiMode === 'ai' ? 'AI Mode Active' : 'Demo Mode Active'}
                </h3>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  {apiMode === 'ai' 
                    ? 'Using Hugging Face AI for high-quality text summarization.'
                    : 'Using demo summarization. To enable AI mode, set your Hugging Face API key in the Netlify environment variables.'
                  }
                </p>
              </div>
            </div>
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
                Powered by Hugging Face AI • Built with React & Tailwind CSS • Deployed on Netlify
              </p>
            </div>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}

export default App;