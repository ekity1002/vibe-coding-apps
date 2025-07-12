import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HistoryPanel } from '../../../../src/presentation/components/history/HistoryPanel'
import { EditorConfig } from '../../../../src/domain/config/entities/EditorConfig'
import { CommandService } from '../../../../src/application/services/CommandService'
import { InsertTextCommand } from '../../../../src/domain/command/commands/InsertTextCommand'
import { CommandContext } from '../../../../src/domain/command/types/Command'

describe('HistoryPanel', () => {
  let commandService: CommandService
  let mockContext: CommandContext

  beforeEach(() => {
    // EditorConfigのインスタンスをリセット
    EditorConfig.resetInstance()

    // CommandContext のモック作成
    mockContext = {
      currentText: '',
      updateText: vi.fn((newText: string) => {
        mockContext.currentText = newText
      }),
      setCursorPosition: vi.fn()
    }
    
    commandService = new CommandService()

    // setIntervalのモック
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    EditorConfig.resetInstance()
  })

  describe('Rendering', () => {
    it('should render history panel with title', () => {
      render(<HistoryPanel commandService={commandService}  />)

      expect(screen.getByText('操作履歴')).toBeInTheDocument()
    })

    it('should show empty state when no history', () => {
      render(<HistoryPanel commandService={commandService}  />)

      expect(screen.getByText('操作履歴がありません')).toBeInTheDocument()
    })

    it('should display undo/redo buttons', () => {
      render(<HistoryPanel commandService={commandService}  />)

      expect(screen.getByText('↶ Undo')).toBeInTheDocument()
      expect(screen.getByText('↷ Redo')).toBeInTheDocument()
    })

    it('should render with custom className', () => {
      const { container } = render(
        <HistoryPanel commandService={commandService} className="custom-class"  />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe.skip('Command History Display', () => {
    beforeEach(() => {
      // テスト用コマンドを履歴に追加
      const command1 = new InsertTextCommand('Hello', 0, mockContext)
      const command2 = new InsertTextCommand(' World', 5, mockContext)

      commandService.executeCommand(command1)
      commandService.executeCommand(command2)
    })

    it('should display command history', () => {
      render(<HistoryPanel commandService={commandService}  />)

      
      const historyElements = screen.getAllByText(/テキスト挿入/)
      expect(historyElements.length).toBeGreaterThan(0)
    })

    it('should show current position in stats', () => {
      render(<HistoryPanel commandService={commandService}  />)


      expect(screen.getByText('位置:')).toBeInTheDocument()
      expect(screen.getByText('2/2')).toBeInTheDocument()
    })

    it('should show total commands count', () => {
      render(<HistoryPanel commandService={commandService}  />)


      expect(screen.getByText('総数:')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  describe.skip('Undo/Redo Operations', () => {
    beforeEach(() => {
      const command = new InsertTextCommand('Test', 0, mockContext)
      commandService.executeCommand(command)
    })

    it('should enable undo button when history exists', () => {
      render(<HistoryPanel commandService={commandService}  />)


      const undoButton = screen.getByText('↶ Undo')
      expect(undoButton).not.toBeDisabled()
    })

    it('should disable redo button initially', () => {
      render(<HistoryPanel commandService={commandService}  />)


      const redoButton = screen.getByText('↷ Redo')
      expect(redoButton).toBeDisabled()
    })

    it('should handle undo operation', () => {
      const undoSpy = vi.spyOn(commandService, 'undo').mockReturnValue(true)

      render(<HistoryPanel commandService={commandService}  />)


      const undoButton = screen.getByText('↶ Undo')
      fireEvent.click(undoButton)

      expect(undoSpy).toHaveBeenCalled()
    })

    it('should handle redo operation', () => {
      const redoSpy = vi.spyOn(commandService, 'redo').mockReturnValue(true)

      // Undoを実行してRedoを有効にする
      commandService.undo()

      render(<HistoryPanel commandService={commandService}  />)


      const redoButton = screen.getByText('↷ Redo')
      fireEvent.click(redoButton)

      expect(redoSpy).toHaveBeenCalled()
    })
  })

  describe.skip('Clear History', () => {
    beforeEach(() => {
      const command = new InsertTextCommand('Test', 0, mockContext)
      commandService.executeCommand(command)
    })

    it('should clear history when clear button clicked', () => {
      const clearSpy = vi.spyOn(commandService, 'clearHistory')

      render(<HistoryPanel commandService={commandService}  />)


      const clearButton = screen.getByText('🗑️')
      fireEvent.click(clearButton)

      expect(clearSpy).toHaveBeenCalled()
    })

    it('should disable clear button when no history', () => {
      commandService.clearHistory()

      render(<HistoryPanel commandService={commandService}  />)

      const clearButton = screen.getByText('🗑️')
      expect(clearButton).toBeDisabled()
    })
  })

  describe.skip('Jump to History Point', () => {
    beforeEach(() => {
      // 複数のコマンドを追加
      const command1 = new InsertTextCommand('A', 0, mockContext)
      const command2 = new InsertTextCommand('B', 1, mockContext)
      const command3 = new InsertTextCommand('C', 2, mockContext)

      commandService.executeCommand(command1)
      commandService.executeCommand(command2)
      commandService.executeCommand(command3)
    })

    it('should jump to specific history point when item clicked', () => {
      const jumpSpy = vi.spyOn(commandService, 'jumpToHistoryPoint').mockReturnValue(true)

      render(<HistoryPanel commandService={commandService}  />)


      const historyItem = screen.getByText('テキスト挿入: "A" at position 0')
      fireEvent.click(historyItem)

      expect(jumpSpy).toHaveBeenCalledWith(0)
    })
  })

  describe.skip('Theme Integration (Observer Pattern)', () => {
    it('should apply light theme by default', () => {
      render(<HistoryPanel commandService={commandService}  />)

      const card = screen.getByText('操作履歴').closest('.bg-white')
      expect(card).toBeInTheDocument()
    })

    it('should update theme when EditorConfig changes', () => {
      render(<HistoryPanel commandService={commandService}  />)

      // テーマをダークに変更
      const editorConfig = EditorConfig.getInstance()
      act(() => {
        editorConfig.setTheme('dark')
      })

      const card = screen.getByText('操作履歴').closest('.bg-gray-800')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Panel Visibility', () => {
    it('should toggle panel visibility', () => {
      render(<HistoryPanel commandService={commandService}  />)

      // パネルが表示されている
      expect(screen.getByText('操作履歴')).toBeInTheDocument()

      // 最小化ボタンをクリック
      const minimizeButton = screen.getByText('➖')
      fireEvent.click(minimizeButton)

      // パネルが非表示になり、復元ボタンが表示される
      expect(screen.queryByText('操作履歴')).not.toBeInTheDocument()
      expect(screen.getByText('📋')).toBeInTheDocument()
    })

    it('should restore panel when restore button clicked', () => {
      render(<HistoryPanel commandService={commandService}  />)

      // 最小化
      const minimizeButton = screen.getByText('➖')
      fireEvent.click(minimizeButton)

      // 復元
      const restoreButton = screen.getByText('📋')
      fireEvent.click(restoreButton)

      expect(screen.getByText('操作履歴')).toBeInTheDocument()
    })
  })

  describe.skip('Error Handling', () => {
    it('should handle undo failure gracefully', () => {
      vi.spyOn(commandService, 'undo').mockReturnValue(false)

      const command = new InsertTextCommand('Test', 0, mockContext)
      commandService.executeCommand(command)

      render(<HistoryPanel commandService={commandService}  />)


      const undoButton = screen.getByText('↶ Undo')
      fireEvent.click(undoButton)

      // エラーが発生してもUIがクラッシュしない
      expect(screen.getByText('操作履歴')).toBeInTheDocument()
    })

    it('should handle redo failure gracefully', () => {
      vi.spyOn(commandService, 'redo').mockReturnValue(false)

      const command = new InsertTextCommand('Test', 0, mockContext)
      commandService.executeCommand(command)
      commandService.undo()

      render(<HistoryPanel commandService={commandService}  />)


      const redoButton = screen.getByText('↷ Redo')
      fireEvent.click(redoButton)

      expect(screen.getByText('操作履歴')).toBeInTheDocument()
    })

    it('should handle jump failure gracefully', () => {
      vi.spyOn(commandService, 'jumpToHistoryPoint').mockReturnValue(false)

      const command = new InsertTextCommand('Test', 0, mockContext)
      commandService.executeCommand(command)

      render(<HistoryPanel commandService={commandService}  />)


      const historyItem = screen.getByText('テキスト挿入: "Test" at position 0')
      fireEvent.click(historyItem)

      expect(screen.getByText('操作履歴')).toBeInTheDocument()
    })
  })

  describe.skip('Observer Pattern Integration', () => {
    it('should attach observer to EditorConfig on mount', () => {
      const editorConfig = EditorConfig.getInstance()
      const attachSpy = vi.spyOn(editorConfig, 'attach')

      render(<HistoryPanel commandService={commandService}  />)

      expect(attachSpy).toHaveBeenCalled()
    })

    it('should detach observer from EditorConfig on unmount', () => {
      const editorConfig = EditorConfig.getInstance()
      const detachSpy = vi.spyOn(editorConfig, 'detach')

      const { unmount } = render(<HistoryPanel commandService={commandService} />)
      unmount()

      expect(detachSpy).toHaveBeenCalled()
    })

    it('should update only on theme changes', () => {
      render(<HistoryPanel commandService={commandService}  />)

      // テーマ以外の設定変更
      const editorConfig = EditorConfig.getInstance()
      editorConfig.setFontSize(16)

      // テーマ変更のみ反応することを確認
      act(() => {
        editorConfig.setTheme('dark')
      })

      const card = screen.getByText('操作履歴').closest('.bg-gray-800')
      expect(card).toBeInTheDocument()
    })
  })
})