import React from 'react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      className="glass-card rounded-3xl p-6 text-center border border-white/20 dark:border-slate-700/50 shadow-xl"
    >
      <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 w-16 h-16 flex items-center justify-center mx-auto shadow-inner border border-white/20 dark:border-slate-700/30">
        <Icon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
      </div>
      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
        {title}
      </h3>
      <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
        {value}
      </div>
      <p className="text-slate-600 dark:text-slate-400 text-sm">{subtitle}</p>
    </motion.div>
  );
};

export default StatsCard;
