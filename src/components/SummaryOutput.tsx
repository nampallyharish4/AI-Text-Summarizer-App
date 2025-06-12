import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Copy, Download, FileText } from 'lucide-react';

interface SummaryOutputProps {
  summary: string;
  onCopy: () => void;
  onDownload: () => void;
}

const SummaryOutput: React.FC<SummaryOutputProps> = ({
  summary,
  onCopy,
  onDownload
}) => {
  const wordCount = summary.split(/\s+/).filter(word => word.length > 0).length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-strong rounded-3xl p-6 h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">AI Summary</h3>
        </div>
        
        {summary && (
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onCopy}
              className="p-2 glass rounded-xl hover:bg-white/30 dark:hover:bg-black/50 transition-all duration-300"
              title="Copy summary"
            >
              <Copy className="w-4 h-4 text-gray-700 dark:text-white" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onDownload}
              className="p-2 glass rounded-xl hover:bg-white/30 dark:hover:bg-black/50 transition-all duration-300"
              title="Download summary"
            >
              <Download className="w-4 h-4 text-gray-700 dark:text-white" />
            </motion.button>
          </div>
        )}
      </div>

      <div className="relative mb-4">
        {summary ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white/20 dark:bg-black/30 border border-white/30 dark:border-gray-700 rounded-2xl min-h-80"
          >
            <p className="text-gray-800 dark:text-white leading-relaxed whitespace-pre-wrap">
              {summary}
            </p>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-white/10 dark:bg-black/20 border border-white/20 dark:border-gray-800 rounded-2xl min-h-80">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="p-4 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 mb-4"
            >
              <FileText className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </motion.div>
            <p className="text-gray-600 dark:text-gray-300 text-center">
              Your AI-generated summary will appear here
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center mt-2">
              Enter at least 200 characters and click "Summarize Text"
            </p>
          </div>
        )}
      </div>

      {summary && (
        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
          <span>Summary: {wordCount} words</span>
          <span>{summary.length} characters</span>
        </div>
      )}
    </motion.div>
  );
};

export default SummaryOutput;