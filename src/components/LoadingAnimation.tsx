import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, Sparkles } from 'lucide-react';

/**
 * LoadingAnimation component for displaying loading state during summarization
 * @returns {JSX.Element} The loading animation component
 */
const LoadingAnimation: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-strong rounded-3xl p-6 h-full border-2 border-gray-200 dark:border-gray-700 shadow-2xl"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
          AI Processing
        </h3>
      </div>

      <div className="flex flex-col items-center justify-center min-h-80">
        {/* Main loading animation */}
        <div className="relative mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-20 h-20 border-4 border-gray-300 dark:border-gray-700 border-t-blue-500 rounded-full shadow-lg"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-2 w-16 h-16 border-4 border-gray-200 dark:border-gray-800 border-b-purple-500 rounded-full shadow-md"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-6 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg"
          />
        </div>

        {/* Floating icons */}
        <div className="relative w-32 h-16 mb-6">
          <motion.div
            animate={{
              y: [-10, 10, -10],
              x: [-5, 5, -5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute left-0 top-0 p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 shadow-lg"
          >
            <Sparkles className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </motion.div>
          <motion.div
            animate={{
              y: [10, -10, 10],
              x: [5, -5, 5],
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute right-0 top-0 p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 shadow-lg"
          >
            <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </motion.div>
          <motion.div
            animate={{
              y: [-5, 15, -5],
              x: [0, 0, 0],
            }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 shadow-lg"
          >
            <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </motion.div>
        </div>

        {/* Loading text */}
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-center p-4 bg-white/20 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg"
        >
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            Analyzing Your Text
          </h4>
          <p className="text-gray-600 dark:text-gray-300">
            Our AI is processing and summarizing your content...
          </p>
        </motion.div>

        {/* Progress dots */}
        <div className="flex space-x-2 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg border border-gray-300 dark:border-gray-600"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default LoadingAnimation;
