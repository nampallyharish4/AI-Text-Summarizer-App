import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Sparkles, Copy, Download, RefreshCw } from 'lucide-react';
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

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

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

    setIsLoading(true);
    setError('');
    setSummary('');

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to summarize text');
      }

      const { summary: summaryText } = await response.json();
      setSummary(summaryText);
    } catch (err) {
      setError('Failed to summarize text. Please try again.');
      console.error('Summarization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const downloadSummary = () => {
    const element = document.createElement('a');
    const file = new Blob([summary], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'summary.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const clearAll = () => {
    setInputText('');
    setSummary('');
    setError('');
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
          className="glass-strong sticky top-0 z-50 border-b border-white/20 dark:border-gray-800"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <motion.div 
                className="flex items-center space-x-3"
                whileHover={{ scale: 1.05 }}
              >
                <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
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
                className="p-3 rounded-full glass hover:glass-strong transition-all duration-300"
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
              value={summary ? `${Math.round((1 - summary.length / inputText.length) * 100)}%` : '0%'}
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
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
                  className="px-6 py-4 glass-strong text-gray-800 dark:text-white font-semibold rounded-2xl hover:bg-white/30 dark:hover:bg-black/70 transition-all duration-300 flex items-center space-x-2"
                >
                  <Copy className="w-5 h-5" />
                  <span>Copy Summary</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={downloadSummary}
                  className="px-6 py-4 glass-strong text-gray-800 dark:text-white font-semibold rounded-2xl hover:bg-white/30 dark:hover:bg-black/70 transition-all duration-300 flex items-center space-x-2"
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
              className="px-6 py-4 glass-strong text-gray-800 dark:text-white font-semibold rounded-2xl hover:bg-white/30 dark:hover:bg-black/70 transition-all duration-300 flex items-center space-x-2"
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
          className="glass-strong border-t border-white/20 dark:border-gray-800 mt-16"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-gray-700 dark:text-gray-300">
                Developed with ❤️ by Harish Nampally
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                Powered by Hugging Face AI • Built with React & Tailwind CSS
              </p>
            </div>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}

export default App;