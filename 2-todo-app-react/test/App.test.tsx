import { render, screen, fireEvent } from '@testing-library/react';
import App from '../src/App';

describe('App', () => {
  it('should render a task input and an add button', () => {
    render(<App />);
    expect(screen.getByPlaceholderText(/Add a new task/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Task/i })).toBeInTheDocument();
  });

  it('should add a new task when the add button is clicked', () => {
    render(<App />);
    const inputElement = screen.getByPlaceholderText(/Add a new task/i);
    const addButton = screen.getByRole('button', { name: /Add Task/i });

    fireEvent.change(inputElement, { target: { value: 'Test Task' } });
    fireEvent.click(addButton);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('should toggle task completion when checkbox is clicked', () => {
    render(<App />);
    const inputElement = screen.getByPlaceholderText(/Add a new task/i);
    const addButton = screen.getByRole('button', { name: /Add Task/i });

    fireEvent.change(inputElement, { target: { value: 'Task to complete' } });
    fireEvent.click(addButton);

    const taskText = screen.getByText('Task to complete');
    const checkbox = screen.getByRole('checkbox');

    expect(taskText).not.toHaveClass('line-through');
    fireEvent.click(checkbox);
    expect(taskText).toHaveClass('line-through');

    fireEvent.click(checkbox);
    expect(taskText).not.toHaveClass('line-through');
  });

  it('should delete a task when the delete button is clicked', () => {
    render(<App />);
    const inputElement = screen.getByPlaceholderText(/Add a new task/i);
    const addButton = screen.getByRole('button', { name: /Add Task/i });

    fireEvent.change(inputElement, { target: { value: 'Task to delete' } });
    fireEvent.click(addButton);

    const taskText = screen.getByText('Task to delete');
    expect(taskText).toBeInTheDocument();

    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButton);

    expect(taskText).not.toBeInTheDocument();
  });

  it('should edit a task when the edit button is clicked', () => {
    render(<App />);
    const inputElement = screen.getByPlaceholderText(/Add a new task/i);
    const addButton = screen.getByRole('button', { name: /Add Task/i });

    fireEvent.change(inputElement, { target: { value: 'Task to edit' } });
    fireEvent.click(addButton);

    const taskText = screen.getByText('Task to edit');
    expect(taskText).toBeInTheDocument();

    const editButton = screen.getByRole('button', { name: /Edit/i });
    fireEvent.click(editButton);

    const editInput = screen.getByDisplayValue('Task to edit');
    fireEvent.change(editInput, { target: { value: 'Edited Task' } });

    const saveButton = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveButton);

    expect(screen.getByText('Edited Task')).toBeInTheDocument();
    expect(taskText).not.toBeInTheDocument(); // Original text should be gone
  });
});
