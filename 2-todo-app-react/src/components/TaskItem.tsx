import { Check, PenLine, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TaskItemProps } from '@/types';

export function TaskItem({
  task,
  onToggleComplete,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  celebrateTaskId,
}: TaskItemProps) {
  const [tempText, setTempText] = useState(task.text);

  const handleSaveEdit = () => {
    onSaveEdit(task.id, tempText);
  };

  const handleCancelEdit = () => {
    setTempText(task.text);
    onCancelEdit(task.id);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div
      className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 transition-all duration-500 hover:shadow-2xl transform hover:-translate-y-1 ${
        celebrateTaskId === task.id
          ? 'animate-pulse bg-gradient-to-r from-green-100 to-emerald-100'
          : ''
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Checkbox */}
        <div className="shrink-0">
          <Checkbox
            id={`task-${task.id}`}
            checked={task.completed}
            onCheckedChange={() => onToggleComplete(task.id)}
          />
        </div>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          {task.isEditing ? (
            <Input
              value={tempText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTempText(e.target.value)
              }
              onKeyPress={handleKeyPress}
              className="text-base"
              autoFocus
            />
          ) : (
            <div>
              <Label
                htmlFor={`task-${task.id}`}
                className={`cursor-pointer text-lg font-medium transition-all duration-300 ${
                  task.completed
                    ? 'line-through text-gray-500'
                    : 'text-gray-800 hover:text-indigo-600'
                }`}
              >
                {task.text}
              </Label>
              <p className="text-sm text-gray-400 mt-1">
                作成日: {task.createdAt.toLocaleDateString('ja-JP')}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 shrink-0">
          {task.isEditing ? (
            <>
              <Button variant="success" size="sm" onClick={handleSaveEdit}>
                <Check className="size-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                <X className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(task.id)}
              >
                <PenLine className="size-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(task.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
