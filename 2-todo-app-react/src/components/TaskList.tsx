import { TaskItem } from "./TaskItem";
import { EmptyState } from "./EmptyState";
import type { TaskListProps } from "@/types";

export function TaskList({ 
  tasks, 
  onToggleComplete, 
  onEdit, 
  onSaveEdit, 
  onCancelEdit, 
  onDelete, 
  celebrateTaskId, 
  filter 
}: TaskListProps) {
  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  if (filteredTasks.length === 0) {
    return <EmptyState filter={filter} />;
  }

  return (
    <div className="space-y-4">
      {filteredTasks.map((task, index) => (
        <div
          key={task.id}
          style={{
            animationDelay: `${index * 100}ms`,
            animation: 'slideIn 0.5s ease-out forwards'
          }}
        >
          <TaskItem
            task={task}
            onToggleComplete={onToggleComplete}
            onEdit={onEdit}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            onDelete={onDelete}
            celebrateTaskId={celebrateTaskId}
          />
        </div>
      ))}
    </div>
  );
}