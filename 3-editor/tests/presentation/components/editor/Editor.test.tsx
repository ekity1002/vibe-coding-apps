import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editor } from '../../../../src/presentation/components/editor/Editor'
import { EditorConfig } from '../../../../src/domain/config/entities/EditorConfig'

describe('Editor Component', () => {
  beforeEach(() => {
    EditorConfig.resetInstance()
  })

  describe('Basic Rendering', () => {
    it('should render editor with TextArea', () => {
      render(<Editor />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should render editor in a card container', () => {
      render(<Editor />)
      const container = screen.getByRole('textbox').closest('[class*="card"]')
      expect(container).toBeInTheDocument()
    })

    it('should have default height of 96 (h-96)', () => {
      render(<Editor />)
      const container = screen.getByRole('textbox').closest('[class*="h-96"]')
      expect(container).toBeInTheDocument()
    })
  })

  describe('EditorConfig Integration', () => {
    it('should use EditorConfig singleton', () => {
      render(<Editor />)
      const config = EditorConfig.getInstance()
      expect(config).toBeDefined()
      expect(config.getFontSize()).toBe(14) // default
      expect(config.getTheme()).toBe('light') // default
    })

    it('should apply theme to container', () => {
      const config = EditorConfig.getInstance()
      config.setTheme('dark')
      
      render(<Editor />)
      const container = screen.getByRole('textbox').closest('[class*="bg-gray-900"]')
      expect(container).toBeInTheDocument()
    })

    it('should apply light theme by default', () => {
      render(<Editor />)
      const container = screen.getByRole('textbox').closest('[class*="bg-white"]')
      expect(container).toBeInTheDocument()
    })
  })

  describe('Line Numbers Feature', () => {
    it('should display line numbers when enabled', () => {
      const config = EditorConfig.getInstance()
      config.setShowLineNumbers(true)
      
      render(<Editor />)
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should not display line numbers when disabled', () => {
      const config = EditorConfig.getInstance()
      config.setShowLineNumbers(false)
      
      render(<Editor />)
      expect(screen.queryByText('1')).not.toBeInTheDocument()
    })

    it('should show multiple line numbers for multiline text', async () => {
      const user = userEvent.setup()
      const config = EditorConfig.getInstance()
      config.setShowLineNumbers(true)
      
      render(<Editor />)
      
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Line 1{enter}Line 2{enter}Line 3')
      
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should update line numbers dynamically', async () => {
      const user = userEvent.setup()
      const config = EditorConfig.getInstance()
      config.setShowLineNumbers(true)
      
      render(<Editor />)
      
      // Initially only line 1
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.queryByText('2')).not.toBeInTheDocument()
      
      // Add a new line
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Line 1{enter}Line 2')
      
      // Now both lines should be visible
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should have proper line number styling', () => {
      const config = EditorConfig.getInstance()
      config.setShowLineNumbers(true)
      
      render(<Editor />)
      
      const lineNumberElement = screen.getByText('1')
      expect(lineNumberElement).toHaveClass('text-gray-500')
      expect(lineNumberElement).toHaveClass('text-sm')
    })
  })

  describe('Text Handling', () => {
    it('should handle text input', async () => {
      const user = userEvent.setup()
      render(<Editor />)
      
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Hello World')
      
      expect(textarea).toHaveValue('Hello World')
    })

    it('should call onTextChange when text changes', async () => {
      const user = userEvent.setup()
      const handleTextChange = vi.fn()
      
      render(<Editor onTextChange={handleTextChange} />)
      
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Hello')
      
      expect(handleTextChange).toHaveBeenCalled()
      expect(handleTextChange).toHaveBeenLastCalledWith('Hello')
    })

    it('should display initial value', () => {
      const initialValue = 'Initial text content'
      render(<Editor initialValue={initialValue} />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue(initialValue)
    })

    it('should handle empty initial value', () => {
      render(<Editor initialValue="" />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('')
    })
  })

  describe('Layout and Styling', () => {
    it('should apply custom className', () => {
      const customClass = 'custom-editor'
      render(<Editor className={customClass} />)
      
      const container = screen.getByRole('textbox').closest('[class*="custom-editor"]')
      expect(container).toBeInTheDocument()
    })

    it('should have proper flex layout', () => {
      const config = EditorConfig.getInstance()
      config.setShowLineNumbers(true)
      
      render(<Editor />)
      
      const container = screen.getByRole('textbox').closest('[class*="flex"]')
      expect(container).toBeInTheDocument()
    })

    it('should have overflow hidden', () => {
      render(<Editor />)
      
      const container = screen.getByRole('textbox').closest('[class*="overflow-hidden"]')
      expect(container).toBeInTheDocument()
    })

    it('should expand TextArea to full width when no line numbers', () => {
      const config = EditorConfig.getInstance()
      config.setShowLineNumbers(false)
      
      render(<Editor />)
      
      const textareaContainer = screen.getByRole('textbox').closest('[class*="flex-1"]')
      expect(textareaContainer).toBeInTheDocument()
    })
  })

  describe('Configuration Updates', () => {
    it('should reflect EditorConfig theme at render time', () => {
      const config = EditorConfig.getInstance()
      config.setTheme('dark')
      
      render(<Editor />)
      
      // Check if dark theme is applied to the card container
      const cardContainer = screen.getByRole('textbox').closest('.bg-gray-900')
      expect(cardContainer).toBeInTheDocument()
    })

    it('should reflect line numbers setting at render time', () => {
      // Test with line numbers enabled
      const config1 = EditorConfig.getInstance()
      config1.setShowLineNumbers(true)
      
      const { unmount } = render(<Editor />)
      expect(screen.getByText('1')).toBeInTheDocument()
      unmount()
      
      // Reset and test with line numbers disabled
      EditorConfig.resetInstance()
      const config2 = EditorConfig.getInstance()
      config2.setShowLineNumbers(false)
      
      render(<Editor />)
      expect(screen.queryByText('1')).not.toBeInTheDocument()
    })
  })

  describe('Integration with TextArea', () => {
    it('should pass text value to TextArea component', () => {
      const initialValue = 'Test content'
      render(<Editor initialValue={initialValue} />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue(initialValue)
    })

    it('should handle TextArea onChange events', async () => {
      const user = userEvent.setup()
      const handleTextChange = vi.fn()
      
      render(<Editor onTextChange={handleTextChange} />)
      
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Test')
      
      expect(handleTextChange).toHaveBeenCalled()
    })

    it('should provide proper className to TextArea', () => {
      render(<Editor />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveClass('h-full')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<Editor />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('aria-label', 'Text editor input area')
    })

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup()
      render(<Editor />)
      
      const textarea = screen.getByRole('textbox')
      
      // Should be focusable
      await user.click(textarea)
      expect(textarea).toHaveFocus()
      
      // Should accept keyboard input
      await user.keyboard('Hello')
      expect(textarea).toHaveValue('Hello')
    })
  })
})