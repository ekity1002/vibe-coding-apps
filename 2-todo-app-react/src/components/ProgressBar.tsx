import type { ProgressBarProps } from '@/types';

export function ProgressBar({ completedCount, totalCount }: ProgressBarProps) {
  if (totalCount === 0) return null;

  const progressPercentage = (completedCount / totalCount) * 100;

  return (
    <div className="mb-8 bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700">進捗状況</span>
        <span className="text-sm font-bold text-indigo-600">
          {completedCount}/{totalCount} 完了
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
          style={{ width: `${progressPercentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
