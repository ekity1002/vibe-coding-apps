import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TaskFormProps } from '@/types';

export function TaskForm({
  newTask,
  setNewTask,
  onAddTask,
  isLoading,
}: TaskFormProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      onAddTask();
    }
  };

  return (
    <div className="mb-8 bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            label="新しいタスクを追加"
            value={newTask}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewTask(e.target.value)
            }
            onKeyPress={handleKeyPress}
            className="text-lg"
            disabled={isLoading}
          />
        </div>
        <Button
          onClick={onAddTask}
          size="lg"
          disabled={isLoading || !newTask.trim()}
          className="shrink-0"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <Plus className="size-5" />
          )}
          追加
        </Button>
      </div>
    </div>
  );
}
