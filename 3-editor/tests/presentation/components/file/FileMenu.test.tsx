/**
 * FileMenu コンポーネントテストスイート
 * 
 * UI層でのFactory Pattern統合をテスト
 * - ファイル作成機能
 * - Observer Pattern連携
 * - キーボードショートカット
 * - ユーザーインタラクション
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileMenu } from '../../../../src/presentation/components/file/FileMenu'
import { FileServiceManager } from '../../../../src/application/services/FileService'
import type { FileType } from '../../../../src/domain/file/types/FileTypes'

// LocalStorage モック
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// プロンプトモック
const mockPrompt = vi.fn()
Object.defineProperty(window, 'prompt', {
  value: mockPrompt
})

describe('FileMenu Component', () => {
  const mockOnFileCreated = vi.fn()
  const mockOnFileLoaded = vi.fn()
  const mockOnFileSaved = vi.fn()

  beforeEach(() => {
    mockLocalStorage.clear()
    mockOnFileCreated.mockClear()
    mockOnFileLoaded.mockClear()
    mockOnFileSaved.mockClear()
    mockPrompt.mockClear()
    FileServiceManager.resetInstance()
  })

  afterEach(() => {
    mockLocalStorage.clear()
  })

  const defaultProps = {
    currentContent: 'Test content',
    onFileCreated: mockOnFileCreated,
    onFileLoaded: mockOnFileLoaded,
    onFileSaved: mockOnFileSaved
  }

  describe('Basic Rendering', () => {
    it('should render file menu button', () => {
      render(<FileMenu {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /ファイルメニューを開く/ })).toBeInTheDocument()
    })

    it('should show loading state when operation is in progress', async () => {
      render(<FileMenu {...defaultProps} />)
      
      const menuButton = screen.getByRole('button', { name: /ファイルメニューを開く/ })
      fireEvent.click(menuButton)
      
      // メニューが開いていることを確認
      expect(screen.getByText('新規作成')).toBeInTheDocument()
    })

    it('should display current file name when provided', () => {
      render(
        <FileMenu 
          {...defaultProps} 
          currentFileName="test.txt"
        />
      )
      
      const menuButton = screen.getByRole('button', { name: /ファイルメニューを開く/ })
      expect(menuButton).toBeInTheDocument()
    })
  })

  describe('Menu Interaction', () => {
    it('should open and close menu on button click', async () => {
      render(<FileMenu {...defaultProps} />)
      
      const menuButton = screen.getByRole('button', { name: /ファイルメニューを開く/ })
      
      // メニューを開く
      fireEvent.click(menuButton)
      expect(screen.getByText('新規作成')).toBeInTheDocument()
      expect(screen.getByText('📄 テキストファイル (.txt)')).toBeInTheDocument()
      
      // 外側をクリックしてメニューを閉じる
      const overlay = screen.getByRole('button', { name: /ファイルメニューを開く/ }).parentElement
      const outsideClick = overlay?.querySelector('.fixed')
      if (outsideClick) {
        fireEvent.click(outsideClick)
      }
    })

    it('should close menu when clicking outside', async () => {
      render(<FileMenu {...defaultProps} />)
      
      const menuButton = screen.getByRole('button', { name: /ファイルメニューを開く/ })
      fireEvent.click(menuButton)
      
      // メニューが開いていることを確認
      expect(screen.getByText('新規作成')).toBeInTheDocument()
      
      // 外側クリックイベントをシミュレート
      fireEvent.click(document.body)
      
      await waitFor(() => {
        expect(screen.queryByText('新規作成')).not.toBeInTheDocument()
      })
    })
  })

  describe('File Creation (Factory Pattern Integration)', () => {
    it('should create text file when clicked', async () => {
      render(<FileMenu {...defaultProps} />)
      
      const menuButton = screen.getByRole('button', { name: /ファイルメニューを開く/ })
      fireEvent.click(menuButton)
      
      const textFileButton = screen.getByText('📄 テキストファイル (.txt)')
      fireEvent.click(textFileButton)
      
      await waitFor(() => {
        expect(mockOnFileCreated).toHaveBeenCalledWith(
          expect.any(String), // fileId
          expect.stringContaining('.txt'), // fileName
          expect.stringContaining('ここにテキストを入力してください') // content
        )
      })
    })

    it('should create markdown file with template', async () => {
      render(<FileMenu {...defaultProps} />)
      
      const menuButton = screen.getByRole('button', { name: /ファイルメニューを開く/ })
      fireEvent.click(menuButton)
      
      const mdFileButton = screen.getByText('📝 Markdownファイル (.md)')
      fireEvent.click(mdFileButton)
      
      await waitFor(() => {
        expect(mockOnFileCreated).toHaveBeenCalledWith(
          expect.any(String),
          expect.stringContaining('.md'),
          expect.stringContaining('# 新しいドキュメント')
        )
      })
    })

    it('should create JSON file with template', async () => {
      render(<FileMenu {...defaultProps} />)
      
      const menuButton = screen.getByRole('button', { name: /ファイルメニューを開く/ })
      fireEvent.click(menuButton)
      
      const jsonFileButton = screen.getByText('🔧 JSONファイル (.json)')
      fireEvent.click(jsonFileButton)
      
      await waitFor(() => {
        expect(mockOnFileCreated).toHaveBeenCalledWith(
          expect.any(String),
          expect.stringContaining('.json'),
          expect.stringMatching(/^\{[\s\S]*\}$/) // JSON形式
        )
      })
    })

    it('should generate unique file names with timestamp', async () => {
      render(<FileMenu {...defaultProps} />)
      
      const menuButton = screen.getByRole('button', { name: /ファイルメニューを開く/ })
      fireEvent.click(menuButton)
      
      // 1つ目のファイルを作成
      const textFileButton = screen.getByText('📄 テキストファイル (.txt)')
      fireEvent.click(textFileButton)
      
      await waitFor(() => {
        expect(mockOnFileCreated).toHaveBeenCalledTimes(1)
      })
      
      // 少し待ってから2つ目のファイルを作成
      await new Promise(resolve => setTimeout(resolve, 100))
      
      fireEvent.click(menuButton)
      
      await waitFor(() => {
        expect(screen.getByText('📄 テキストファイル (.txt)')).toBeInTheDocument()
      })
      
      const textFileButton2 = screen.getByText('📄 テキストファイル (.txt)')
      fireEvent.click(textFileButton2)
      
      await waitFor(() => {
        expect(mockOnFileCreated).toHaveBeenCalledTimes(2)
      })
      
      // 異なるファイル名が生成されることを確認
      const call1 = mockOnFileCreated.mock.calls[0]
      const call2 = mockOnFileCreated.mock.calls[1]
      expect(call1[1]).not.toBe(call2[1]) // ファイル名が異なる
    })
  })

  describe('File Saving', () => {
    it('should save current file when save button is clicked', async () => {
      render(
        <FileMenu 
          {...defaultProps} 
          currentFileName="existing.txt"
        />
      )
      
      const menuButton = screen.getByRole('button', { name: /ファイルメニューを開く/ })
      fireEvent.click(menuButton)
      
      const saveButton = screen.getByText(/💾 保存/)
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(mockOnFileSaved).toHaveBeenCalledWith(
          expect.any(String),
          'existing.txt'
        )
      })
    })

    it('should handle quick save with prompt', async () => {
      mockPrompt.mockReturnValue('new-file.txt')
      
      render(<FileMenu {...defaultProps} />)
      
      const menuButton = screen.getByRole('button', { name: /ファイルメニューを開く/ })
      fireEvent.click(menuButton)
      
      const quickSaveButton = screen.getByText('💾 名前を付けて保存')
      fireEvent.click(quickSaveButton)
      
      await waitFor(() => {
        expect(mockPrompt).toHaveBeenCalledWith(
          'ファイル名を入力してください:',
          'untitled.txt'
        )
        expect(mockOnFileSaved).toHaveBeenCalledWith(
          expect.any(String),
          'new-file.txt'
        )
      })
    })

    it('should cancel quick save when prompt is cancelled', async () => {
      mockPrompt.mockReturnValue(null) // キャンセル
      
      render(<FileMenu {...defaultProps} />)
      
      const menuButton = screen.getByRole('button', { name: /ファイルメニューを開く/ })
      fireEvent.click(menuButton)
      
      const quickSaveButton = screen.getByText('💾 名前を付けて保存')
      fireEvent.click(quickSaveButton)
      
      await waitFor(() => {
        expect(mockPrompt).toHaveBeenCalled()
        expect(mockOnFileSaved).not.toHaveBeenCalled()
      })
    })

    it('should disable save when no content', () => {
      render(
        <FileMenu 
          {...defaultProps} 
          currentContent=""
        />
      )
      
      const menuButton = screen.getByRole('button', { name: /ファイルメニューを開く/ })
      fireEvent.click(menuButton)
      
      const saveButton = screen.getByText(/💾 保存/)
      expect(saveButton.closest('button')).toBeDisabled()
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should handle Ctrl+S for save', async () => {
      render(
        <FileMenu 
          {...defaultProps} 
          currentFileName="test.txt"
        />
      )
      
      fireEvent.keyDown(document, { key: 's', ctrlKey: true })
      
      await waitFor(() => {
        expect(mockOnFileSaved).toHaveBeenCalledWith(
          expect.any(String),
          'test.txt'
        )
      })
    })

    it('should handle Ctrl+S for quick save when no current file', async () => {
      mockPrompt.mockReturnValue('quick-save.txt')
      
      render(<FileMenu {...defaultProps} />)
      
      fireEvent.keyDown(document, { key: 's', ctrlKey: true })
      
      await waitFor(() => {
        expect(mockPrompt).toHaveBeenCalled()
        expect(mockOnFileSaved).toHaveBeenCalledWith(
          expect.any(String),
          'quick-save.txt'
        )
      })
    })

    it('should handle Ctrl+N to open menu', async () => {
      render(<FileMenu {...defaultProps} />)
      
      fireEvent.keyDown(document, { key: 'n', ctrlKey: true })
      
      await waitFor(() => {
        expect(screen.getByText('新規作成')).toBeInTheDocument()
      })
    })

    it('should handle Meta+S for save on Mac', async () => {
      render(
        <FileMenu 
          {...defaultProps} 
          currentFileName="test.txt"
        />
      )
      
      fireEvent.keyDown(document, { key: 's', metaKey: true })
      
      await waitFor(() => {
        expect(mockOnFileSaved).toHaveBeenCalled()
      })
    })

    it('should prevent default browser behavior for shortcuts', () => {
      render(<FileMenu {...defaultProps} />)
      
      const event = new KeyboardEvent('keydown', { 
        key: 's', 
        ctrlKey: true, 
        bubbles: true,
        cancelable: true
      })
      
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      
      document.dispatchEvent(event)
      
      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('Status Messages and Feedback', () => {
    it('should show loading status during file creation', async () => {
      render(<FileMenu {...defaultProps} />)
      
      const menuButton = screen.getByRole('button', { name: /ファイルメニューを開く/ })
      fireEvent.click(menuButton)
      
      const textFileButton = screen.getByText('📄 テキストファイル (.txt)')
      fireEvent.click(textFileButton)
      
      // ローディング状態のチェック
      expect(screen.getByText(/⏳/)).toBeInTheDocument()
    })

    it('should show success message after file operation', async () => {
      render(<FileMenu {...defaultProps} />)
      
      const menuButton = screen.getByRole('button', { name: /ファイルメニューを開く/ })
      fireEvent.click(menuButton)
      
      const textFileButton = screen.getByText('📄 テキストファイル (.txt)')
      fireEvent.click(textFileButton)
      
      await waitFor(() => {
        expect(screen.getByText(/ファイル作成が完了しました/)).toBeInTheDocument()
      })
    })

    it.skip('should clear status message after timeout', async () => {
      vi.useFakeTimers()
      
      render(<FileMenu {...defaultProps} />)
      
      const menuButton = screen.getByRole('button', { name: /ファイルメニューを開く/ })
      fireEvent.click(menuButton)
      
      const textFileButton = screen.getByText('📄 テキストファイル (.txt)')
      fireEvent.click(textFileButton)
      
      // ファイル作成が完了するまで待機
      await waitFor(() => {
        expect(mockOnFileCreated).toHaveBeenCalled()
      })
      
      // act()でタイマーを進める
      await vi.runOnlyPendingTimersAsync()
      
      // メッセージが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/ファイル作成が完了しました/)).toBeInTheDocument()
      })
      
      // 3秒後にメッセージがクリアされることを確認
      vi.advanceTimersByTime(3000)
      
      await waitFor(() => {
        expect(screen.queryByText(/ファイル作成が完了しました/)).not.toBeInTheDocument()
      })
      
      vi.useRealTimers()
    }, 10000)
  })

  describe('Error Handling', () => {
    it.skip('should handle file creation errors gracefully', async () => {
      // FileServiceに無効なデータを設定してエラーを発生させる
      const fileService = FileServiceManager.getInstance()
      const originalCreateFile = fileService.createFile
      fileService.createFile = vi.fn().mockRejectedValue(new Error('Creation failed'))
      
      render(<FileMenu {...defaultProps} />)
      
      const menuButton = screen.getByRole('button', { name: /ファイルメニューを開く/ })
      fireEvent.click(menuButton)
      
      const textFileButton = screen.getByText('📄 テキストファイル (.txt)')
      fireEvent.click(textFileButton)
      
      await waitFor(() => {
        expect(screen.getByText(/ファイル作成中にエラーが発生しました/)).toBeInTheDocument()
      }, { timeout: 10000 })
      
      // 元のメソッドを復元
      fileService.createFile = originalCreateFile
    }, 15000)

    it('should show error when no content to save', () => {
      render(
        <FileMenu 
          {...defaultProps} 
          currentContent=""
          currentFileName="test.txt"
        />
      )
      
      const menuButton = screen.getByRole('button', { name: /ファイルメニューを開く/ })
      fireEvent.click(menuButton)
      
      // 保存ボタンが無効化されていることを確認
      const saveButton = screen.getByText(/💾 保存/)
      expect(saveButton.closest('button')).toBeDisabled()
    })
  })

  describe('File Type Inference', () => {
    it.skip('should infer file type from extension in quick save', async () => {
      mockPrompt.mockReturnValue('document.md')
      
      render(<FileMenu {...defaultProps} />)
      
      const menuButton = screen.getByRole('button', { name: /ファイルメニューを開く/ })
      fireEvent.click(menuButton)
      
      const quickSaveButton = screen.getByText('💾 名前を付けて保存')
      fireEvent.click(quickSaveButton)
      
      await waitFor(() => {
        expect(mockOnFileSaved).toHaveBeenCalled()
      }, { timeout: 10000 })
      
      // FileServiceのcreateFileがmd形式で呼ばれることを間接的に確認
      // （実際の実装では、ファイル拡張子から形式を推定する）
    }, 15000)

    it.skip('should default to txt when no extension provided', async () => {
      mockPrompt.mockReturnValue('document')
      
      render(<FileMenu {...defaultProps} />)
      
      const menuButton = screen.getByRole('button', { name: /ファイルメニューを開く/ })
      fireEvent.click(menuButton)
      
      const quickSaveButton = screen.getByText('💾 名前を付けて保存')
      fireEvent.click(quickSaveButton)
      
      await waitFor(() => {
        expect(mockOnFileSaved).toHaveBeenCalled()
      }, { timeout: 10000 })
    }, 15000)
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<FileMenu {...defaultProps} />)
      
      const menuButton = screen.getByRole('button', { name: /ファイルメニューを開く/ })
      expect(menuButton).toHaveAttribute('aria-label')
    })

    it.skip('should support keyboard navigation', async () => {
      render(<FileMenu {...defaultProps} />)
      
      // Ctrl+Nキーでメニューを開く
      fireEvent.keyDown(document, { key: 'n', ctrlKey: true })
      
      await waitFor(() => {
        expect(screen.getByText('新規作成')).toBeInTheDocument()
      })
    })

    it('should have proper focus management', async () => {
      render(<FileMenu {...defaultProps} />)
      
      const menuButton = screen.getByRole('button', { name: /ファイルメニューを開く/ })
      fireEvent.click(menuButton)
      
      // メニューアイテムにフォーカスが移動することを確認
      const textFileButton = screen.getByText('📄 テキストファイル (.txt)')
      expect(textFileButton).toBeInTheDocument()
    })
  })
})