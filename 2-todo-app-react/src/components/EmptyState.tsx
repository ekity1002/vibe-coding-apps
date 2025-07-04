import { Coffee } from 'lucide-react';
import type { EmptyStateProps } from '@/types';

const getEmptyMessage = (filter: EmptyStateProps['filter']) => {
  switch (filter) {
    case 'active':
      return {
        title: '未完了のタスクはありません',
        subtitle: '全てのタスクが完了しています！🎉',
      };
    case 'completed':
      return {
        title: '完了したタスクはありません',
        subtitle: 'まずはタスクを完了させましょう！',
      };
    default:
      return {
        title: 'まだタスクがありません',
        subtitle: '新しいタスクを追加して始めましょう！',
      };
  }
};

export function EmptyState({ filter }: EmptyStateProps) {
  const { title, subtitle } = getEmptyMessage(filter);

  return (
    <div className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/20">
      <Coffee className="size-16 text-gray-400 mx-auto mb-4" />
      <p className="text-xl text-gray-500 font-medium mb-2">{title}</p>
      <p className="text-gray-400">{subtitle}</p>
    </div>
  );
}
