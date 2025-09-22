import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: LucideIcon;
  description: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  isPositive,
  icon: Icon,
  description
}) => {
  return (
    <div className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 hover:bg-white/40 dark:hover:bg-gray-900/40 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className={`text-sm font-medium px-2 py-1 rounded-lg ${
          isPositive 
            ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30' 
            : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
        }`}>
          {change}
        </span>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{value}</h3>
        <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">{title}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </div>
  );
};

export default StatsCard;