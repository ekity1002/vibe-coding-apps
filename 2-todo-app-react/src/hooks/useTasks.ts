import { useEffect, useState } from 'react';
import type { FilterType, Task } from '@/types';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<string>('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [celebrateTaskId, setCelebrateTaskId] = useState<number | null>(null);

  // Load tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('todos');
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks).map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
      }));
      setTasks(parsedTasks);
    }
  }, []);

  // Save tasks to localStorage
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = async () => {
    if (newTask.trim() !== '') {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API call

      const newTaskObj = {
        id: Date.now(),
        text: newTask.trim(),
        completed: false,
        isEditing: false,
        createdAt: new Date(),
      };

      setTasks((prev) => [newTaskObj, ...prev]);
      setNewTask('');
      setIsLoading(false);
    }
  };

  const handleToggleComplete = (id: number) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          const updatedTask = { ...task, completed: !task.completed };
          if (updatedTask.completed) {
            setCelebrateTaskId(id);
            setTimeout(() => setCelebrateTaskId(null), 2000);
          }
          return updatedTask;
        }
        return task;
      })
    );
  };

  const handleDeleteTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const handleEditTask = (id: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === id
          ? { ...task, isEditing: true }
          : { ...task, isEditing: false }
      )
    );
  };

  const handleSaveEdit = (id: number, newText: string) => {
    if (newText.trim() !== '') {
      setTasks(
        tasks.map((task) =>
          task.id === id
            ? { ...task, text: newText.trim(), isEditing: false }
            : task
        )
      );
    }
  };

  const handleCancelEdit = (id: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, isEditing: false } : task
      )
    );
  };

  const completedCount = tasks.filter((task) => task.completed).length;
  const totalCount = tasks.length;

  return {
    tasks,
    newTask,
    setNewTask,
    filter,
    setFilter,
    isLoading,
    celebrateTaskId,
    handleAddTask,
    handleToggleComplete,
    handleDeleteTask,
    handleEditTask,
    handleSaveEdit,
    handleCancelEdit,
    completedCount,
    totalCount,
  };
}
