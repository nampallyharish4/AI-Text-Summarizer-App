import React from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertCircle } from 'lucide-react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSummarize: () => void;
  isLoading: boolean;
  error: string;
}

const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  onSummarize,
  isLoading,
  error
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey && value.length >= 200) {
      onSummarize();
    }
  };

  const characterCount = value.length;
  const wordCount = value.split(/\s+/).filter(word => word.length > 0).length;
  const isValid = characterCount >= 200 && characterCount <= 100000;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-strong rounded-3xl p-6 h-full"
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-blue-500">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-white dark:text-white">Input Text</h3>
      </div>

      <div className="relative mb-4">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Paste your text here to summarize... (Minimum 200 characters, Maximum 100,000 characters)"
          className="w-full h-80 p-4 bg-white/10 dark:bg-black/10 border border-white/20 rounded-2xl text-white dark:text-white placeholder-white/60 dark:placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300"
          maxLength={100000}
        />
        
        {/* Character counter overlay */}
        <div className="absolute bottom-4 right-4 glass rounded-lg px-3 py-1">
          <span className={`text-sm font-medium ${
            isValid ? 'text-green-400' : characterCount > 100000 ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {characterCount.toLocaleString()} / 100,000
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4 text-sm text-white/80 dark:text-white/70">
          <span>Words: {wordCount.toLocaleString()}</span>
          <span>Characters: {characterCount.toLocaleString()}</span>
        </div>
        <div className="text-sm text-white/80 dark:text-white/70">
          Ctrl + Enter to summarize
        </div>
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-2 p-3 bg-red-500/20 border border-red-500/30 rounded-xl mb-4"
        >
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-red-400 text-sm">{error}</span>
        </motion.div>
      )}

      {/* Progress bar */}
      <div className="w-full bg-white/10 rounded-full h-2 mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((characterCount / 200) * 100, 100)}%` }}
          className={`h-2 rounded-full transition-all duration-300 ${
            characterCount < 200 
              ? 'bg-gradient-to-r from-red-500 to-yellow-500'
              : 'bg-gradient-to-r from-green-500 to-blue-500'
          }`}
        />
      </div>

      {/* Validation message */}
      <div className="text-sm text-white/70 dark:text-white/60">
        {characterCount < 200 && (
          <span className="text-yellow-400">
            Need {200 - characterCount} more characters to summarize
          </span>
        )}
        {characterCount >= 200 && characterCount <= 100000 && (
          <span className="text-green-400">
            Ready to summarize!
          </span>
        )}
        {characterCount > 100000 && (
          <span className="text-red-400">
            Text too long. Please reduce by {characterCount - 100000} characters.
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default TextInput;