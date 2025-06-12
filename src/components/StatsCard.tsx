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
      className="glass-strong rounded-2xl p-6 text-center"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-white dark:text-white mb-1">{title}</h3>
      <div className="text-3xl font-bold text-white dark:text-white mb-2">{value}</div>
      <p className="text-white/80 dark:text-white/70 text-sm">{subtitle}</p>
    </motion.div>
  );
};

export default StatsCard;