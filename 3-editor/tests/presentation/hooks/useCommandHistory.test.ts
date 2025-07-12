import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCommandHistory } from '../../../src/presentation/hooks/useCommandHistory'

describe('useCommandHistory', () => {
  beforeEach(() => {
    // キーボードイベントのモック
    Object.defineProperty(document, 'addEventListener', {
      value: vi.fn(),
      writable: true
    })
    
    Object.defineProperty(document, 'removeEventListener', {
      value: vi.fn(),
      writable: true
    })
  })

  describe('Initial State', () => {
    it('should initialize with empty text by default', () => {
      const { result } = renderHook(() => useCommandHistory())
      
      expect(result.current.text).toBe('')
      expect(result.current.canUndo).toBe(false)
      expect(result.current.canRedo).toBe(false)
      expect(result.current.historyStats.totalCommands).toBe(0)
    })

    it('should initialize with provided initial text', () => {
      const initialText = 'Hello World'
      const { result } = renderHook(() => useCommandHistory({ initialText }))
      
      expect(result.current.text).toBe(initialText)
    })

    it('should initialize with custom config', () => {
      const config = { maxHistorySize: 50 }
      const { result } = renderHook(() => useCommandHistory({ config }))
      
      expect(result.current.historyStats).toBeDefined()
    })
  })

  describe('Text Insertion', () => {
    it('should insert text at specified position', () => {
      const { result } = renderHook(() => useCommandHistory({ initialText: 'Hello World' }))
      
      act(() => {
        const success = result.current.insertText('Beautiful ', 6)
        expect(success).toBe(true)
      })
      
      expect(result.current.text).toBe('Hello Beautiful World')
      expect(result.current.canUndo).toBe(true)
      expect(result.current.historyStats.totalCommands).toBe(1)
    })

    it('should insert text at beginning', () => {
      const { result } = renderHook(() => useCommandHistory({ initialText: 'World' }))
      
      act(() => {
        result.current.insertText('Hello ', 0)
      })
      
      expect(result.current.text).toBe('Hello World')
    })

    it('should insert text at end', () => {
      const { result } = renderHook(() => useCommandHistory({ initialText: 'Hello' }))
      
      act(() => {
        result.current.insertText(' World', 5)
      })
      
      expect(result.current.text).toBe('Hello World')
    })

    it('should handle multiple insertions', () => {
      const { result } = renderHook(() => useCommandHistory())
      
      act(() => {
        result.current.insertText('Hello', 0)
        result.current.insertText(' ', 5)
        result.current.insertText('World', 6)
      })
      
      expect(result.current.text).toBe('Hello World')
      expect(result.current.historyStats.totalCommands).toBe(3)
    })
  })

  describe('Text Deletion', () => {
    it('should delete text in specified range', () => {
      const { result } = renderHook(() => useCommandHistory({ initialText: 'Hello Beautiful World' }))
      
      act(() => {
        const success = result.current.deleteText(6, 16)
        expect(success).toBe(true)
      })
      
      expect(result.current.text).toBe('Hello World')
      expect(result.current.canUndo).toBe(true)
    })

    it('should handle single character deletion', () => {
      const { result } = renderHook(() => useCommandHistory({ initialText: 'Hello' }))
      
      act(() => {
        result.current.deleteText(4, 5)
      })
      
      expect(result.current.text).toBe('Hell')
    })

    it('should handle deletion at beginning', () => {
      const { result } = renderHook(() => useCommandHistory({ initialText: 'Hello World' }))
      
      act(() => {
        result.current.deleteText(0, 6)
      })
      
      expect(result.current.text).toBe('World')
    })

    it('should handle deletion at end', () => {
      const { result } = renderHook(() => useCommandHistory({ initialText: 'Hello World' }))
      
      act(() => {
        result.current.deleteText(5, 11)
      })
      
      expect(result.current.text).toBe('Hello')
    })
  })

  describe('Text Replacement', () => {
    it('should replace text in specified range', () => {
      const { result } = renderHook(() => useCommandHistory({ initialText: 'Hello World' }))
      
      act(() => {
        const success = result.current.replaceText('Universe', 6, 11)
        expect(success).toBe(true)
      })
      
      expect(result.current.text).toBe('Hello Universe')
      expect(result.current.canUndo).toBe(true)
    })

    it('should replace with shorter text', () => {
      const { result } = renderHook(() => useCommandHistory({ initialText: 'Hello Beautiful World' }))
      
      act(() => {
        result.current.replaceText('Big', 6, 15)
      })
      
      expect(result.current.text).toBe('Hello Big World')
    })

    it('should replace with longer text', () => {
      const { result } = renderHook(() => useCommandHistory({ initialText: 'Hello World' }))
      
      act(() => {
        result.current.replaceText('Amazing Universe', 6, 11)
      })
      
      expect(result.current.text).toBe('Hello Amazing Universe')
    })

    it('should replace entire text', () => {
      const { result } = renderHook(() => useCommandHistory({ initialText: 'Hello World' }))
      
      act(() => {
        result.current.replaceText('Goodbye', 0, 11)
      })
      
      expect(result.current.text).toBe('Goodbye')
    })
  })

  describe('Undo Functionality', () => {
    it('should undo single insertion', () => {
      const { result } = renderHook(() => useCommandHistory({ initialText: 'Hello' }))
      
      act(() => {
        result.current.insertText(' World', 5)
      })
      
      expect(result.current.text).toBe('Hello World')
      
      act(() => {
        const success = result.current.undo()
        expect(success).toBe(true)
      })
      
      expect(result.current.text).toBe('Hello')
      expect(result.current.canUndo).toBe(false)
      expect(result.current.canRedo).toBe(true)
    })

    it('should undo multiple operations in reverse order', () => {
      const { result } = renderHook(() => useCommandHistory())
      
      act(() => {
        result.current.insertText('Hello', 0)
        result.current.insertText(' World', 5)
        result.current.insertText('!', 11)
      })
      
      expect(result.current.text).toBe('Hello World!')
      
      act(() => {
        result.current.undo() // Undo '!'
      })
      expect(result.current.text).toBe('Hello World')
      
      act(() => {
        result.current.undo() // Undo ' World'
      })
      expect(result.current.text).toBe('Hello')
      
      act(() => {
        result.current.undo() // Undo 'Hello'
      })
      expect(result.current.text).toBe('')
    })

    it('should return false when no undo available', () => {
      const { result } = renderHook(() => useCommandHistory())
      
      act(() => {
        const success = result.current.undo()
        expect(success).toBe(false)
      })
    })
  })

  describe('Redo Functionality', () => {
    it('should redo undone operation', () => {
      const { result } = renderHook(() => useCommandHistory({ initialText: 'Hello' }))
      
      act(() => {
        result.current.insertText(' World', 5)
        result.current.undo()
      })
      
      expect(result.current.text).toBe('Hello')
      expect(result.current.canRedo).toBe(true)
      
      act(() => {
        const success = result.current.redo()
        expect(success).toBe(true)
      })
      
      expect(result.current.text).toBe('Hello World')
      expect(result.current.canRedo).toBe(false)
    })

    it('should redo multiple operations in order', () => {
      const { result } = renderHook(() => useCommandHistory())
      
      act(() => {
        result.current.insertText('Hello', 0)
        result.current.insertText(' World', 5)
        result.current.undo()
        result.current.undo()
      })
      
      expect(result.current.text).toBe('')
      
      act(() => {
        result.current.redo()
      })
      expect(result.current.text).toBe('Hello')
      
      act(() => {
        result.current.redo()
      })
      expect(result.current.text).toBe('Hello World')
    })

    it('should return false when no redo available', () => {
      const { result } = renderHook(() => useCommandHistory())
      
      act(() => {
        const success = result.current.redo()
        expect(success).toBe(false)
      })
    })

    it('should clear redo history when new operation performed', () => {
      const { result } = renderHook(() => useCommandHistory())
      
      act(() => {
        result.current.insertText('Hello', 0)
        result.current.insertText(' World', 5)
        result.current.undo()
      })
      
      expect(result.current.canRedo).toBe(true)
      
      act(() => {
        result.current.insertText(' Universe', 5)
      })
      
      expect(result.current.canRedo).toBe(false)
      expect(result.current.text).toBe('Hello Universe')
    })
  })

  describe('History Management', () => {
    it('should clear all history', () => {
      const { result } = renderHook(() => useCommandHistory())
      
      act(() => {
        result.current.insertText('Hello', 0)
        result.current.insertText(' World', 5)
      })
      
      expect(result.current.historyStats.totalCommands).toBe(2)
      
      act(() => {
        result.current.clearHistory()
      })
      
      expect(result.current.historyStats.totalCommands).toBe(0)
      expect(result.current.canUndo).toBe(false)
      expect(result.current.canRedo).toBe(false)
    })

    it('should provide history list', () => {
      const { result } = renderHook(() => useCommandHistory())
      
      act(() => {
        result.current.insertText('Hello', 0)
        result.current.insertText(' World', 5)
      })
      
      const historyList = result.current.historyList
      expect(historyList).toHaveLength(2)
      expect(historyList[0].description).toContain('Hello')
      expect(historyList[1].description).toContain(' World')
    })

    it('should jump to specific history point', () => {
      const { result } = renderHook(() => useCommandHistory())
      
      act(() => {
        result.current.insertText('Hello', 0)
        result.current.insertText(' World', 5)
        result.current.insertText('!', 11)
      })
      
      expect(result.current.text).toBe('Hello World!')
      
      act(() => {
        const success = result.current.jumpToHistoryPoint(0)
        expect(success).toBe(true)
      })
      
      expect(result.current.text).toBe('Hello')
      expect(result.current.historyStats.currentPosition).toBe(1)
    })

    it('should handle invalid history point', () => {
      const { result } = renderHook(() => useCommandHistory())
      
      act(() => {
        result.current.insertText('Hello', 0)
      })
      
      act(() => {
        const success = result.current.jumpToHistoryPoint(10)
        expect(success).toBe(false)
      })
    })
  })

  describe('History Statistics', () => {
    it('should provide accurate history statistics', () => {
      const { result } = renderHook(() => useCommandHistory())
      
      act(() => {
        result.current.insertText('Hello', 0)
        result.current.insertText(' World', 5)
      })
      
      const stats = result.current.historyStats
      expect(stats.totalCommands).toBe(2)
      expect(stats.currentPosition).toBe(2)
      expect(stats.canUndo).toBe(true)
      expect(stats.canRedo).toBe(false)
      expect(stats.memoryUsage).toBeGreaterThan(0)
    })

    it('should update statistics after undo', () => {
      const { result } = renderHook(() => useCommandHistory())
      
      act(() => {
        result.current.insertText('Hello', 0)
        result.current.undo()
      })
      
      const stats = result.current.historyStats
      expect(stats.currentPosition).toBe(0)
      expect(stats.canUndo).toBe(false)
      expect(stats.canRedo).toBe(true)
    })
  })

  describe('Text Setting', () => {
    it('should set text directly', () => {
      const { result } = renderHook(() => useCommandHistory())
      
      act(() => {
        result.current.setText('Direct text setting')
      })
      
      expect(result.current.text).toBe('Direct text setting')
      // Direct text setting should not create history
      expect(result.current.canUndo).toBe(false)
    })

    it('should update text without affecting history', () => {
      const { result } = renderHook(() => useCommandHistory())
      
      act(() => {
        result.current.insertText('Hello', 0)
        result.current.setText('New text')
      })
      
      expect(result.current.text).toBe('New text')
      expect(result.current.historyStats.totalCommands).toBe(1) // Only the insert command
    })
  })

  describe('Configuration', () => {
    it('should respect max history size', () => {
      const { result } = renderHook(() => 
        useCommandHistory({ config: { maxHistorySize: 2 } })
      )
      
      act(() => {
        result.current.insertText('1', 0)
        result.current.insertText('2', 1)
        result.current.insertText('3', 2)
      })
      
      expect(result.current.historyStats.totalCommands).toBe(2)
    })

    it('should handle auto-save configuration', () => {
      const { result } = renderHook(() => 
        useCommandHistory({ enableAutoSave: true, config: { autoSaveInterval: 1000 } })
      )
      
      expect(result.current).toBeDefined()
      // Auto-save functionality would be tested with timers in integration tests
    })
  })

  describe('Error Handling', () => {
    it('should handle insertion at invalid position gracefully', () => {
      const { result } = renderHook(() => useCommandHistory({ initialText: 'Hello' }))
      
      act(() => {
        const success = result.current.insertText('test', 100)
        expect(success).toBe(true) // Should handle out-of-bounds gracefully
      })
      
      expect(result.current.text).toContain('test')
    })

    it('should handle deletion with invalid range gracefully', () => {
      const { result } = renderHook(() => useCommandHistory({ initialText: 'Hello' }))
      
      act(() => {
        const success = result.current.deleteText(10, 20)
        expect(success).toBe(true) // Should handle out-of-bounds gracefully
      })
    })

    it('should handle replacement with invalid range gracefully', () => {
      const { result } = renderHook(() => useCommandHistory({ initialText: 'Hello' }))
      
      act(() => {
        const success = result.current.replaceText('test', 10, 20)
        expect(success).toBe(true) // Should handle out-of-bounds gracefully
      })
    })
  })
})