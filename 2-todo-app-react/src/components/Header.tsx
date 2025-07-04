import { Sparkles, Target } from 'lucide-react';
import type { HeaderProps } from '@/types';

const getMotivationalMessage = (totalCount: number, completedCount: number) => {
  if (totalCount === 0) return '新しい一日を始めましょう！';
  if (completedCount === 0) return '最初の一歩を踏み出しましょう！';
  const progressPercentage = (completedCount / totalCount) * 100;
  if (progressPercentage === 100)
    return '🎉 全てのタスクが完了しました！素晴らしい！';
  if (progressPercentage >= 75) return 'あと少しで完了です！頑張って！';
  if (progressPercentage >= 50) return '順調に進んでいます！';
  return '良いスタートです！';
};

export function Header({ totalCount, completedCount }: HeaderProps) {
  return (
    <div className="text-center mb-12">
      <div className="flex items-center justify-center gap-3 mb-4">
        <Target className="size-8 text-indigo-600" />
        <h1 className="text-5xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          TodoMaster
        </h1>
        <Sparkles className="size-8 text-purple-600" />
      </div>
      <p className="text-xl text-gray-600 font-medium">
        {getMotivationalMessage(totalCount, completedCount)}
      </p>
    </div>
  );
}
