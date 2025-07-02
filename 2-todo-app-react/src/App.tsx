import { useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Task {
  id: number;
  text: string;
  completed: boolean;
  isEditing: boolean;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<string>('');

  const handleAddTask = () => {
    if (newTask.trim() !== '') {
      setTasks([
        ...tasks,
        { id: Date.now(), text: newTask.trim(), completed: false, isEditing: false },
      ]);
      setNewTask('');
    }
  };

  const handleToggleComplete = (id: number) => {
    setTasks(tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleDeleteTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const handleEditTask = (id: number) => {
    setTasks(tasks.map((task) =>
      task.id === id ? { ...task, isEditing: true } : task
    ));
  };

  const handleSaveEdit = (id: number, newText: string) => {
    setTasks(tasks.map((task) =>
      task.id === id ? { ...task, text: newText, isEditing: false } : task
    ));
  };

  const handleCancelEdit = (id: number) => {
    setTasks(tasks.map((task) =>
      task.id === id ? { ...task, isEditing: false } : task
    ));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Todo App</h1>
      <div className="flex mb-4">
        <Input
          type="text"
          placeholder="Add a new task"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddTask();
            }
          }}
        />
        <Button
          className="rounded-r-md"
          onClick={handleAddTask}
        >
          Add Task
        </Button>
      </div>
      <div>
        {tasks.length === 0 ? (
          <p className="text-gray-500">No tasks yet. Add one above!</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between bg-gray-100 p-3 rounded-md shadow-sm"
              >
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => handleToggleComplete(task.id)}
                  />
                  {task.isEditing ? (
                    <Input
                      value={task.text}
                      onChange={(e) =>
                        setTasks(tasks.map((t) =>
                          t.id === task.id ? { ...t, text: e.target.value } : t
                        ))
                      }
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit(task.id, task.text);
                        }
                      }}
                    />
                  ) : (
                    <Label
                      htmlFor={`task-${task.id}`}
                      className={`${task.completed ? 'line-through text-gray-500' : ''}`}
                    >
                      {task.text}
                    </Label>
                  )}
                </div>
                <div className="flex space-x-2">
                  {task.isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSaveEdit(task.id, task.text)}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelEdit(task.id)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTask(task.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
