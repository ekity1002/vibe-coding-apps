import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ReplaceTextCommand } from '../../../../src/domain/command/commands/ReplaceTextCommand'
import { CommandContext, TEXT_COMMAND_TYPES } from '../../../../src/domain/command/types/Command'

describe('ReplaceTextCommand', () => {
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
      const command = new ReplaceTextCommand('New Text', 5, 8, mockContext)
      
      expect(command.type).toBe(TEXT_COMMAND_TYPES.REPLACE)
      expect(command.position.start).toBe(5)
      expect(command.position.end).toBe(8)
      expect(command.getNewText()).toBe('New Text')
      expect(command.getReplaceRange()).toEqual({ start: 5, end: 8 })
      expect(command.isExecuted()).toBe(false)
    })

    it('should handle reversed start/end positions', () => {
      const command = new ReplaceTextCommand('Replacement', 8, 5, mockContext)
      
      expect(command.position.start).toBe(5)
      expect(command.position.end).toBe(8)
      expect(command.getReplaceRange()).toEqual({ start: 5, end: 8 })
    })

    it('should handle empty replacement text', () => {
      const command = new ReplaceTextCommand('', 5, 8, mockContext)
      
      expect(command.getNewText()).toBe('')
      
      // execute()後に正しい長さ変化が計算される
      command.execute()
      expect(command.getLengthChange()).toBe(-3) // Removing 3 characters
    })

    it('should handle zero-length selection', () => {
      const command = new ReplaceTextCommand('Insert', 5, 5, mockContext)
      
      expect(command.position.start).toBe(5)
      expect(command.position.end).toBe(5)
      expect(command.getLengthChange()).toBe(6) // Adding 6 characters
    })
  })

  describe('Execute Method', () => {
    it('should execute text replacement correctly', () => {
      const command = new ReplaceTextCommand('New', 6, 11, mockContext)
      
      const result = command.execute()
      
      expect(result).toBe(true)
      expect(updateTextSpy).toHaveBeenCalledWith('Hello New!')
      expect(setCursorPositionSpy).toHaveBeenCalledWith(9) // 6 + 3
      expect(command.getOriginalText()).toBe('World')
      expect(command.isExecuted()).toBe(true)
    })

    it('should replace at the beginning of text', () => {
      const command = new ReplaceTextCommand('Hi', 0, 5, mockContext)
      
      command.execute()
      
      expect(updateTextSpy).toHaveBeenCalledWith('Hi World!')
      expect(setCursorPositionSpy).toHaveBeenCalledWith(2)
      expect(command.getOriginalText()).toBe('Hello')
    })

    it('should replace at the end of text', () => {
      const command = new ReplaceTextCommand('Earth?', 6, 12, mockContext)
      
      command.execute()
      
      expect(updateTextSpy).toHaveBeenCalledWith('Hello Earth?')
      expect(setCursorPositionSpy).toHaveBeenCalledWith(12)
      expect(command.getOriginalText()).toBe('World!')
    })

    it('should replace entire text', () => {
      const command = new ReplaceTextCommand('Goodbye!', 0, 12, mockContext)
      
      command.execute()
      
      expect(updateTextSpy).toHaveBeenCalledWith('Goodbye!')
      expect(setCursorPositionSpy).toHaveBeenCalledWith(8)
      expect(command.getOriginalText()).toBe('Hello World!')
    })

    it('should handle insertion (zero-length replacement)', () => {
      const command = new ReplaceTextCommand('Amazing ', 6, 6, mockContext)
      
      command.execute()
      
      expect(updateTextSpy).toHaveBeenCalledWith('Hello Amazing World!')
      expect(setCursorPositionSpy).toHaveBeenCalledWith(14)
      expect(command.getOriginalText()).toBe('')
    })

    it('should handle deletion (empty replacement)', () => {
      const command = new ReplaceTextCommand('', 5, 11, mockContext)
      
      command.execute()
      
      expect(updateTextSpy).toHaveBeenCalledWith('Hello!')
      expect(setCursorPositionSpy).toHaveBeenCalledWith(5)
      expect(command.getOriginalText()).toBe(' World')
    })

    it('should handle multiline text replacement', () => {
      mockContext.currentText = 'Line1\nLine2\nLine3'
      const command = new ReplaceTextCommand('NewLine', 6, 11, mockContext)
      
      command.execute()
      
      expect(updateTextSpy).toHaveBeenCalledWith('Line1\nNewLine\nLine3')
      expect(command.getOriginalText()).toBe('Line2')
    })

    it('should handle special characters replacement', () => {
      mockContext.currentText = 'Hello 🚀 World'
      const command = new ReplaceTextCommand('🌟💻🎯', 6, 8, mockContext)
      
      command.execute()
      
      expect(updateTextSpy).toHaveBeenCalledWith('Hello 🌟💻🎯 World')
      expect(command.getOriginalText()).toBe('🚀')
    })

    it('should work without setCursorPosition callback', () => {
      const contextWithoutCursor = {
        ...mockContext,
        setCursorPosition: undefined
      }
      const command = new ReplaceTextCommand('Test', 6, 11, contextWithoutCursor)
      
      const result = command.execute()
      
      expect(result).toBe(true)
      expect(updateTextSpy).toHaveBeenCalled()
    })

    it('should handle execution errors gracefully', () => {
      updateTextSpy.mockImplementation(() => {
        throw new Error('Update failed')
      })
      
      const command = new ReplaceTextCommand('Test', 6, 11, mockContext)
      const result = command.execute()
      
      expect(result).toBe(false)
      expect(command.isExecuted()).toBe(false)
    })

    it('should handle out of bounds replacement', () => {
      const command = new ReplaceTextCommand('End', 10, 20, mockContext)
      
      command.execute()
      
      expect(updateTextSpy).toHaveBeenCalledWith('Hello WorlEnd')
      expect(command.getOriginalText()).toBe('d!')
    })
  })

  describe('Undo Method', () => {
    it('should undo text replacement correctly', () => {
      const command = new ReplaceTextCommand('New', 6, 11, mockContext)
      
      // Execute first
      command.execute()
      expect(command.isExecuted()).toBe(true)
      
      // Then undo
      const result = command.undo()
      
      expect(result).toBe(true)
      expect(updateTextSpy).toHaveBeenLastCalledWith('Hello World!')
      expect(setSelectionSpy).toHaveBeenCalledWith(6, 11)
      expect(command.isExecuted()).toBe(false)
    })

    it('should not undo if not executed', () => {
      const command = new ReplaceTextCommand('Test', 6, 11, mockContext)
      
      const result = command.undo()
      
      expect(result).toBe(false)
      expect(updateTextSpy).not.toHaveBeenCalled()
    })

    it('should work without setSelection callback', () => {
      const contextWithoutSelection = {
        ...mockContext,
        setSelection: undefined
      }
      const command = new ReplaceTextCommand('Test', 6, 11, contextWithoutSelection)
      
      command.execute()
      const result = command.undo()
      
      expect(result).toBe(true)
      expect(setCursorPositionSpy).toHaveBeenLastCalledWith(11)
    })

    it('should work without any cursor callbacks', () => {
      const contextWithoutCallbacks = {
        ...mockContext,
        setCursorPosition: undefined,
        setSelection: undefined
      }
      const command = new ReplaceTextCommand('Test', 6, 11, contextWithoutCallbacks)
      
      command.execute()
      const result = command.undo()
      
      expect(result).toBe(true)
      expect(updateTextSpy).toHaveBeenLastCalledWith('Hello World!')
    })

    it('should handle undo errors gracefully', () => {
      const command = new ReplaceTextCommand('Test', 6, 11, mockContext)
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
      const command = new ReplaceTextCommand('Test', 6, 11, mockContext)
      
      expect(command.canUndo()).toBe(false)
    })

    it('should return true after execution', () => {
      const command = new ReplaceTextCommand('Test', 6, 11, mockContext)
      command.execute()
      
      expect(command.canUndo()).toBe(true)
    })

    it('should return false after undo', () => {
      const command = new ReplaceTextCommand('Test', 6, 11, mockContext)
      command.execute()
      command.undo()
      
      expect(command.canUndo()).toBe(false)
    })
  })

  describe('GetDescription Method', () => {
    it('should return correct description for short text', () => {
      const command = new ReplaceTextCommand('New', 6, 11, mockContext)
      command.execute()
      
      const description = command.getDescription()
      
      expect(description).toBe('テキスト置換: "World" → "New" at 6-11')
    })

    it('should truncate long text in description', () => {
      const longOriginal = 'This is a very long original text'
      const longReplacement = 'This is a very long replacement text'
      mockContext.currentText = `Hello ${longOriginal} World`
      
      const command = new ReplaceTextCommand(longReplacement, 6, 6 + longOriginal.length, mockContext)
      command.execute()
      
      const description = command.getDescription()
      
      expect(description).toContain('...')
      expect(description).toContain('at 6-39')
    })

    it('should handle empty replacement in description', () => {
      const command = new ReplaceTextCommand('', 6, 11, mockContext)
      command.execute()
      
      const description = command.getDescription()
      
      expect(description).toContain('"World" → ""')
    })

    it('should handle empty original in description', () => {
      const command = new ReplaceTextCommand('Inserted', 6, 6, mockContext)
      command.execute()
      
      const description = command.getDescription()
      
      expect(description).toContain('"" → "Inserted"')
    })

    it('should show description before execution', () => {
      const command = new ReplaceTextCommand('New', 6, 11, mockContext)
      
      const description = command.getDescription()
      
      expect(description).toContain('at 6-11')
      expect(description).toContain('"" → "New"') // originalText is empty before execution
    })
  })

  describe('Utility Methods', () => {
    it('should return correct length change', () => {
      const command1 = new ReplaceTextCommand('New', 6, 11, mockContext) // 5 chars → 3 chars = -2
      const command2 = new ReplaceTextCommand('Extended World', 6, 11, mockContext) // 5 chars → 14 chars = +9
      const command3 = new ReplaceTextCommand('World', 6, 11, mockContext) // 5 chars → 5 chars = 0
      
      command1.execute()
      command2.execute()
      command3.execute()
      
      expect(command1.getLengthChange()).toBe(-2)
      expect(command2.getLengthChange()).toBe(9)
      expect(command3.getLengthChange()).toBe(0)
    })

    it('should return correct original text after execution', () => {
      const command = new ReplaceTextCommand('New', 6, 11, mockContext)
      
      expect(command.getOriginalText()).toBe('') // Before execution
      
      command.execute()
      
      expect(command.getOriginalText()).toBe('World') // After execution
    })

    it('should return correct new text', () => {
      const command = new ReplaceTextCommand('Amazing', 6, 11, mockContext)
      
      expect(command.getNewText()).toBe('Amazing')
      
      command.execute()
      
      expect(command.getNewText()).toBe('Amazing') // Should remain the same
    })

    it('should return correct replace range', () => {
      const command = new ReplaceTextCommand('Test', 3, 8, mockContext)
      
      const range = command.getReplaceRange()
      
      expect(range).toEqual({ start: 3, end: 8 })
    })
  })

  describe('Execute-Undo Cycle', () => {
    it('should handle multiple execute-undo cycles', () => {
      const command = new ReplaceTextCommand('New', 6, 11, mockContext)
      
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
      const command = new ReplaceTextCommand('Amazing', 6, 11, mockContext)
      
      command.execute()
      expect(updateTextSpy).toHaveBeenCalledWith('Hello Amazing!')
      
      command.undo()
      expect(updateTextSpy).toHaveBeenLastCalledWith('Hello World!')
      
      command.execute()
      expect(updateTextSpy).toHaveBeenLastCalledWith('Hello Amazing!')
    })

    it('should preserve original text across cycles', () => {
      const command = new ReplaceTextCommand('New', 6, 11, mockContext)
      
      command.execute()
      const firstOriginalText = command.getOriginalText()
      
      command.undo()
      command.execute()
      const secondOriginalText = command.getOriginalText()
      
      expect(firstOriginalText).toBe(secondOriginalText)
      expect(firstOriginalText).toBe('World')
    })
  })

  describe('Edge Cases', () => {
    it('should handle replacement with same text', () => {
      const command = new ReplaceTextCommand('World', 6, 11, mockContext)
      
      command.execute()
      
      expect(updateTextSpy).toHaveBeenCalledWith('Hello World!')
      expect(command.getLengthChange()).toBe(0)
    })

    it('should handle unicode replacement', () => {
      mockContext.currentText = 'Hello 世界!'
      const command = new ReplaceTextCommand('🌍', 6, 8, mockContext)
      
      command.execute()
      
      expect(updateTextSpy).toHaveBeenCalledWith('Hello 🌍!')
      expect(command.getOriginalText()).toBe('世界')
    })

    it('should handle very long replacement', () => {
      const longText = 'A'.repeat(1000)
      const command = new ReplaceTextCommand(longText, 6, 11, mockContext)
      
      command.execute()
      
      expect(command.getLengthChange()).toBe(995) // 1000 - 5
      expect(command.getNewText()).toBe(longText)
    })
  })
})