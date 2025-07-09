import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DeleteTextCommand } from '../../src/services/DeleteTextCommand'
import { CommandContext, TEXT_COMMAND_TYPES } from '../../src/types/CommandTypes'

describe('DeleteTextCommand', () => {
  let mockContext: CommandContext
  let updateTextSpy: ReturnType<typeof vi.fn>
  let setCursorPositionSpy: ReturnType<typeof vi.fn>
  let setSelectionSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    updateTextSpy = vi.fn()
    setCursorPositionSpy = vi.fn()
    setSelectionSpy = vi.fn()
    
    mockContext = {
      currentText: 'Hello World!',
      updateText: updateTextSpy,
      setCursorPosition: setCursorPositionSpy,
      setSelection: setSelectionSpy
    }
  })

  describe('Constructor and Basic Properties', () => {
    it('should initialize with correct properties', () => {
      const command = new DeleteTextCommand(5, 8, mockContext)
      
      expect(command.type).toBe(TEXT_COMMAND_TYPES.DELETE)
      expect(command.position.start).toBe(5)
      expect(command.position.end).toBe(8)
      expect(command.getDeleteRange()).toEqual({ start: 5, end: 8 })
      expect(command.isExecuted()).toBe(false)
    })

    it('should handle reversed start/end positions', () => {
      const command = new DeleteTextCommand(8, 5, mockContext)
      
      expect(command.position.start).toBe(5)
      expect(command.position.end).toBe(8)
      expect(command.getDeleteRange()).toEqual({ start: 5, end: 8 })
    })

    it('should handle single character deletion', () => {
      const command = new DeleteTextCommand(5, 6, mockContext)
      
      expect(command.getDeletedLength()).toBe(1)
      expect(command.position.start).toBe(5)
      expect(command.position.end).toBe(6)
    })

    it('should handle zero-length selection', () => {
      const command = new DeleteTextCommand(5, 5, mockContext)
      
      expect(command.getDeletedLength()).toBe(0)
      expect(command.position.start).toBe(5)
      expect(command.position.end).toBe(5)
    })
  })

  describe('Execute Method', () => {
    it('should execute text deletion correctly', () => {
      const command = new DeleteTextCommand(5, 8, mockContext)
      
      const result = command.execute()
      
      expect(result).toBe(true)
      expect(updateTextSpy).toHaveBeenCalledWith('Hello orld!')
      expect(setCursorPositionSpy).toHaveBeenCalledWith(5)
      expect(command.getDeletedText()).toBe(' Wo')
      expect(command.isExecuted()).toBe(true)
    })

    it('should delete from the beginning of text', () => {
      const command = new DeleteTextCommand(0, 5, mockContext)
      
      command.execute()
      
      expect(updateTextSpy).toHaveBeenCalledWith(' World!')
      expect(setCursorPositionSpy).toHaveBeenCalledWith(0)
      expect(command.getDeletedText()).toBe('Hello')
    })

    it('should delete from the end of text', () => {
      const command = new DeleteTextCommand(6, 12, mockContext)
      
      command.execute()
      
      expect(updateTextSpy).toHaveBeenCalledWith('Hello ')
      expect(setCursorPositionSpy).toHaveBeenCalledWith(6)
      expect(command.getDeletedText()).toBe('World!')
    })

    it('should delete entire text', () => {
      const command = new DeleteTextCommand(0, 12, mockContext)
      
      command.execute()
      
      expect(updateTextSpy).toHaveBeenCalledWith('')
      expect(setCursorPositionSpy).toHaveBeenCalledWith(0)
      expect(command.getDeletedText()).toBe('Hello World!')
    })

    it('should handle multiline text deletion', () => {
      mockContext.currentText = 'Line1\nLine2\nLine3'
      const command = new DeleteTextCommand(5, 11, mockContext)
      
      command.execute()
      
      expect(updateTextSpy).toHaveBeenCalledWith('Line1Line3')
      expect(command.getDeletedText()).toBe('\nLine2\n')
    })

    it('should handle special characters deletion', () => {
      mockContext.currentText = 'Hello 🚀🌟💻 World'
      const command = new DeleteTextCommand(6, 9, mockContext)
      
      command.execute()
      
      expect(updateTextSpy).toHaveBeenCalledWith('Hello  World')
      expect(command.getDeletedText()).toBe('🚀🌟💻')
    })

    it('should work without setCursorPosition callback', () => {
      const contextWithoutCursor = {
        ...mockContext,
        setCursorPosition: undefined
      }
      const command = new DeleteTextCommand(5, 8, contextWithoutCursor)
      
      const result = command.execute()
      
      expect(result).toBe(true)
      expect(updateTextSpy).toHaveBeenCalled()
    })

    it('should handle execution errors gracefully', () => {
      updateTextSpy.mockImplementation(() => {
        throw new Error('Update failed')
      })
      
      const command = new DeleteTextCommand(5, 8, mockContext)
      const result = command.execute()
      
      expect(result).toBe(false)
      expect(command.isExecuted()).toBe(false)
    })

    it('should handle out of bounds deletion', () => {
      const command = new DeleteTextCommand(10, 20, mockContext)
      
      command.execute()
      
      expect(updateTextSpy).toHaveBeenCalledWith('Hello Worl')
      expect(command.getDeletedText()).toBe('d!')
    })
  })

  describe('Undo Method', () => {
    it('should undo text deletion correctly', () => {
      const command = new DeleteTextCommand(5, 8, mockContext)
      
      // Execute first
      command.execute()
      expect(command.isExecuted()).toBe(true)
      
      // Then undo
      const result = command.undo()
      
      expect(result).toBe(true)
      expect(updateTextSpy).toHaveBeenLastCalledWith('Hello World!')
      expect(setSelectionSpy).toHaveBeenCalledWith(5, 8)
      expect(command.isExecuted()).toBe(false)
    })

    it('should not undo if not executed', () => {
      const command = new DeleteTextCommand(5, 8, mockContext)
      
      const result = command.undo()
      
      expect(result).toBe(false)
      expect(updateTextSpy).not.toHaveBeenCalled()
    })

    it('should work without setSelection callback', () => {
      const contextWithoutSelection = {
        ...mockContext,
        setSelection: undefined
      }
      const command = new DeleteTextCommand(5, 8, contextWithoutSelection)
      
      command.execute()
      const result = command.undo()
      
      expect(result).toBe(true)
      expect(setCursorPositionSpy).toHaveBeenLastCalledWith(8)
    })

    it('should work without any cursor callbacks', () => {
      const contextWithoutCallbacks = {
        ...mockContext,
        setCursorPosition: undefined,
        setSelection: undefined
      }
      const command = new DeleteTextCommand(5, 8, contextWithoutCallbacks)
      
      command.execute()
      const result = command.undo()
      
      expect(result).toBe(true)
      expect(updateTextSpy).toHaveBeenLastCalledWith('Hello World!')
    })

    it('should handle undo errors gracefully', () => {
      const command = new DeleteTextCommand(5, 8, mockContext)
      command.execute()
      
      updateTextSpy.mockImplementation(() => {
        throw new Error('Undo failed')
      })
      
      const result = command.undo()
      
      expect(result).toBe(false)
      expect(command.isExecuted()).toBe(true) // Should remain executed on error
    })
  })

  describe('CanUndo Method', () => {
    it('should return false before execution', () => {
      const command = new DeleteTextCommand(5, 8, mockContext)
      
      expect(command.canUndo()).toBe(false)
    })

    it('should return true after execution', () => {
      const command = new DeleteTextCommand(5, 8, mockContext)
      command.execute()
      
      expect(command.canUndo()).toBe(true)
    })

    it('should return false after undo', () => {
      const command = new DeleteTextCommand(5, 8, mockContext)
      command.execute()
      command.undo()
      
      expect(command.canUndo()).toBe(false)
    })
  })

  describe('GetDescription Method', () => {
    it('should return correct description for short text', () => {
      const command = new DeleteTextCommand(5, 8, mockContext)
      command.execute()
      
      const description = command.getDescription()
      
      expect(description).toBe('テキスト削除: " Wo" (3文字) from 5-8')
    })

    it('should truncate long text in description', () => {
      mockContext.currentText = 'This is a very long text that should be truncated for description'
      const command = new DeleteTextCommand(10, 50, mockContext)
      command.execute()
      
      const description = command.getDescription()
      
      expect(description).toContain('...')
      expect(description).toContain('from 10-50')
    })

    it('should handle empty deletion in description', () => {
      const command = new DeleteTextCommand(5, 5, mockContext)
      command.execute()
      
      const description = command.getDescription()
      
      expect(description).toContain('(0文字)')
    })

    it('should show description before execution', () => {
      const command = new DeleteTextCommand(5, 8, mockContext)
      
      const description = command.getDescription()
      
      expect(description).toContain('from 5-8')
      expect(description).toContain('(3文字)')
    })
  })

  describe('Utility Methods', () => {
    it('should return correct deleted length', () => {
      const command1 = new DeleteTextCommand(5, 8, mockContext)
      const command2 = new DeleteTextCommand(0, 12, mockContext)
      const command3 = new DeleteTextCommand(5, 5, mockContext)
      
      expect(command1.getDeletedLength()).toBe(3)
      expect(command2.getDeletedLength()).toBe(12)
      expect(command3.getDeletedLength()).toBe(0)
    })

    it('should return correct deleted text after execution', () => {
      const command = new DeleteTextCommand(5, 8, mockContext)
      
      expect(command.getDeletedText()).toBe('') // Before execution
      
      command.execute()
      
      expect(command.getDeletedText()).toBe(' Wo') // After execution
    })
  })

  describe('Execute-Undo Cycle', () => {
    it('should handle multiple execute-undo cycles', () => {
      const command = new DeleteTextCommand(5, 8, mockContext)
      
      // First cycle
      expect(command.execute()).toBe(true)
      expect(command.canUndo()).toBe(true)
      expect(command.undo()).toBe(true)
      expect(command.canUndo()).toBe(false)
      
      // Second cycle
      expect(command.execute()).toBe(true)
      expect(command.canUndo()).toBe(true)
      expect(command.undo()).toBe(true)
      expect(command.canUndo()).toBe(false)
    })

    it('should maintain state consistency through cycles', () => {
      const command = new DeleteTextCommand(6, 11, mockContext)
      
      command.execute()
      expect(updateTextSpy).toHaveBeenCalledWith('Hello !')
      
      command.undo()
      expect(updateTextSpy).toHaveBeenLastCalledWith('Hello World!')
      
      command.execute()
      expect(updateTextSpy).toHaveBeenLastCalledWith('Hello !')
    })

    it('should preserve deleted text across cycles', () => {
      const command = new DeleteTextCommand(5, 8, mockContext)
      
      command.execute()
      const firstDeletedText = command.getDeletedText()
      
      command.undo()
      command.execute()
      const secondDeletedText = command.getDeletedText()
      
      expect(firstDeletedText).toBe(secondDeletedText)
      expect(firstDeletedText).toBe(' Wo')
    })
  })
})