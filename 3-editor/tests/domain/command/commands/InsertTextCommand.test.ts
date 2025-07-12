import { describe, it, expect, beforeEach, vi } from 'vitest'
import { InsertTextCommand } from '../../../../src/domain/command/commands/InsertTextCommand'
import { CommandContext, TEXT_COMMAND_TYPES } from '../../../../src/domain/command/types/Command'

describe('InsertTextCommand', () => {
  let mockContext: CommandContext
  let updateTextSpy: ReturnType<typeof vi.fn>
  let setCursorPositionSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    updateTextSpy = vi.fn()
    setCursorPositionSpy = vi.fn()
    
    mockContext = {
      currentText: 'Hello World',
      updateText: updateTextSpy,
      setCursorPosition: setCursorPositionSpy,
      setSelection: vi.fn()
    }
  })

  describe('Constructor and Basic Properties', () => {
    it('should initialize with correct properties', () => {
      const command = new InsertTextCommand('test', 5, mockContext)
      
      expect(command.type).toBe(TEXT_COMMAND_TYPES.INSERT)
      expect(command.position.start).toBe(5)
      expect(command.position.end).toBe(5)
      expect(command.getInsertedText()).toBe('test')
      expect(command.getInsertPosition()).toBe(5)
      expect(command.isExecuted()).toBe(false)
    })

    it('should handle empty text insertion', () => {
      const command = new InsertTextCommand('', 0, mockContext)
      
      expect(command.getInsertedText()).toBe('')
      expect(command.getDescription()).toContain('テキスト挿入: ""')
    })

    it('should handle insertion at different positions', () => {
      const command1 = new InsertTextCommand('start', 0, mockContext)
      const command2 = new InsertTextCommand('end', 11, mockContext)
      
      expect(command1.getInsertPosition()).toBe(0)
      expect(command2.getInsertPosition()).toBe(11)
    })
  })

  describe('Execute Method', () => {
    it('should execute text insertion correctly', () => {
      const command = new InsertTextCommand('XYZ', 5, mockContext)
      
      const result = command.execute()
      
      expect(result).toBe(true)
      expect(updateTextSpy).toHaveBeenCalledWith('HelloXYZ World')
      expect(setCursorPositionSpy).toHaveBeenCalledWith(8) // 5 + 3
      expect(command.isExecuted()).toBe(true)
    })

    it('should insert at the beginning of text', () => {
      const command = new InsertTextCommand('Start ', 0, mockContext)
      
      command.execute()
      
      expect(updateTextSpy).toHaveBeenCalledWith('Start Hello World')
      expect(setCursorPositionSpy).toHaveBeenCalledWith(6)
    })

    it('should insert at the end of text', () => {
      const command = new InsertTextCommand(' End', 11, mockContext)
      
      command.execute()
      
      expect(updateTextSpy).toHaveBeenCalledWith('Hello World End')
      expect(setCursorPositionSpy).toHaveBeenCalledWith(15)
    })

    it('should handle multiline text insertion', () => {
      const command = new InsertTextCommand('\nNew Line', 5, mockContext)
      
      command.execute()
      
      expect(updateTextSpy).toHaveBeenCalledWith('Hello\nNew Line World')
    })

    it('should handle special characters insertion', () => {
      const command = new InsertTextCommand('🚀🌟💻', 5, mockContext)
      
      command.execute()
      
      expect(updateTextSpy).toHaveBeenCalledWith('Hello🚀🌟💻 World')
    })

    it('should work without setCursorPosition callback', () => {
      const contextWithoutCursor = {
        ...mockContext,
        setCursorPosition: undefined
      }
      const command = new InsertTextCommand('test', 5, contextWithoutCursor)
      
      const result = command.execute()
      
      expect(result).toBe(true)
      expect(updateTextSpy).toHaveBeenCalled()
    })

    it('should handle execution errors gracefully', () => {
      updateTextSpy.mockImplementation(() => {
        throw new Error('Update failed')
      })
      
      const command = new InsertTextCommand('test', 5, mockContext)
      const result = command.execute()
      
      expect(result).toBe(false)
      expect(command.isExecuted()).toBe(false)
    })
  })

  describe('Undo Method', () => {
    it('should undo text insertion correctly', () => {
      const command = new InsertTextCommand('XYZ', 5, mockContext)
      
      // Execute first
      command.execute()
      expect(command.isExecuted()).toBe(true)
      
      // Then undo
      const result = command.undo()
      
      expect(result).toBe(true)
      expect(updateTextSpy).toHaveBeenLastCalledWith('Hello World')
      expect(setCursorPositionSpy).toHaveBeenLastCalledWith(5)
      expect(command.isExecuted()).toBe(false)
    })

    it('should not undo if not executed', () => {
      const command = new InsertTextCommand('test', 5, mockContext)
      
      const result = command.undo()
      
      expect(result).toBe(false)
      expect(updateTextSpy).not.toHaveBeenCalled()
    })

    it('should work without setCursorPosition callback', () => {
      const contextWithoutCursor = {
        ...mockContext,
        setCursorPosition: undefined
      }
      const command = new InsertTextCommand('test', 5, contextWithoutCursor)
      
      command.execute()
      const result = command.undo()
      
      expect(result).toBe(true)
    })

    it('should handle undo errors gracefully', () => {
      const command = new InsertTextCommand('test', 5, mockContext)
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
      const command = new InsertTextCommand('test', 5, mockContext)
      
      expect(command.canUndo()).toBe(false)
    })

    it('should return true after execution', () => {
      const command = new InsertTextCommand('test', 5, mockContext)
      command.execute()
      
      expect(command.canUndo()).toBe(true)
    })

    it('should return false after undo', () => {
      const command = new InsertTextCommand('test', 5, mockContext)
      command.execute()
      command.undo()
      
      expect(command.canUndo()).toBe(false)
    })
  })

  describe('GetDescription Method', () => {
    it('should return correct description for short text', () => {
      const command = new InsertTextCommand('Hello', 5, mockContext)
      
      const description = command.getDescription()
      
      expect(description).toBe('テキスト挿入: "Hello" at position 5')
    })

    it('should truncate long text in description', () => {
      const longText = 'This is a very long text that should be truncated'
      const command = new InsertTextCommand(longText, 10, mockContext)
      
      const description = command.getDescription()
      
      expect(description).toContain('...')
      expect(description).toContain('at position 10')
    })

    it('should handle special characters in description', () => {
      const command = new InsertTextCommand('🚀🌟💻', 0, mockContext)
      
      const description = command.getDescription()
      
      expect(description).toContain('🚀🌟💻')
    })
  })

  describe('Execute-Undo Cycle', () => {
    it('should handle multiple execute-undo cycles', () => {
      const command = new InsertTextCommand('test', 5, mockContext)
      
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
      const command = new InsertTextCommand('consistent', 3, mockContext)
      
      command.execute()
      expect(updateTextSpy).toHaveBeenCalledWith('Helconsistentlo World')
      
      command.undo()
      expect(updateTextSpy).toHaveBeenLastCalledWith('Hello World')
      
      command.execute()
      expect(updateTextSpy).toHaveBeenLastCalledWith('Helconsistentlo World')
    })
  })
})