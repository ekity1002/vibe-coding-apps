import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HistoryPanel } from '../../../src/components/history/HistoryPanel'
import { CommandService } from '../../../src/services/CommandService'
import { EditorConfig } from '../../../src/config/EditorConfig'

describe('HistoryPanel Basic Tests', () => {
  let commandService: CommandService

  beforeEach(() => {
    EditorConfig.resetInstance()
    commandService = new CommandService()
    
    // setIntervalをモック
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    EditorConfig.resetInstance()
  })

  describe('Basic Rendering', () => {
    it('should render history panel with title', () => {
      render(<HistoryPanel commandService={commandService} />)
      
      expect(screen.getByText('操作履歴')).toBeInTheDocument()
    })

    it('should show empty state when no history', () => {
      render(<HistoryPanel commandService={commandService} />)
      
      expect(screen.getByText('操作履歴がありません')).toBeInTheDocument()
    })

    it('should display undo/redo buttons', () => {
      render(<HistoryPanel commandService={commandService} />)
      
      expect(screen.getByText('↶ Undo')).toBeInTheDocument()
      expect(screen.getByText('↷ Redo')).toBeInTheDocument()
      expect(screen.getByText('🗑️')).toBeInTheDocument()
    })

    it('should render with custom className', () => {
      const { container } = render(
        <HistoryPanel commandService={commandService} className="custom-class" />
      )
      
      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('should show minimize button', () => {
      render(<HistoryPanel commandService={commandService} />)
      
      expect(screen.getByText('➖')).toBeInTheDocument()
    })
  })

  describe('Stats Display', () => {
    it('should show default stats', () => {
      render(<HistoryPanel commandService={commandService} />)
      
      expect(screen.getByText('総数:')).toBeInTheDocument()
      expect(screen.getByText('位置:')).toBeInTheDocument()
      expect(screen.getByText('Undo')).toBeInTheDocument()
      expect(screen.getByText('Redo')).toBeInTheDocument()
    })

    it('should show memory usage', () => {
      render(<HistoryPanel commandService={commandService} />)
      
      // メモリ使用量の表示（💾マーク）
      expect(screen.getByText('💾 0B')).toBeInTheDocument()
    })
  })

  describe('Button States', () => {
    it('should disable undo/redo buttons when no history', () => {
      render(<HistoryPanel commandService={commandService} />)
      
      const undoButton = screen.getByText('↶ Undo')
      const redoButton = screen.getByText('↷ Redo')
      const clearButton = screen.getByText('🗑️')
      
      expect(undoButton).toBeDisabled()
      expect(redoButton).toBeDisabled()
      expect(clearButton).toBeDisabled()
    })
  })

  describe('Theme Application', () => {
    it('should apply light theme by default', () => {
      render(<HistoryPanel commandService={commandService} />)
      
      // カードコンテナをより具体的に特定
      const cardContainer = screen.getByText('操作履歴').closest('.bg-white')
      expect(cardContainer).toBeInTheDocument()
    })
  })
})