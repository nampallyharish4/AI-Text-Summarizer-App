import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertCircle } from 'lucide-react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSummarize: () => void;
  error: string;
}

/**
 * TextInput component for entering text to summarize
 * @param {TextInputProps} props - Component props
 * @returns {JSX.Element} The text input component
 */
const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  onSummarize,
  error,
}) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && e.ctrlKey && value.length >= 200) {
        onSummarize();
      }
    },
    [value.length, onSummarize]
  );

  const characterCount = value.length;
  const wordCount = value.split(/\s+/).filter((word) => word.length > 0).length;
  const isValid = characterCount >= 200 && characterCount <= 100000;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-strong rounded-3xl p-6 h-full border-2 border-gray-200 dark:border-gray-700 shadow-2xl"
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-blue-500 shadow-lg">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
          Input Text
        </h3>
      </div>

      <div className="relative mb-4">
        <textarea
          value={value}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder="Paste your text here to summarize... (Minimum 200 characters, Maximum 100,000 characters)"
          className="w-full h-80 p-4 bg-white/50 dark:bg-black/30 border-2 border-gray-200 dark:border-gray-600 rounded-2xl text-gray-800 dark:text-white placeholder-gray-600 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-300 shadow-inner"
          maxLength={100000}
        />

        {/* Character counter overlay */}
        <div className="absolute bottom-4 right-4 glass rounded-lg px-3 py-1 border border-gray-200 dark:border-gray-600 shadow-md">
          <span
            className={`text-sm font-medium ${
              isValid
                ? 'text-green-600 dark:text-green-400'
                : characterCount > 100000
                ? 'text-red-600 dark:text-red-400'
                : 'text-yellow-600 dark:text-yellow-400'
            }`}
          >
            {characterCount.toLocaleString()} / 100,000
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4 text-sm text-gray-600 dark:text-gray-300">
          <span>Words: {wordCount.toLocaleString()}</span>
          <span>Characters: {characterCount.toLocaleString()}</span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Ctrl + Enter to summarize
        </div>
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 rounded-xl mb-4 shadow-lg"
        >
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          <span className="text-red-700 dark:text-red-400 text-sm">
            {error}
          </span>
        </motion.div>
      )}

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 mb-4 border border-gray-300 dark:border-gray-700 shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((characterCount / 200) * 100, 100)}%` }}
          className={`h-full rounded-full transition-all duration-300 shadow-sm ${
            characterCount < 200
              ? 'bg-gradient-to-r from-red-500 to-yellow-500'
              : 'bg-gradient-to-r from-green-500 to-blue-500'
          }`}
        />
      </div>

      {/* Validation message */}
      <div className="text-sm text-gray-600 dark:text-gray-300">
        {characterCount < 200 && (
          <span className="text-yellow-600 dark:text-yellow-400">
            Need {200 - characterCount} more characters to summarize
          </span>
        )}
        {characterCount >= 200 && characterCount <= 100000 && (
          <span className="text-green-600 dark:text-green-400">
            Ready to summarize!
          </span>
        )}
        {characterCount > 100000 && (
          <span className="text-red-600 dark:text-red-400">
            Text too long. Please reduce by {characterCount - 100000}{' '}
            characters.
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default TextInput;
