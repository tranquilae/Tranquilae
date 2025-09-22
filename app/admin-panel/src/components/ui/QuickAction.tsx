import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface QuickActionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

const QuickAction: React.FC<QuickActionProps> = ({
  title,
  description,
  icon: Icon,
  color
}) => {
  return (
    <button className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 text-left hover:bg-white/40 dark:hover:bg-gray-900/40 transition-all duration-300 group">
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-white mb-1">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </button>
  );
};

export default QuickAction;