import React from 'react';
import { Zap, AlertCircle } from 'lucide-react';

interface PriorityIndicatorProps {
  urgency: 'critical' | 'high' | 'medium' | 'low';
  priorityScore: number;
  reasons: string[];
}

const getColorClasses = (urgency: string) => {
  switch (urgency) {
    case 'critical':
      return 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300';
    case 'high':
      return 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300';
    case 'medium':
      return 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300';
    case 'low':
      return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300';
  }
};

const getUrgencyLabel = (urgency: string) => {
  switch (urgency) {
    case 'critical':
      return '⚠️ CRITICAL PRIORITY';
    case 'high':
      return '🔴 HIGH PRIORITY';
    case 'medium':
      return '🟡 MEDIUM PRIORITY';
    case 'low':
      return '🟢 LOW PRIORITY';
  }
};

export const PriorityIndicator: React.FC<PriorityIndicatorProps> = ({
  urgency,
  priorityScore,
  reasons,
}) => {
  if (urgency === 'low' && reasons.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-lg border p-3 ${getColorClasses(urgency)}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {urgency === 'critical' || urgency === 'high' ? (
            <Zap className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="text-xs font-bold">{getUrgencyLabel(urgency)}</span>
        </div>
        <span className="text-xs font-semibold bg-white dark:bg-gray-900 px-2 py-1 rounded">
          Score: {priorityScore}
        </span>
      </div>

      {/* Reasons */}
      {reasons.length > 0 && (
        <div className="space-y-1">
          {reasons.map((reason, idx) => (
            <p key={idx} className="text-xs ml-4">
              • {reason}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
