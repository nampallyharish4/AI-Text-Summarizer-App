import React from 'react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, icon }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      className="glass-strong rounded-2xl p-6 text-center border-2 border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300"
    >
      <div className="text-3xl mb-3 p-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 w-16 h-16 flex items-center justify-center mx-auto shadow-lg border border-gray-200 dark:border-gray-600">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">{title}</h3>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{value}</div>
      <p className="text-gray-600 dark:text-white/70 text-sm">{subtitle}</p>
    </motion.div>
  );
};

export default StatsCard;