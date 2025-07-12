/**
 * Factory Pattern 統合テストスイート
 * 
 * 複数のデザインパターンが連携した統合シナリオをテスト
 * - Factory Pattern + Repository Pattern + Observer Pattern
 * - エンドツーエンドのファイル操作フロー
 * - パフォーマンステスト
 * - エラー復旧テスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FileServiceManager } from '../../src/application/services/FileService'
import { FileMenu } from '../../src/presentation/components/file/FileMenu'
import { FileExplorer } from '../../src/presentation/components/file/FileExplorer'
import { SaveDialog } from '../../src/presentation/components/file/SaveDialog'
import { LoadDialog } from '../../src/presentation/components/file/LoadDialog'
import type { FileType, FileOperationNotification } from '../../src/domain/file/types/FileTypes'

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

// confirm/prompt モック
const mockConfirm = vi.fn()
const mockPrompt = vi.fn()
Object.defineProperty(window, 'confirm', { value: mockConfirm })
Object.defineProperty(window, 'prompt', { value: mockPrompt })

describe('Factory Pattern Integration Tests', () => {
  let fileService: any
  let observerNotifications: FileOperationNotification[] = []

  beforeEach(() => {
    mockLocalStorage.clear()
    observerNotifications = []
    mockConfirm.mockClear()
    mockPrompt.mockClear()
    
    FileServiceManager.resetInstance()
    fileService = FileServiceManager.getInstance()
    
    // Observer を設定して通知を記録
    fileService.addObserver({
      onFileOperation: (notification: FileOperationNotification) => {
        observerNotifications.push(notification)
      }
    })
  })

  afterEach(() => {
    mockLocalStorage.clear()
    observerNotifications = []
  })

  describe('End-to-End File Operations', () => {
    it('should complete full file lifecycle: create → save → load → update → delete', async () => {
      // Phase 1: ファイル作成 (Factory Pattern)
      const createResult = await fileService.createFile('txt', {
        name: 'lifecycle-test.txt',
        content: 'Initial content'
      })
      
      expect(createResult.success).toBe(true)
      expect(createResult.fileEntity).toBeTruthy()
      const fileId = createResult.file!.id
      
      // Observer 通知の確認
      expect(observerNotifications).toHaveLength(1)
      expect(observerNotifications[0].operation).toBe('create')
      expect(observerNotifications[0].success).toBe(true)
      
      // Phase 2: ファイル読み込み (Repository Pattern)
      const loadResult = await fileService.loadFile(fileId)
      
      expect(loadResult.success).toBe(true)
      expect(loadResult.fileEntity?.getContent()).toBe('Initial content')
      
      // Phase 3: ファイル更新
      const updateResult = await fileService.updateFileContent(fileId, 'Updated content')
      
      expect(updateResult.success).toBe(true)
      expect(updateResult.fileEntity?.getContent()).toBe('Updated content')
      
      // Phase 4: ファイル削除
      const deleteResult = await fileService.deleteFile(fileId)
      
      expect(deleteResult.success).toBe(true)
      
      // 削除後は読み込めないことを確認
      const loadAfterDelete = await fileService.loadFile(fileId)
      expect(loadAfterDelete.success).toBe(false)
      
      // 全操作でObserver通知が送信されたことを確認
      expect(observerNotifications).toHaveLength(4) // create, load, update, delete
      expect(observerNotifications.map(n => n.operation)).toEqual(['create', 'load', 'update', 'delete'])
    })

    it('should handle multiple file types in integrated workflow', async () => {
      const fileTypes: FileType[] = ['txt', 'md', 'json']
      const createdFiles: any[] = []
      
      // 複数のファイル形式を作成
      for (const type of fileTypes) {
        const result = await fileService.createFile(type, {
          name: `test.${type}`,
          content: type === 'json' ? '{"test": true}' : `Test ${type} content`
        })
        
        expect(result.success).toBe(true)
        createdFiles.push(result)
      }
      
      // 全ファイルが作成されていることを確認
      const allFiles = await fileService.listAllFiles()
      expect(allFiles).toHaveLength(3)
      
      // 各ファイル形式が正しく処理されていることを確認
      for (let i = 0; i < fileTypes.length; i++) {
        const file = allFiles.find(f => f.type === fileTypes[i])
        expect(file).toBeTruthy()
        expect(file!.name).toBe(`test.${fileTypes[i]}`)
      }
      
      // 検索機能のテスト
      const txtFiles = await fileService.searchFiles({ types: ['txt'] })
      expect(txtFiles).toHaveLength(1)
      
      const mdFiles = await fileService.searchFiles({ types: ['md'] })
      expect(mdFiles).toHaveLength(1)
      
      const jsonFiles = await fileService.searchFiles({ types: ['json'] })
      expect(jsonFiles).toHaveLength(1)
    })

    it('should maintain data consistency across storage operations', async () => {
      // 複数のファイルを作成
      const files = [
        { type: 'txt' as FileType, name: 'file1.txt', content: 'Content 1' },
        { type: 'md' as FileType, name: 'file2.md', content: '# Header 2' },
        { type: 'json' as FileType, name: 'file3.json', content: '{"id": 3}' }
      ]
      
      const createdFileIds: string[] = []
      
      for (const file of files) {
        const result = await fileService.createFile(file.type, file)
        expect(result.success).toBe(true)
        createdFileIds.push(result.file!.id)
      }
      
      // エクスポート
      const exportResult = await fileService.exportData()
      expect(exportResult.success).toBe(true)
      
      const exportData = JSON.parse(exportResult.data!)
      expect(exportData.files).toHaveLength(3)
      
      // ストレージをクリア
      await fileService.clearStorage()
      const emptyFiles = await fileService.listAllFiles()
      expect(emptyFiles).toHaveLength(0)
      
      // インポートで復元
      const importResult = await fileService.importData(exportResult.data!)
      expect(importResult.success).toBe(true)
      
      // データが正しく復元されていることを確認
      const restoredFiles = await fileService.listAllFiles()
      expect(restoredFiles).toHaveLength(3)
      
      for (const originalFile of files) {
        const restored = restoredFiles.find(f => f.name === originalFile.name)
        expect(restored).toBeTruthy()
        expect(restored!.type).toBe(originalFile.type)
        
        // コンテンツも正しく復元されていることを確認
        const loadResult = await fileService.loadFile(restored!.id)
        expect(loadResult.success).toBe(true)
        
        if (originalFile.type === 'json') {
          // JSONは整形されるため、構造が同じかをチェック
          const originalJson = JSON.parse(originalFile.content)
          const restoredJson = JSON.parse(loadResult.fileEntity!.getContent())
          expect(restoredJson).toEqual(originalJson)
        } else if (originalFile.type === 'md') {
          // Markdownはテンプレートがない場合はそのまま
          expect(loadResult.fileEntity!.getContent()).toContain('Header 2')
        } else {
          expect(loadResult.fileEntity!.getContent()).toBe(originalFile.content)
        }
      }
    })
  })

  describe('UI Component Integration', () => {
    it('should integrate FileMenu with FileService correctly', async () => {
      const mockOnFileCreated = vi.fn()
      const mockOnFileSaved = vi.fn()
      
      render(
        <FileMenu
          currentContent="Test content for integration"
          onFileCreated={mockOnFileCreated}
          onFileSaved={mockOnFileSaved}
        />
      )
      
      // メニューを開く
      const menuButton = screen.getByRole('button', { name: /📁 ファイル/ })
      fireEvent.click(menuButton)
      
      // テキストファイルを作成
      const textFileButton = screen.getByText('📄 テキストファイル (.txt)')
      fireEvent.click(textFileButton)
      
      // コールバックが呼ばれることを確認
      await waitFor(() => {
        expect(mockOnFileCreated).toHaveBeenCalledWith(
          expect.any(String),
          expect.stringContaining('.txt'),
          expect.any(String)
        )
      })
      
      // FileServiceに実際にファイルが作成されていることを確認
      const files = await fileService.listAllFiles()
      expect(files).toHaveLength(1)
      expect(files[0].type).toBe('txt')
    })

    it('should integrate SaveDialog with file operations', async () => {
      const mockOnSaveComplete = vi.fn()
      
      render(
        <SaveDialog
          isOpen={true}
          onClose={() => {}}
          content="Content to save in integration test"
          onSaveComplete={mockOnSaveComplete}
          defaultFileName="integration-test.txt"
          defaultFileType="txt"
        />
      )
      
      // ファイル名を入力
      const nameInput = screen.getByDisplayValue('integration-test.txt')
      expect(nameInput).toBeInTheDocument()
      
      // 保存ボタンをクリック
      const saveButton = screen.getByText('新規保存')
      fireEvent.click(saveButton)
      
      // 保存完了コールバックが呼ばれることを確認
      await waitFor(() => {
        expect(mockOnSaveComplete).toHaveBeenCalledWith(
          expect.any(String),
          'integration-test.txt',
          'txt'
        )
      })
      
      // FileServiceにファイルが保存されていることを確認
      const files = await fileService.listAllFiles()
      expect(files).toHaveLength(1)
      expect(files[0].name).toBe('integration-test.txt')
    })

    it('should integrate LoadDialog with file listing', async () => {
      // 事前にテストファイルを作成
      await fileService.createFile('txt', { name: 'load-test-1.txt', content: 'Content 1' })
      await fileService.createFile('md', { name: 'load-test-2.md', content: '# Content 2' })
      await fileService.createFile('json', { name: 'load-test-3.json', content: '{"test": true}' })
      
      const mockOnFileSelect = vi.fn()
      
      render(
        <LoadDialog
          isOpen={true}
          onClose={() => {}}
          onFileSelect={mockOnFileSelect}
          allowedTypes={['txt', 'md', 'json']}
        />
      )
      
      // ファイル一覧が表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('load-test-1.txt')).toBeInTheDocument()
        expect(screen.getByText('load-test-2.md')).toBeInTheDocument()
        expect(screen.getByText('load-test-3.json')).toBeInTheDocument()
      })
      
      // ファイルを選択
      const txtFile = screen.getByText('load-test-1.txt')
      fireEvent.click(txtFile)
      
      // 開くボタンをクリック
      const openButton = screen.getByText('📂 開く')
      fireEvent.click(openButton)
      
      // ファイル選択コールバックが呼ばれることを確認
      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(
          expect.any(String),
          'load-test-1.txt',
          'Content 1',
          'txt'
        )
      })
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large number of files efficiently', async () => {
      const startTime = Date.now()
      
      // 100個のファイルを作成
      const createPromises = []
      for (let i = 0; i < 100; i++) {
        createPromises.push(
          fileService.createFile('txt', {
            name: `performance-test-${i}.txt`,
            content: `Content for file ${i}`
          })
        )
      }
      
      const results = await Promise.all(createPromises)
      const createTime = Date.now() - startTime
      
      // 全ての作成が成功していることを確認
      expect(results.every(r => r.success)).toBe(true)
      
      // 作成時間が合理的な範囲内であることを確認（10秒以内）
      expect(createTime).toBeLessThan(10000)
      
      // リスト取得のパフォーマンステスト
      const listStartTime = Date.now()
      const files = await fileService.listAllFiles()
      const listTime = Date.now() - listStartTime
      
      expect(files).toHaveLength(100)
      expect(listTime).toBeLessThan(1000) // 1秒以内
      
      // 検索のパフォーマンステスト
      const searchStartTime = Date.now()
      const searchResults = await fileService.searchFiles({
        namePattern: 'performance-test-5'
      })
      const searchTime = Date.now() - searchStartTime
      
      expect(searchResults).toHaveLength(11) // performance-test-5, performance-test-50-59
      expect(searchTime).toBeLessThan(500) // 0.5秒以内
    })

    it('should handle concurrent operations safely', async () => {
      const concurrentOperations = []
      
      // 同時に複数の操作を実行
      for (let i = 0; i < 10; i++) {
        concurrentOperations.push(
          fileService.createFile('txt', {
            name: `concurrent-${i}.txt`,
            content: `Concurrent content ${i}`
          })
        )
      }
      
      // 作成と同時に読み込み操作も実行
      concurrentOperations.push(fileService.listAllFiles())
      concurrentOperations.push(fileService.getStorageStatistics())
      
      const results = await Promise.all(concurrentOperations)
      
      // 作成操作がすべて成功していることを確認
      const createResults = results.slice(0, 10)
      expect(createResults.every(r => r.success)).toBe(true)
      
      // 読み込み操作も成功していることを確認
      const listResult = results[10] as any[]
      expect(Array.isArray(listResult)).toBe(true)
      expect(listResult.length).toBeGreaterThan(0)
      
      const statsResult = results[11] as any
      expect(statsResult.totalFiles).toBeGreaterThan(0)
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should recover from storage corruption', async () => {
      // 正常なファイルを作成
      await fileService.createFile('txt', {
        name: 'before-corruption.txt',
        content: 'Content before corruption'
      })
      
      // ストレージを手動で破損
      mockLocalStorage.setItem('text-editor-files', 'corrupted json data')
      
      // 新しいファイル作成が依然として機能することを確認
      const result = await fileService.createFile('txt', {
        name: 'after-corruption.txt',
        content: 'Content after corruption'
      })
      
      expect(result.success).toBe(true)
      
      // リスト取得が空配列を返すことを確認（破損データは無視）
      const files = await fileService.listAllFiles()
      expect(files).toHaveLength(1) // 新しく作成されたファイルのみ
      expect(files[0].name).toBe('after-corruption.txt')
    })

    it('should handle storage quota exceeded gracefully', async () => {
      // localStorageの容量制限をシミュレート
      const originalSetItem = mockLocalStorage.setItem
      mockLocalStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })
      
      const result = await fileService.createFile('txt', {
        name: 'quota-test.txt',
        content: 'Content that exceeds quota'
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('QuotaExceededError')
      
      // Observer が エラー通知を送信することを確認
      expect(observerNotifications).toHaveLength(1)
      expect(observerNotifications[0].success).toBe(false)
      
      // 元のメソッドを復元
      mockLocalStorage.setItem = originalSetItem
    })

    it('should maintain consistency during partial failures', async () => {
      // 一部のファイル作成を成功、一部を失敗させる
      const operations = [
        fileService.createFile('txt', { name: 'success-1.txt', content: 'Success 1' }),
        fileService.createFile('json', { name: 'fail.json', content: 'invalid json {' }),
        fileService.createFile('txt', { name: 'success-2.txt', content: 'Success 2' })
      ]
      
      const results = await Promise.all(operations)
      
      // 成功と失敗が適切に処理されることを確認
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false) // 無効なJSON
      expect(results[2].success).toBe(true)
      
      // 成功したファイルのみがストレージに保存されていることを確認
      const files = await fileService.listAllFiles()
      expect(files).toHaveLength(2)
      expect(files.map(f => f.name)).toEqual(['success-1.txt', 'success-2.txt'])
      
      // Observer 通知が全操作に対して送信されることを確認
      expect(observerNotifications).toHaveLength(3)
      expect(observerNotifications[0].success).toBe(true)
      expect(observerNotifications[1].success).toBe(false)
      expect(observerNotifications[2].success).toBe(true)
    })
  })

  describe('Factory Pattern Specific Integration', () => {
    it('should demonstrate polymorphism through factory-created entities', async () => {
      // 異なる形式のファイルを作成
      const txtResult = await fileService.createFile('txt', {
        name: 'polymorphism.txt',
        content: 'Plain text content with some words for counting'
      })
      
      const mdResult = await fileService.createFile('md', {
        name: 'polymorphism.md',
        content: '# Title 1\n\n## Title 2\n\nMarkdown content'
      })
      
      const jsonResult = await fileService.createFile('json', {
        name: 'polymorphism.json',
        content: '{"name": "test", "nested": {"value": 42}}'
      })
      
      expect(txtResult.success).toBe(true)
      expect(mdResult.success).toBe(true)
      expect(jsonResult.success).toBe(true)
      
      // 各エンティティが固有の機能を持つことを確認
      
      // TextFile の機能
      if (txtResult.fileEntity && 'getWordCount' in txtResult.fileEntity) {
        const wordCount = (txtResult.fileEntity as any).getWordCount()
        expect(wordCount).toBeGreaterThan(0)
      }
      
      // MarkdownFile の機能
      if (mdResult.fileEntity && 'getHeadings' in mdResult.fileEntity) {
        const headings = (mdResult.fileEntity as any).getHeadings()
        expect(headings).toHaveLength(2)
        expect(headings[0].text).toBe('Title 1')
        expect(headings[1].text).toBe('Title 2')
      }
      
      // JsonFile の機能
      if (jsonResult.fileEntity && 'getValueAtPath' in jsonResult.fileEntity) {
        const value = (jsonResult.fileEntity as any).getValueAtPath('nested.value')
        expect(value).toBe(42)
      }
      
      // 共通の FileEntity インターフェース
      expect(txtResult.fileEntity!.getExtension()).toBe('.txt')
      expect(mdResult.fileEntity!.getExtension()).toBe('.md')
      expect(jsonResult.fileEntity!.getExtension()).toBe('.json')
      
      // バリデーション機能
      expect(txtResult.fileEntity!.validate().isValid).toBe(true)
      expect(mdResult.fileEntity!.validate().isValid).toBe(true)
      expect(jsonResult.fileEntity!.validate().isValid).toBe(true)
    })

    it('should demonstrate factory registration and dynamic creation', async () => {
      // サポートされているファイル形式の確認
      const supportedTypes = fileService.getSupportedFileTypes()
      expect(supportedTypes).toEqual(['txt', 'md', 'json'])
      
      // 各形式のファクトリーが正しく登録されていることを確認
      for (const type of supportedTypes) {
        const result = await fileService.createFile(type, {
          name: `dynamic-${type}.${type}`,
          content: type === 'json' ? '{}' : `Content for ${type}`
        })
        
        expect(result.success).toBe(true)
        expect(result.file!.type).toBe(type)
      }
      
      // 未サポートの形式でエラーになることを確認
      expect(fileService.isFileTypeSupported('pdf')).toBe(false)
      
      const unsupportedResult = await fileService.createFile('pdf' as FileType, {
        name: 'unsupported.pdf',
        content: 'PDF content'
      })
      
      expect(unsupportedResult.success).toBe(false)
      expect(unsupportedResult.error).toContain('Unsupported file type')
    })
  })
})