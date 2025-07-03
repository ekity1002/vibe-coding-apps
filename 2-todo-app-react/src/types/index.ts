export interface Task {
  id: number;
  text: string;
  completed: boolean;
  isEditing: boolean;
  createdAt: Date;
}

export type FilterType = 'all' | 'active' | 'completed';

export interface TaskFormProps {
  newTask: string;
  setNewTask: (value: string) => void;
  onAddTask: () => void;
  isLoading: boolean;
}

export interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: number) => void;
  onEdit: (id: number) => void;
  onSaveEdit: (id: number, text: string) => void;
  onCancelEdit: (id: number) => void;
  onDelete: (id: number) => void;
  celebrateTaskId: number | null;
}

export interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: number) => void;
  onEdit: (id: number) => void;
  onSaveEdit: (id: number, text: string) => void;
  onCancelEdit: (id: number) => void;
  onDelete: (id: number) => void;
  celebrateTaskId: number | null;
  filter: FilterType;
}

export interface FilterTabsProps {
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
  totalCount: number;
}

export interface ProgressBarProps {
  completedCount: number;
  totalCount: number;
}

export interface HeaderProps {
  totalCount: number;
  completedCount: number;
}

export interface EmptyStateProps {
  filter: FilterType;
}