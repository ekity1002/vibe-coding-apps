/**
 * FileService テストスイート
 * 
 * Facade Pattern の実装をテスト
 * - Factory Pattern と Repository Pattern の統合
 * - Observer Pattern の動作
 * - ファイル操作のユースケース
 * - エラーハンドリング
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FileService, FileServiceManager, type FileOperationObserver } from '../../../src/application/services/FileService'
import type { FileType, FileCreationOptions } from '../../../src/domain/file/types/FileTypes'

// LocalStorage のモック
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    length: Object.keys(store).length,
    key: (index: number) => Object.keys(store)[index] || null
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('FileService (Facade Pattern)', () => {
  let fileService: FileService
  let observerMock: any
  let observer: FileOperationObserver

  beforeEach(() => {
    fileService = new FileService()
    mockLocalStorage.clear()
    
    // Observer モックの設定
    observerMock = vi.fn()
    observer = { onFileOperation: observerMock }
    fileService.addObserver(observer)
  })

  afterEach(() => {
    mockLocalStorage.clear()
    fileService.removeObserver(observer)
    FileServiceManager.resetInstance()
  })

  describe('FileServiceManager (Singleton)', () => {
    it('should return the same instance', () => {
      const instance1 = FileServiceManager.getInstance()
      const instance2 = FileServiceManager.getInstance()
      
      expect(instance1).toBe(instance2)
    })

    it('should reset instance for testing', () => {
      const instance1 = FileServiceManager.getInstance()
      FileServiceManager.resetInstance()
      const instance2 = FileServiceManager.getInstance()
      
      expect(instance1).not.toBe(instance2)
    })
  })

  describe('File Creation (Factory Pattern Integration)', () => {
    it('should create text file successfully', async () => {
      const options: FileCreationOptions = {
        name: 'test.txt',
        content: 'Hello, World!'
      }

      const result = await fileService.createFile('txt', options)
      
      expect(result.success).toBe(true)
      expect(result.fileEntity).toBeTruthy()
      expect(result.file?.name).toBe('test.txt')
      expect(result.file?.type).toBe('txt')
      
      // Observer の呼び出しを確認
      expect(observerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'create',
          success: true,
          file: expect.objectContaining({ name: 'test.txt' })
        })
      )
    })

    it('should create markdown file with template', async () => {
      const options: FileCreationOptions = {
        name: 'readme.md'
        // content 省略でテンプレートを使用
      }

      const result = await fileService.createFile('md', options)
      
      expect(result.success).toBe(true)
      expect(result.fileEntity?.getContent()).toContain('# 新しいドキュメント')
      expect(result.file?.type).toBe('md')
    })

    it('should create and format JSON file', async () => {
      const options: FileCreationOptions = {
        name: 'config.json',
        content: '{"name":"test","value":123}'
      }

      const result = await fileService.createFile('json', options)
      
      expect(result.success).toBe(true)
      expect(result.fileEntity?.getContent()).toContain('{\n  "name": "test"')
      expect(result.file?.type).toBe('json')
    })

    it('should handle file creation errors', async () => {
      const options: FileCreationOptions = {
        name: 'invalid.json',
        content: 'invalid json content'
      }

      const result = await fileService.createFile('json', options)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
      
      // エラー時もObserverが呼ばれることを確認
      expect(observerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'create',
          success: false
        })
      )
    })

    it('should validate file creation options', async () => {
      const invalidOptions: FileCreationOptions = {
        name: '', // 無効なファイル名
        content: 'content'
      }

      const result = await fileService.createFile('txt', invalidOptions)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('ファイル名')
    })
  })

  describe('File Loading and Management', () => {
    let fileId: string

    beforeEach(async () => {
      // テスト用ファイルを作成
      const createResult = await fileService.createFile('txt', {
        name: 'test.txt',
        content: 'Initial content'
      })
      fileId = createResult.file!.id
      observerMock.mockClear() // 作成時の呼び出しをクリア
    })

    it('should load file by ID', async () => {
      const result = await fileService.loadFile(fileId)
      
      expect(result.success).toBe(true)
      expect(result.fileEntity?.getContent()).toBe('Initial content')
      expect(result.file?.name).toBe('test.txt')
      
      expect(observerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'load',
          success: true
        })
      )
    })

    it('should load file by name', async () => {
      const result = await fileService.loadFileByName('test.txt')
      
      expect(result.success).toBe(true)
      expect(result.fileEntity?.getContent()).toBe('Initial content')
    })

    it('should handle non-existent file loading', async () => {
      const result = await fileService.loadFile('non-existent-id')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('読み込みに失敗')
      
      expect(observerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'load',
          success: false
        })
      )
    })

    it('should update file content', async () => {
      const newContent = 'Updated content'
      const result = await fileService.updateFileContent(fileId, newContent)
      
      expect(result.success).toBe(true)
      expect(result.fileEntity?.getContent()).toBe(newContent)
      
      expect(observerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'update',
          success: true
        })
      )
    })

    it('should rename file', async () => {
      const newName = 'renamed.txt'
      const result = await fileService.renameFile(fileId, newName)
      
      expect(result.success).toBe(true)
      expect(result.fileEntity?.getMetadata().name).toBe(newName)
      
      expect(observerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'update',
          success: true
        })
      )
    })

    it('should delete file', async () => {
      const result = await fileService.deleteFile(fileId)
      
      expect(result.success).toBe(true)
      
      expect(observerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'delete',
          success: true
        })
      )

      // 削除後は読み込めないことを確認
      const loadResult = await fileService.loadFile(fileId)
      expect(loadResult.success).toBe(false)
    })
  })

  describe('File Listing and Search', () => {
    beforeEach(async () => {
      // 複数のテストファイルを作成
      const files = [
        { type: 'txt' as FileType, name: 'document1.txt', content: 'Text content 1' },
        { type: 'md' as FileType, name: 'readme.md', content: '# Markdown content' },
        { type: 'json' as FileType, name: 'config.json', content: '{"key": "value"}' },
        { type: 'txt' as FileType, name: 'notes.txt', content: 'Important notes' }
      ]

      for (const file of files) {
        await fileService.createFile(file.type, {
          name: file.name,
          content: file.content
        })
      }
      
      observerMock.mockClear()
    })

    it('should list all files', async () => {
      const files = await fileService.listAllFiles()
      
      expect(files).toHaveLength(4)
      expect(files.map(f => f.name)).toEqual(
        expect.arrayContaining(['document1.txt', 'readme.md', 'config.json', 'notes.txt'])
      )
    })

    it('should search files with criteria', async () => {
      const results = await fileService.searchFiles({
        types: ['txt'],
        namePattern: 'document'
      })
      
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('document1.txt')
    })

    it('should get file preview list', async () => {
      const previews = await fileService.getFilePreviewList(2)
      
      expect(previews).toHaveLength(2)
      expect(previews[0].metadata).toBeTruthy()
      expect(previews[0].preview).toBeTruthy()
      expect(previews[0].extension).toBeTruthy()
    })
  })

  describe('Observer Pattern Implementation', () => {
    it('should add and remove observers correctly', () => {
      const observer1: FileOperationObserver = { onFileOperation: vi.fn() }
      const observer2: FileOperationObserver = { onFileOperation: vi.fn() }

      fileService.addObserver(observer1)
      fileService.addObserver(observer2)
      
      // 同じオブザーバーを重複追加しても問題ないことを確認
      fileService.addObserver(observer1)
      
      fileService.removeObserver(observer1)
      
      // observer2 のみが残っていることを確認するため、操作を実行
      fileService.createFile('txt', { name: 'test.txt', content: 'content' })
      
      expect(observer1.onFileOperation).not.toHaveBeenCalled()
      expect(observer2.onFileOperation).toHaveBeenCalled()
      
      fileService.removeObserver(observer2)
    })

    it('should handle observer errors gracefully', async () => {
      const errorObserver: FileOperationObserver = {
        onFileOperation: vi.fn().mockImplementation(() => {
          throw new Error('Observer error')
        })
      }

      fileService.addObserver(errorObserver)
      
      // エラーが発生してもファイル作成は成功することを確認
      const result = await fileService.createFile('txt', {
        name: 'test.txt',
        content: 'content'
      })
      
      expect(result.success).toBe(true)
      expect(errorObserver.onFileOperation).toHaveBeenCalled()
      
      fileService.removeObserver(errorObserver)
    })

    it('should notify observers for all operations', async () => {
      const createResult = await fileService.createFile('txt', {
        name: 'test.txt',
        content: 'content'
      })
      const fileId = createResult.file!.id

      await fileService.updateFileContent(fileId, 'updated')
      await fileService.loadFile(fileId)
      await fileService.deleteFile(fileId)

      // 4回の操作（create, update, load, delete）でObserverが呼ばれることを確認
      expect(observerMock).toHaveBeenCalledTimes(4)
      
      const operations = observerMock.mock.calls.map(call => call[0].operation)
      expect(operations).toEqual(['create', 'update', 'load', 'delete'])
    })
  })

  describe('File Type Support and Validation', () => {
    it('should return supported file types', () => {
      const types = fileService.getSupportedFileTypes()
      
      expect(types).toEqual(['txt', 'md', 'json'])
      expect(types).toHaveLength(3)
    })

    it('should validate file type support', () => {
      expect(fileService.isFileTypeSupported('txt')).toBe(true)
      expect(fileService.isFileTypeSupported('md')).toBe(true)
      expect(fileService.isFileTypeSupported('json')).toBe(true)
      expect(fileService.isFileTypeSupported('pdf')).toBe(false)
      expect(fileService.isFileTypeSupported('doc')).toBe(false)
    })

    it('should handle unsupported file type creation', async () => {
      const result = await fileService.createFile('pdf' as FileType, {
        name: 'test.pdf',
        content: 'content'
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Unsupported file type')
    })
  })

  describe('Storage Management Integration', () => {
    beforeEach(async () => {
      // テストデータを作成
      await fileService.createFile('txt', { name: 'test1.txt', content: 'content1' })
      await fileService.createFile('md', { name: 'test2.md', content: '# content2' })
      observerMock.mockClear()
    })

    it('should get storage statistics', async () => {
      const stats = await fileService.getStorageStatistics()
      
      expect(stats.totalFiles).toBe(2)
      expect(stats.fileTypeCount.txt).toBe(1)
      expect(stats.fileTypeCount.md).toBe(1)
      expect(stats.fileTypeCount.json).toBe(0)
      expect(stats.totalSize).toBeGreaterThan(0)
    })

    it('should clear storage', async () => {
      const result = await fileService.clearStorage()
      
      expect(result.success).toBe(true)
      
      const files = await fileService.listAllFiles()
      expect(files).toHaveLength(0)
    })

    it('should export data', async () => {
      const exportResult = await fileService.exportData()
      
      expect(exportResult.success).toBe(true)
      expect(exportResult.data).toBeTruthy()
      
      const data = JSON.parse(exportResult.data!)
      expect(data.files).toHaveLength(2)
    })

    it('should import data', async () => {
      const exportResult = await fileService.exportData()
      await fileService.clearStorage()
      
      const importResult = await fileService.importData(exportResult.data!)
      
      expect(importResult.success).toBe(true)
      
      const files = await fileService.listAllFiles()
      expect(files).toHaveLength(2)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle file content validation errors', async () => {
      const result = await fileService.updateFileContent('non-existent', 'content')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('ファイルが見つかりません')
    })

    it('should handle file entity reconstruction errors', async () => {
      // 無効なファイルタイプでメタデータを直接操作
      mockLocalStorage.setItem('text-editor-files', JSON.stringify([{
        metadata: {
          id: 'invalid',
          name: 'invalid.xyz',
          type: 'xyz', // サポートされていない形式
          size: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        content: 'content',
        savedAt: new Date().toISOString(),
        version: 1
      }]))

      const result = await fileService.loadFile('invalid')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Unsupported file type')
    })

    it('should handle concurrent operations safely', async () => {
      const promises = []
      
      // 複数の並行操作を実行
      for (let i = 0; i < 5; i++) {
        promises.push(
          fileService.createFile('txt', {
            name: `concurrent-${i}.txt`,
            content: `content ${i}`
          })
        )
      }

      const results = await Promise.all(promises)
      
      // 全ての操作が成功することを確認
      expect(results.every(r => r.success)).toBe(true)
      
      // 全ての Observer 通知が送信されることを確認
      expect(observerMock).toHaveBeenCalledTimes(5)
      
      // 実際に5つのファイルが作成されていることを確認
      const files = await fileService.listAllFiles()
      expect(files).toHaveLength(5)
    })

    it('should handle large file operations', async () => {
      const largeContent = 'x'.repeat(100000) // 100KB
      
      const result = await fileService.createFile('txt', {
        name: 'large.txt',
        content: largeContent
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('ファイルサイズが大きすぎます')
    })
  })

  describe('Integration with File Entities', () => {
    it('should preserve file entity functionality after reconstruction', async () => {
      // Markdownファイルを作成
      const createResult = await fileService.createFile('md', {
        name: 'test.md',
        content: '# Title 1\n\n## Title 2\n\nContent here'
      })
      
      expect(createResult.success).toBe(true)
      const fileId = createResult.file!.id
      
      // ファイルを再読み込み
      const loadResult = await fileService.loadFile(fileId)
      
      expect(loadResult.success).toBe(true)
      
      // MarkdownFile固有の機能が使用できることを確認
      if (loadResult.fileEntity && 'getHeadings' in loadResult.fileEntity) {
        const headings = (loadResult.fileEntity as any).getHeadings()
        expect(headings).toHaveLength(2)
        expect(headings[0].text).toBe('Title 1')
        expect(headings[1].text).toBe('Title 2')
      }
    })

    it('should maintain entity validation after updates', async () => {
      // JSONファイルを作成
      const createResult = await fileService.createFile('json', {
        name: 'test.json',
        content: '{"valid": "json"}'
      })
      
      expect(createResult.success).toBe(true)
      const fileId = createResult.file!.id
      
      // 無効なJSONで更新を試行
      const updateResult = await fileService.updateFileContent(fileId, '{"invalid": json}')
      
      expect(updateResult.success).toBe(false)
      expect(updateResult.error).toContain('JSON')
      
      // 元のコンテンツが保持されていることを確認
      const loadResult = await fileService.loadFile(fileId)
      expect(loadResult.fileEntity?.getContent()).toBe('{\n  "valid": "json"\n}')
    })
  })
})