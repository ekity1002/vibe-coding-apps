import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LineCounter } from '../../../../src/presentation/components/editor/LineCounter'
import { EditorConfig } from '../../../../src/domain/config/entities/EditorConfig'

describe('LineCounter', () => {
  beforeEach(() => {
    // EditorConfigのインスタンスをリセット
    EditorConfig.resetInstance()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    EditorConfig.resetInstance()
  })

  const sampleText = 'Line 1\nLine 2\nLine 3'

  describe('Rendering', () => {
    it('should render line numbers when showLineNumbers is enabled', () => {
      const config = EditorConfig.getInstance()
      config.setShowLineNumbers(true)

      render(<LineCounter text={sampleText} />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should not render when showLineNumbers is disabled', () => {
      const config = EditorConfig.getInstance()
      config.setShowLineNumbers(false)

      const { container } = render(<LineCounter text={sampleText} />)

      expect(container.firstChild).toBeNull()
    })

    it('should highlight current line', () => {
      const config = EditorConfig.getInstance()
      config.setShowLineNumbers(true)

      render(<LineCounter text={sampleText} currentLine={2} />)

      const line2Element = screen.getByText('2')
      expect(line2Element).toHaveClass('bg-gray-200')
    })

    it('should handle empty text', () => {
      const config = EditorConfig.getInstance()
      config.setShowLineNumbers(true)

      render(<LineCounter text="" />)

      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should handle single line text', () => {
      const config = EditorConfig.getInstance()
      config.setShowLineNumbers(true)

      render(<LineCounter text="Single line" />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.queryByText('2')).not.toBeInTheDocument()
    })
  })

  describe('Line Click Functionality', () => {
    it('should call onLineClick when line is clicked', () => {
      const config = EditorConfig.getInstance()
      config.setShowLineNumbers(true)
      const onLineClick = vi.fn()

      render(<LineCounter text={sampleText} onLineClick={onLineClick} />)

      const line2Element = screen.getByText('2')
      fireEvent.click(line2Element)

      expect(onLineClick).toHaveBeenCalledWith(2)
    })

    it('should not call onLineClick when not provided', () => {
      const config = EditorConfig.getInstance()
      config.setShowLineNumbers(true)

      render(<LineCounter text={sampleText} />)

      const line2Element = screen.getByText('2')
      // Should not throw error when clicked
      fireEvent.click(line2Element)
    })
  })

  describe('Theme Integration', () => {
    it('should apply light theme by default', () => {
      const config = EditorConfig.getInstance()
      config.setShowLineNumbers(true)

      const { container } = render(<LineCounter text={sampleText} />)

      const lineCounter = container.firstChild as HTMLElement
      expect(lineCounter).toHaveClass('bg-gray-50')
    })

    it('should update theme when EditorConfig changes', () => {
      const config = EditorConfig.getInstance()
      config.setShowLineNumbers(true)

      const { container } = render(<LineCounter text={sampleText} />)
      
      // テーマをダークに変更
      act(() => {
        config.setTheme('dark')
      })

      const lineCounter = container.firstChild as HTMLElement
      expect(lineCounter).toHaveClass('bg-gray-800')
    })
  })

  describe('Observer Pattern Integration', () => {
    it('should attach observer to EditorConfig on mount', () => {
      const config = EditorConfig.getInstance()
      config.setShowLineNumbers(true)
      const attachSpy = vi.spyOn(config, 'attach')

      render(<LineCounter text={sampleText} />)

      expect(attachSpy).toHaveBeenCalled()
    })

    it('should detach observer from EditorConfig on unmount', () => {
      const config = EditorConfig.getInstance()
      config.setShowLineNumbers(true)
      const detachSpy = vi.spyOn(config, 'detach')

      const { unmount } = render(<LineCounter text={sampleText} />)
      unmount()

      expect(detachSpy).toHaveBeenCalled()
    })

    it('should respond to showLineNumbers config changes', () => {
      const config = EditorConfig.getInstance()
      config.setShowLineNumbers(true)

      const { container } = render(<LineCounter text={sampleText} />)

      // 行番号が表示されている
      expect(container.firstChild).not.toBeNull()

      // 行番号表示を無効にする
      act(() => {
        config.setShowLineNumbers(false)
      })

      // 行番号が非表示になる
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Large Text Handling', () => {
    it('should show total lines info for large texts', () => {
      const config = EditorConfig.getInstance()
      config.setShowLineNumbers(true)
      
      // 1001行のテキストを生成
      const largeText = Array.from({ length: 1001 }, (_, i) => `Line ${i + 1}`).join('\n')

      render(<LineCounter text={largeText} />)

      expect(screen.getByText('総 1,001 行')).toBeInTheDocument()
    })
  })
})