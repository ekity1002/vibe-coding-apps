import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CharCounter } from '../../../../src/presentation/components/editor/CharCounter'
import { EditorConfig } from '../../../../src/domain/config/entities/EditorConfig'

describe('CharCounter', () => {
  beforeEach(() => {
    // EditorConfigのインスタンスをリセット
    EditorConfig.resetInstance()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    EditorConfig.resetInstance()
  })

  const sampleText = 'Hello World! This is a test text with multiple words.'

  describe('Rendering', () => {
    it('should render character counter with basic stats', () => {
      render(<CharCounter text={sampleText} />)

      expect(screen.getByText('テキスト統計')).toBeInTheDocument()
      expect(screen.getByText('文字数:')).toBeInTheDocument()
      expect(screen.getByText('53')).toBeInTheDocument() // Length of sampleText
    })

    it('should render detailed stats when enabled', () => {
      render(<CharCounter text={sampleText} showDetailedStats={true} />)

      expect(screen.getByText('行数:')).toBeInTheDocument()
      expect(screen.getByText('単語数:')).toBeInTheDocument()
      expect(screen.getByText('空白を除く文字数:')).toBeInTheDocument()
      expect(screen.getByText('推定読書時間:')).toBeInTheDocument()
    })

    it('should not render detailed stats when disabled', () => {
      render(<CharCounter text={sampleText} showDetailedStats={false} />)

      expect(screen.queryByText('行数:')).not.toBeInTheDocument()
      expect(screen.queryByText('単語数:')).not.toBeInTheDocument()
    })

    it('should handle empty text', () => {
      render(<CharCounter text="" />)

      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })

  describe('Character Limit Functionality', () => {
    it('should show character limit when maxCharacters is set', () => {
      render(<CharCounter text={sampleText} maxCharacters={100} />)

      expect(screen.getByText('/ 100')).toBeInTheDocument()
    })

    it('should show progress bar when maxCharacters is set', () => {
      const { container } = render(<CharCounter text={sampleText} maxCharacters={100} />)

      const progressBar = container.querySelector('[style*="width: 53%"]')
      expect(progressBar).toBeInTheDocument()
    })

    it('should show warning when near character limit', () => {
      render(<CharCounter text={sampleText} maxCharacters={60} />)

      // 53/60 = 88% > 80%, should show yellow color
      const characterCount = screen.getByText('53')
      expect(characterCount).toHaveClass('text-yellow-500')
    })

    it('should show error when over character limit', () => {
      render(<CharCounter text={sampleText} maxCharacters={50} />)

      // 53 > 50, should show red color
      const characterCount = screen.getByText('53')
      expect(characterCount).toHaveClass('text-red-500')
      expect(screen.getByText(/文字数制限を 3 文字オーバーしています/)).toBeInTheDocument()
    })

    it('should format large numbers correctly', () => {
      const largeText = 'a'.repeat(1500)
      render(<CharCounter text={largeText} />)

      expect(screen.getByText('1,500')).toBeInTheDocument()
    })
  })

  describe('Time Calculations', () => {
    it('should calculate reading time correctly', () => {
      // Create text with approximately 400 words (should be 2 minutes at 200 wpm)
      const wordsArray = Array.from({ length: 400 }, (_, i) => `word${i}`)
      const longText = wordsArray.join(' ')

      render(<CharCounter text={longText} showDetailedStats={true} />)

      expect(screen.getByText('2 分')).toBeInTheDocument()
    })

    it('should show minimum 1 minute for any text', () => {
      render(<CharCounter text="short" showDetailedStats={true} />)

      expect(screen.getByText('1 分')).toBeInTheDocument()
    })
  })

  describe('Theme Integration', () => {
    it('should apply light theme by default', () => {
      const { container } = render(<CharCounter text={sampleText} />)

      const charCounter = container.firstChild as HTMLElement
      expect(charCounter).toHaveClass('bg-white')
    })

    it('should update theme when EditorConfig changes', () => {
      const { container } = render(<CharCounter text={sampleText} />)
      
      // テーマをダークに変更
      const editorConfig = EditorConfig.getInstance()
      act(() => {
        editorConfig.setTheme('dark')
      })

      const charCounter = container.firstChild as HTMLElement
      expect(charCounter).toHaveClass('bg-gray-800')
    })
  })

  describe('Observer Pattern Integration', () => {
    it('should attach observer to EditorConfig on mount', () => {
      const editorConfig = EditorConfig.getInstance()
      const attachSpy = vi.spyOn(editorConfig, 'attach')

      render(<CharCounter text={sampleText} />)

      expect(attachSpy).toHaveBeenCalled()
    })

    it('should detach observer from EditorConfig on unmount', () => {
      const editorConfig = EditorConfig.getInstance()
      const detachSpy = vi.spyOn(editorConfig, 'detach')

      const { unmount } = render(<CharCounter text={sampleText} />)
      unmount()

      expect(detachSpy).toHaveBeenCalled()
    })
  })

  describe('Last Updated Time', () => {
    it('should show last updated time for non-empty text', () => {
      vi.setSystemTime(new Date('2023-01-01 12:30:45'))

      render(<CharCounter text={sampleText} />)

      expect(screen.getByText('最終更新:')).toBeInTheDocument()
      expect(screen.getByText('12:30:45 PM')).toBeInTheDocument()
    })

    it('should not show last updated time for empty text', () => {
      render(<CharCounter text="" />)

      expect(screen.queryByText('最終更新:')).not.toBeInTheDocument()
    })
  })
})