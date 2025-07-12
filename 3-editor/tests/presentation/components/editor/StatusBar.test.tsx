import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StatusBar } from '../../../../src/presentation/components/editor/StatusBar'
import { EditorConfig } from '../../../../src/domain/config/entities/EditorConfig'

describe('StatusBar', () => {
  beforeEach(() => {
    // EditorConfigのインスタンスをリセット
    EditorConfig.resetInstance()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    EditorConfig.resetInstance()
  })

  const defaultProps = {
    currentLine: 1,
    currentColumn: 1,
    totalLines: 10,
    totalCharacters: 100
  }

  describe('Rendering', () => {
    it('should render status bar with basic information', () => {
      render(<StatusBar {...defaultProps} />)

      expect(screen.getByText('行 1, 列 1')).toBeInTheDocument()
      expect(screen.getByText('10行, 100文字')).toBeInTheDocument()
    })

    it('should render with selected text information', () => {
      render(<StatusBar {...defaultProps} selectedText="Hello World" />)

      expect(screen.getByText('選択: 11文字')).toBeInTheDocument()
    })

    it('should render multi-line selection information', () => {
      render(<StatusBar {...defaultProps} selectedText="Hello\nWorld" />)

      expect(screen.getByText('選択: 12文字 (2行)')).toBeInTheDocument()
    })

    it('should show auto-save indicator when enabled', () => {
      const config = EditorConfig.getInstance()
      config.setAutoSave(true)

      render(<StatusBar {...defaultProps} />)

      expect(screen.getByText('自動保存')).toBeInTheDocument()
    })

    it('should show line numbers indicator when enabled', () => {
      const config = EditorConfig.getInstance()
      config.setShowLineNumbers(true)

      render(<StatusBar {...defaultProps} />)

      expect(screen.getByText('行番号')).toBeInTheDocument()
    })
  })

  describe('Theme Integration', () => {
    it('should apply light theme by default', () => {
      const { container } = render(<StatusBar {...defaultProps} />)

      const statusBar = container.firstChild as HTMLElement
      expect(statusBar).toHaveClass('bg-gray-100')
    })

    it('should update theme when EditorConfig changes', () => {
      const { container } = render(<StatusBar {...defaultProps} />)
      
      // テーマをダークに変更
      const editorConfig = EditorConfig.getInstance()
      act(() => {
        editorConfig.setTheme('dark')
      })

      const statusBar = container.firstChild as HTMLElement
      expect(statusBar).toHaveClass('bg-gray-800')
    })
  })

  describe('Observer Pattern Integration', () => {
    it('should attach observer to EditorConfig on mount', () => {
      const editorConfig = EditorConfig.getInstance()
      const attachSpy = vi.spyOn(editorConfig, 'attach')

      render(<StatusBar {...defaultProps} />)

      expect(attachSpy).toHaveBeenCalled()
    })

    it('should detach observer from EditorConfig on unmount', () => {
      const editorConfig = EditorConfig.getInstance()
      const detachSpy = vi.spyOn(editorConfig, 'detach')

      const { unmount } = render(<StatusBar {...defaultProps} />)
      unmount()

      expect(detachSpy).toHaveBeenCalled()
    })
  })
})