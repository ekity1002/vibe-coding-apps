import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('App', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  it('should render the app title and add task section', () => {
    render(<App />);
    expect(screen.getByText('TodoMaster')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /追加/i })).toBeInTheDocument();
  });

  it('should add a new task when the add button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const inputElement = screen.getByRole('textbox');
    const addButton = screen.getByRole('button', { name: /追加/i });

    await user.type(inputElement, 'Test Task');
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });
  });

  it('should add a task when Enter key is pressed', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const inputElement = screen.getByRole('textbox');
    await user.type(inputElement, 'Task with Enter{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Task with Enter')).toBeInTheDocument();
    });
  });

  it('should not add empty tasks', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const addButton = screen.getByRole('button', { name: /追加/i });
    expect(addButton).toBeDisabled();

    const inputElement = screen.getByRole('textbox');
    await user.type(inputElement, '   ');
    expect(addButton).toBeDisabled();
  });

  it('should toggle task completion when checkbox is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const inputElement = screen.getByRole('textbox');
    const addButton = screen.getByRole('button', { name: /追加/i });

    await user.type(inputElement, 'Task to complete');
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Task to complete')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox');
    const taskText = screen.getByText('Task to complete');

    expect(taskText).not.toHaveClass('line-through');
    await user.click(checkbox);
    expect(taskText).toHaveClass('line-through');

    await user.click(checkbox);
    expect(taskText).not.toHaveClass('line-through');
  });

  it('should delete a task when the delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const inputElement = screen.getByRole('textbox');
    const addButton = screen.getByRole('button', { name: /追加/i });

    await user.type(inputElement, 'Task to delete');
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Task to delete')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: '' });
    const deleteButton = deleteButtons.find(btn => btn.querySelector('svg')?.classList.contains('lucide-trash2'));
    await user.click(deleteButton!);

    await waitFor(() => {
      expect(screen.queryByText('Task to delete')).not.toBeInTheDocument();
    });
  });

  it('should edit a task when the edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const inputElement = screen.getByRole('textbox');
    const addButton = screen.getByRole('button', { name: /追加/i });

    await user.type(inputElement, 'Task to edit');
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Task to edit')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: '' });
    const editButton = editButtons.find(btn => btn.querySelector('svg')?.classList.contains('lucide-pen-line'));
    await user.click(editButton!);

    const editInput = screen.getByDisplayValue('Task to edit');
    await user.clear(editInput);
    await user.type(editInput, 'Edited Task');

    const saveButtons = screen.getAllByRole('button', { name: '' });
    const saveButton = saveButtons.find(btn => btn.querySelector('svg')?.classList.contains('lucide-check'));
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Edited Task')).toBeInTheDocument();
      expect(screen.queryByText('Task to edit')).not.toBeInTheDocument();
    });
  });


  it('should show motivational messages', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Initial message
    expect(screen.getByText('新しい一日を始めましょう！')).toBeInTheDocument();

    // Add a task
    const inputElement = screen.getByRole('textbox');
    const addButton = screen.getByRole('button', { name: /追加/i });
    await user.type(inputElement, 'First Task');
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('最初の一歩を踏み出しましょう！')).toBeInTheDocument();
    });

    // Complete the task
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText('🎉 全てのタスクが完了しました！素晴らしい！')).toBeInTheDocument();
    });
  });

  it('should save and load tasks from localStorage', () => {
    const mockTasks = [
      { id: 1, text: 'Saved Task', completed: false, isEditing: false, createdAt: new Date().toISOString() }
    ];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockTasks));

    render(<App />);

    expect(localStorageMock.getItem).toHaveBeenCalledWith('todos');
    expect(screen.getByText('Saved Task')).toBeInTheDocument();
  });

  it('should save tasks to localStorage when tasks are modified', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const inputElement = screen.getByRole('textbox');
    const addButton = screen.getByRole('button', { name: /追加/i });

    await user.type(inputElement, 'New Task');
    await user.click(addButton);

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('todos', expect.any(String));
    });
  });
});
