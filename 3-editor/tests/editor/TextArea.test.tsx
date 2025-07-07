import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TextArea } from '../../src/editor/TextArea'

describe('TextArea Component', () => {
  it('should render with default props', () => {
    render(<TextArea />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should display placeholder text', () => {
    const placeholder = 'Enter your text here...'
    render(<TextArea placeholder={placeholder} />)
    expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument()
  })

  it('should handle text changes', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    
    render(<TextArea onChange={handleChange} />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Hello')
    
    expect(handleChange).toHaveBeenCalled()
    expect(handleChange).toHaveBeenLastCalledWith('Hello')
  })

  it('should display initial value', () => {
    const initialValue = 'Initial text'
    render(<TextArea value={initialValue} />)
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue(initialValue)
  })

  it('should handle multiline text input', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    
    render(<TextArea onChange={handleChange} />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Line 1{enter}Line 2')
    
    expect(handleChange).toHaveBeenLastCalledWith('Line 1\nLine 2')
  })

  it('should apply EditorConfig font size settings', () => {
    render(<TextArea />)
    const textarea = screen.getByRole('textbox')
    
    // デフォルトフォントサイズ（14px = text-sm）が適用されているかを確認
    expect(textarea).toHaveClass('text-sm')
  })

  it('should apply EditorConfig theme settings for light theme', () => {
    render(<TextArea />)
    const textarea = screen.getByRole('textbox')
    
    // ライトテーマの色が適用されているかを確認
    expect(textarea).toHaveClass('bg-white', 'text-black')
  })

  it('should apply custom className', () => {
    const customClass = 'custom-textarea'
    render(<TextArea className={customClass} />)
    
    const container = screen.getByRole('textbox').parentElement
    expect(container).toHaveClass(customClass)
  })

  it('should have full width and height by default', () => {
    render(<TextArea />)
    const textarea = screen.getByRole('textbox')
    
    expect(textarea).toHaveClass('w-full', 'h-full')
  })

  it('should remove border and focus ring styles', () => {
    render(<TextArea />)
    const textarea = screen.getByRole('textbox')
    
    expect(textarea).toHaveClass('border-0', 'focus-visible:ring-0')
  })

  it('should have proper padding', () => {
    render(<TextArea />)
    const textarea = screen.getByRole('textbox')
    
    expect(textarea).toHaveClass('p-4')
  })

  it('should disable resize', () => {
    render(<TextArea />)
    const textarea = screen.getByRole('textbox')
    
    expect(textarea).toHaveClass('resize-none')
  })

  it('should handle controlled component pattern', async () => {
    const user = userEvent.setup()
    let value = 'initial'
    const handleChange = vi.fn((newValue: string) => {
      value = newValue
    })
    
    const { rerender } = render(<TextArea value={value} onChange={handleChange} />)
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue('initial')
    
    await user.type(textarea, ' text')
    expect(handleChange).toHaveBeenCalledWith('initial text')
    
    // Re-render with new value
    rerender(<TextArea value={value} onChange={handleChange} />)
    expect(textarea).toHaveValue('initial text')
  })

  it('should handle empty string value', () => {
    render(<TextArea value="" />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue('')
  })

  it('should call onChange with correct value on each keystroke', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    
    render(<TextArea onChange={handleChange} />)
    
    const textarea = screen.getByRole('textbox')
    
    await user.type(textarea, 'abc')
    
    // Should be called for each character
    expect(handleChange).toHaveBeenCalledTimes(3)
    expect(handleChange).toHaveBeenNthCalledWith(1, 'a')
    expect(handleChange).toHaveBeenNthCalledWith(2, 'ab')
    expect(handleChange).toHaveBeenNthCalledWith(3, 'abc')
  })
})