import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CommandService } from '../../../src/application/services/CommandService'
import { ICommand } from '../../../src/domain/command/types/Command'

describe('CommandService', () => {
  let commandService: CommandService
  let mockCommand1: ICommand
  let mockCommand2: ICommand
  let mockCommand3: ICommand

  beforeEach(() => {
    commandService = new CommandService()
    
    // Create mock commands
    mockCommand1 = {
      execute: vi.fn().mockReturnValue(true),
      undo: vi.fn().mockReturnValue(true),
      canUndo: vi.fn().mockReturnValue(true),
      getDescription: vi.fn().mockReturnValue('Mock Command 1')
    }
    
    mockCommand2 = {
      execute: vi.fn().mockReturnValue(true),
      undo: vi.fn().mockReturnValue(true),
      canUndo: vi.fn().mockReturnValue(true),
      getDescription: vi.fn().mockReturnValue('Mock Command 2')
    }
    
    mockCommand3 = {
      execute: vi.fn().mockReturnValue(true),
      undo: vi.fn().mockReturnValue(true),
      canUndo: vi.fn().mockReturnValue(true),
      getDescription: vi.fn().mockReturnValue('Mock Command 3')
    }
  })

  describe('Constructor and Initial State', () => {
    it('should initialize with empty history', () => {
      const stats = commandService.getHistoryStats()
      
      expect(stats.totalCommands).toBe(0)
      expect(stats.currentPosition).toBe(0)
      expect(stats.canUndo).toBe(false)
      expect(stats.canRedo).toBe(false)
    })

    it('should initialize with default config', () => {
      const config = commandService.getConfig()
      
      expect(config.maxHistorySize).toBe(100)
      expect(config.autoSaveInterval).toBe(0)
      expect(config.enableMemoryOptimization).toBe(true)
    })

    it('should initialize with custom config', () => {
      const customService = new CommandService({
        maxHistorySize: 50,
        autoSaveInterval: 5000,
        enableMemoryOptimization: false
      })
      
      const config = customService.getConfig()
      
      expect(config.maxHistorySize).toBe(50)
      expect(config.autoSaveInterval).toBe(5000)
      expect(config.enableMemoryOptimization).toBe(false)
    })
  })

  describe('Execute Command', () => {
    it('should execute command and add to history', () => {
      const result = commandService.executeCommand(mockCommand1)
      
      expect(result).toBe(true)
      expect(mockCommand1.execute).toHaveBeenCalledTimes(1)
      
      const stats = commandService.getHistoryStats()
      expect(stats.totalCommands).toBe(1)
      expect(stats.currentPosition).toBe(1)
      expect(stats.canUndo).toBe(true)
      expect(stats.canRedo).toBe(false)
    })

    it('should execute multiple commands', () => {
      commandService.executeCommand(mockCommand1)
      commandService.executeCommand(mockCommand2)
      commandService.executeCommand(mockCommand3)
      
      const stats = commandService.getHistoryStats()
      expect(stats.totalCommands).toBe(3)
      expect(stats.currentPosition).toBe(3)
      expect(stats.canUndo).toBe(true)
      expect(stats.canRedo).toBe(false)
    })

    it('should not add failed command to history', () => {
      mockCommand1.execute.mockReturnValue(false)
      
      const result = commandService.executeCommand(mockCommand1)
      
      expect(result).toBe(false)
      const stats = commandService.getHistoryStats()
      expect(stats.totalCommands).toBe(0)
    })

    it('should handle command execution errors', () => {
      mockCommand1.execute.mockImplementation(() => {
        throw new Error('Command failed')
      })
      
      const result = commandService.executeCommand(mockCommand1)
      
      expect(result).toBe(false)
      const stats = commandService.getHistoryStats()
      expect(stats.totalCommands).toBe(0)
    })

    it('should clear future history when executing new command after undo', () => {
      // Execute 3 commands
      commandService.executeCommand(mockCommand1)
      commandService.executeCommand(mockCommand2)
      commandService.executeCommand(mockCommand3)
      
      // Undo 2 commands
      commandService.undo()
      commandService.undo()
      
      // Execute new command - should clear command3 from history
      const newCommand = {
        execute: vi.fn().mockReturnValue(true),
        undo: vi.fn().mockReturnValue(true),
        canUndo: vi.fn().mockReturnValue(true),
        getDescription: vi.fn().mockReturnValue('New Command')
      }
      
      commandService.executeCommand(newCommand)
      
      const stats = commandService.getHistoryStats()
      expect(stats.totalCommands).toBe(2) // mockCommand1, newCommand
      expect(stats.currentPosition).toBe(2)
      expect(stats.canRedo).toBe(false)
    })
  })

  describe('Undo Functionality', () => {
    it('should undo last command', () => {
      commandService.executeCommand(mockCommand1)
      
      const result = commandService.undo()
      
      expect(result).toBe(true)
      expect(mockCommand1.undo).toHaveBeenCalledTimes(1)
      
      const stats = commandService.getHistoryStats()
      expect(stats.currentPosition).toBe(0)
      expect(stats.canUndo).toBe(false)
      expect(stats.canRedo).toBe(true)
    })

    it('should undo multiple commands in reverse order', () => {
      commandService.executeCommand(mockCommand1)
      commandService.executeCommand(mockCommand2)
      commandService.executeCommand(mockCommand3)
      
      commandService.undo() // Undo command3
      expect(mockCommand3.undo).toHaveBeenCalledTimes(1)
      
      commandService.undo() // Undo command2
      expect(mockCommand2.undo).toHaveBeenCalledTimes(1)
      
      commandService.undo() // Undo command1
      expect(mockCommand1.undo).toHaveBeenCalledTimes(1)
      
      const stats = commandService.getHistoryStats()
      expect(stats.currentPosition).toBe(0)
      expect(stats.canUndo).toBe(false)
      expect(stats.canRedo).toBe(true)
    })

    it('should not undo when no commands available', () => {
      const result = commandService.undo()
      
      expect(result).toBe(false)
    })

    it('should not undo when command cannot be undone', () => {
      mockCommand1.canUndo.mockReturnValue(false)
      commandService.executeCommand(mockCommand1)
      
      const result = commandService.undo()
      
      expect(result).toBe(false)
      expect(mockCommand1.undo).not.toHaveBeenCalled()
    })

    it('should handle undo failure', () => {
      mockCommand1.undo.mockReturnValue(false)
      commandService.executeCommand(mockCommand1)
      
      const result = commandService.undo()
      
      expect(result).toBe(false)
      expect(mockCommand1.undo).toHaveBeenCalledTimes(1)
      
      // Position should remain unchanged on undo failure
      const stats = commandService.getHistoryStats()
      expect(stats.currentPosition).toBe(1)
    })

    it('should handle undo errors gracefully', () => {
      mockCommand1.undo.mockImplementation(() => {
        throw new Error('Undo failed')
      })
      commandService.executeCommand(mockCommand1)
      
      const result = commandService.undo()
      
      expect(result).toBe(false)
    })
  })

  describe('Redo Functionality', () => {
    it('should redo undone command', () => {
      commandService.executeCommand(mockCommand1)
      commandService.undo()
      
      const result = commandService.redo()
      
      expect(result).toBe(true)
      expect(mockCommand1.execute).toHaveBeenCalledTimes(2) // Initial + redo
      
      const stats = commandService.getHistoryStats()
      expect(stats.currentPosition).toBe(1)
      expect(stats.canUndo).toBe(true)
      expect(stats.canRedo).toBe(false)
    })

    it('should redo multiple commands in order', () => {
      commandService.executeCommand(mockCommand1)
      commandService.executeCommand(mockCommand2)
      commandService.executeCommand(mockCommand3)
      
      // Undo all
      commandService.undo()
      commandService.undo()
      commandService.undo()
      
      // Redo all
      commandService.redo() // Redo command1
      expect(mockCommand1.execute).toHaveBeenCalledTimes(2)
      
      commandService.redo() // Redo command2
      expect(mockCommand2.execute).toHaveBeenCalledTimes(2)
      
      commandService.redo() // Redo command3
      expect(mockCommand3.execute).toHaveBeenCalledTimes(2)
      
      const stats = commandService.getHistoryStats()
      expect(stats.currentPosition).toBe(3)
      expect(stats.canUndo).toBe(true)
      expect(stats.canRedo).toBe(false)
    })

    it('should not redo when no commands available', () => {
      const result = commandService.redo()
      
      expect(result).toBe(false)
    })

    it('should not redo after new command execution', () => {
      commandService.executeCommand(mockCommand1)
      commandService.undo()
      commandService.executeCommand(mockCommand2)
      
      const result = commandService.redo()
      
      expect(result).toBe(false)
    })

    it('should handle redo failure', () => {
      commandService.executeCommand(mockCommand1)
      commandService.undo()
      
      mockCommand1.execute.mockReturnValue(false)
      
      const result = commandService.redo()
      
      expect(result).toBe(false)
      // Position should be restored on failure
      const stats = commandService.getHistoryStats()
      expect(stats.currentPosition).toBe(0)
    })

    it('should handle redo errors gracefully', () => {
      commandService.executeCommand(mockCommand1)
      commandService.undo()
      
      mockCommand1.execute.mockImplementation(() => {
        throw new Error('Redo failed')
      })
      
      const result = commandService.redo()
      
      expect(result).toBe(false)
      const stats = commandService.getHistoryStats()
      expect(stats.currentPosition).toBe(0)
    })
  })

  describe('Can Undo/Redo', () => {
    it('should correctly report canUndo status', () => {
      expect(commandService.canUndo()).toBe(false)
      
      commandService.executeCommand(mockCommand1)
      expect(commandService.canUndo()).toBe(true)
      
      commandService.undo()
      expect(commandService.canUndo()).toBe(false)
    })

    it('should correctly report canRedo status', () => {
      expect(commandService.canRedo()).toBe(false)
      
      commandService.executeCommand(mockCommand1)
      expect(commandService.canRedo()).toBe(false)
      
      commandService.undo()
      expect(commandService.canRedo()).toBe(true)
      
      commandService.redo()
      expect(commandService.canRedo()).toBe(false)
    })

    it('should respect command canUndo status', () => {
      mockCommand1.canUndo.mockReturnValue(false)
      commandService.executeCommand(mockCommand1)
      
      expect(commandService.canUndo()).toBe(false)
    })
  })

  describe('History Management', () => {
    it('should clear history', () => {
      commandService.executeCommand(mockCommand1)
      commandService.executeCommand(mockCommand2)
      
      commandService.clearHistory()
      
      const stats = commandService.getHistoryStats()
      expect(stats.totalCommands).toBe(0)
      expect(stats.currentPosition).toBe(0)
      expect(stats.canUndo).toBe(false)
      expect(stats.canRedo).toBe(false)
    })

    it('should get history list', () => {
      commandService.executeCommand(mockCommand1)
      commandService.executeCommand(mockCommand2)
      commandService.undo()
      
      const historyList = commandService.getHistoryList()
      
      expect(historyList).toHaveLength(2)
      expect(historyList[0]).toEqual({
        index: 0,
        description: 'Mock Command 1',
        executed: true,
        canUndo: true
      })
      expect(historyList[1]).toEqual({
        index: 1,
        description: 'Mock Command 2',
        executed: false,
        canUndo: true
      })
    })

    it('should enforce history size limit', () => {
      const limitedService = new CommandService({ maxHistorySize: 2 })
      
      // Add 3 commands (exceeds limit)
      limitedService.executeCommand(mockCommand1)
      limitedService.executeCommand(mockCommand2)
      limitedService.executeCommand(mockCommand3)
      
      const stats = limitedService.getHistoryStats()
      expect(stats.totalCommands).toBe(2) // Limited to 2
      
      const historyList = limitedService.getHistoryList()
      expect(historyList[0].description).toBe('Mock Command 2')
      expect(historyList[1].description).toBe('Mock Command 3')
    })

    it('should estimate memory usage', () => {
      commandService.executeCommand(mockCommand1)
      commandService.executeCommand(mockCommand2)
      
      const stats = commandService.getHistoryStats()
      expect(stats.memoryUsage).toBeGreaterThan(0)
    })
  })

  describe('Jump to History Point', () => {
    beforeEach(() => {
      commandService.executeCommand(mockCommand1)
      commandService.executeCommand(mockCommand2)
      commandService.executeCommand(mockCommand3)
    })

    it('should jump to earlier history point', () => {
      const result = commandService.jumpToHistoryPoint(0)
      
      expect(result).toBe(true)
      expect(mockCommand3.undo).toHaveBeenCalledTimes(1)
      expect(mockCommand2.undo).toHaveBeenCalledTimes(1)
      // command1 should not be undone when jumping to index 0
      expect(mockCommand1.undo).toHaveBeenCalledTimes(0)
      
      const stats = commandService.getHistoryStats()
      expect(stats.currentPosition).toBe(1) // Index 0 = position 1
    })

    it('should jump to later history point', () => {
      commandService.undo()
      commandService.undo()
      
      const result = commandService.jumpToHistoryPoint(1)
      
      expect(result).toBe(true)
      expect(mockCommand2.execute).toHaveBeenCalledTimes(2) // Initial + redo
      
      const stats = commandService.getHistoryStats()
      expect(stats.currentPosition).toBe(2)
    })

    it('should handle invalid history point', () => {
      const result1 = commandService.jumpToHistoryPoint(-2)
      const result2 = commandService.jumpToHistoryPoint(10)
      
      expect(result1).toBe(false)
      expect(result2).toBe(false)
    })

    it('should handle jump failure', () => {
      mockCommand2.undo.mockReturnValue(false)
      
      const result = commandService.jumpToHistoryPoint(0)
      
      expect(result).toBe(false)
    })
  })

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      commandService.updateConfig({
        maxHistorySize: 50,
        autoSaveInterval: 3000
      })
      
      const config = commandService.getConfig()
      expect(config.maxHistorySize).toBe(50)
      expect(config.autoSaveInterval).toBe(3000)
      expect(config.enableMemoryOptimization).toBe(true) // Should remain unchanged
    })

    it('should enforce new history limit when config updated', () => {
      // Add 3 commands
      commandService.executeCommand(mockCommand1)
      commandService.executeCommand(mockCommand2)
      commandService.executeCommand(mockCommand3)
      
      // Reduce history limit
      commandService.updateConfig({ maxHistorySize: 2 })
      
      const stats = commandService.getHistoryStats()
      expect(stats.totalCommands).toBe(2)
    })

    it('should return immutable config copy', () => {
      const config1 = commandService.getConfig()
      const config2 = commandService.getConfig()
      
      expect(config1).toEqual(config2)
      expect(config1).not.toBe(config2) // Different objects
      
      config1.maxHistorySize = 999
      expect(commandService.getConfig().maxHistorySize).toBe(100) // Should remain unchanged
    })
  })

  describe('Error Recovery', () => {
    it('should recover from command execution failure without corrupting history', () => {
      commandService.executeCommand(mockCommand1)
      
      const failingCommand = {
        execute: vi.fn().mockReturnValue(false),
        undo: vi.fn(),
        canUndo: vi.fn().mockReturnValue(true),
        getDescription: vi.fn().mockReturnValue('Failing Command')
      }
      
      commandService.executeCommand(failingCommand)
      commandService.executeCommand(mockCommand2)
      
      const stats = commandService.getHistoryStats()
      expect(stats.totalCommands).toBe(2) // Only successful commands
      
      const historyList = commandService.getHistoryList()
      expect(historyList[0].description).toBe('Mock Command 1')
      expect(historyList[1].description).toBe('Mock Command 2')
    })

    it('should maintain consistency when undo fails', () => {
      commandService.executeCommand(mockCommand1)
      commandService.executeCommand(mockCommand2)
      
      mockCommand2.undo.mockReturnValue(false)
      
      const undoResult = commandService.undo()
      expect(undoResult).toBe(false)
      
      // Should still be able to undo the first command
      mockCommand2.undo.mockReturnValue(true) // Fix the mock
      const secondUndoResult = commandService.undo()
      expect(secondUndoResult).toBe(true)
      expect(mockCommand2.undo).toHaveBeenCalledTimes(2)
    })
  })
})