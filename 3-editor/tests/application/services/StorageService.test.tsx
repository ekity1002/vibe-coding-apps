/**
 * StorageService テストスイート
 * 
 * Repository Pattern の実装をテスト
 * - データの永続化・読み込み
 * - 検索・フィルタリング機能
 * - ストレージ統計情報
 * - エラーハンドリング
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { StorageService } from '../../../src/application/services/StorageService'
import type { FileMetadata, FileSearchCriteria, FileType } from '../../../src/domain/file/types/FileTypes'

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

// グローバルなlocalStorageをモック
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('StorageService (Repository Pattern)', () => {
  let storageService: StorageService
  let testMetadata: FileMetadata

  beforeEach(() => {
    storageService = new StorageService()
    mockLocalStorage.clear()
    
    // テスト用のメタデータ
    testMetadata = {
      id: 'test-id-123',
      name: 'test.txt',
      type: 'txt' as FileType,
      size: 12,
      createdAt: new Date('2025-01-01T10:00:00Z'),
      updatedAt: new Date('2025-01-01T10:00:00Z')
    }
  })

  afterEach(() => {
    mockLocalStorage.clear()
  })

  describe('Basic CRUD Operations', () => {
    it('should save and load file correctly', async () => {
      const content = 'Hello, World!'
      
      // 保存
      const saveResult = await storageService.save(testMetadata, content)
      expect(saveResult.success).toBe(true)
      expect(saveResult.file?.name).toBe('test.txt')
      expect(saveResult.operation).toBe('save')

      // 読み込み
      const loadResult = await storageService.load('test-id-123')
      expect(loadResult.success).toBe(true)
      expect(loadResult.file?.name).toBe('test.txt')
      expect(loadResult.content).toBe(content)
    })

    it('should update existing file on save', async () => {
      const initialContent = 'Initial content'
      const updatedContent = 'Updated content'
      
      // 初回保存
      await storageService.save(testMetadata, initialContent)
      
      // 同じファイル名で再保存（更新）
      const updateResult = await storageService.save(testMetadata, updatedContent)
      expect(updateResult.success).toBe(true)
      expect(updateResult.operation).toBe('update')

      // 更新されたコンテンツを確認
      const loadResult = await storageService.load('test-id-123')
      expect(loadResult.content).toBe(updatedContent)
    })

    it('should delete file correctly', async () => {
      const content = 'Test content'
      
      // 保存
      await storageService.save(testMetadata, content)
      
      // 削除
      const deleteResult = await storageService.delete('test-id-123')
      expect(deleteResult.success).toBe(true)
      expect(deleteResult.operation).toBe('delete')

      // 削除確認
      const loadResult = await storageService.load('test-id-123')
      expect(loadResult.success).toBe(false)
      expect(loadResult.error).toContain('ファイルが見つかりません')
    })

    it('should handle non-existent file deletion', async () => {
      const deleteResult = await storageService.delete('non-existent-id')
      
      expect(deleteResult.success).toBe(false)
      expect(deleteResult.error).toContain('ファイルが見つかりません')
    })

    it('should load file by name', async () => {
      const content = 'Test content'
      await storageService.save(testMetadata, content)

      const loadResult = await storageService.loadByName('test.txt')
      
      expect(loadResult.success).toBe(true)
      expect(loadResult.file?.name).toBe('test.txt')
      expect(loadResult.content).toBe(content)
    })
  })

  describe('File Listing and Search', () => {
    beforeEach(async () => {
      // テスト用の複数ファイルを保存
      const files = [
        { 
          metadata: { ...testMetadata, id: 'txt-1', name: 'document1.txt', type: 'txt' as FileType, size: 10 },
          content: 'Text content 1'
        },
        { 
          metadata: { ...testMetadata, id: 'md-1', name: 'readme.md', type: 'md' as FileType, size: 20 },
          content: '# Markdown content'
        },
        { 
          metadata: { ...testMetadata, id: 'json-1', name: 'config.json', type: 'json' as FileType, size: 30 },
          content: '{"key": "value"}'
        },
        { 
          metadata: { ...testMetadata, id: 'txt-2', name: 'notes.txt', type: 'txt' as FileType, size: 15 },
          content: 'Important notes here'
        }
      ]

      for (const file of files) {
        await storageService.save(file.metadata, file.content)
      }
    })

    it('should list all files', async () => {
      const files = await storageService.listAll()
      
      expect(files).toHaveLength(4)
      expect(files.map(f => f.name)).toEqual(
        expect.arrayContaining(['document1.txt', 'readme.md', 'config.json', 'notes.txt'])
      )
    })

    it('should search files by name pattern', async () => {
      const criteria: FileSearchCriteria = {
        namePattern: 'txt'
      }

      const results = await storageService.search(criteria)
      
      expect(results).toHaveLength(2) // document1.txt, notes.txt
      expect(results.every(f => f.name.includes('txt'))).toBe(true)
    })

    it('should search files by type', async () => {
      const criteria: FileSearchCriteria = {
        types: ['md']
      }

      const results = await storageService.search(criteria)
      
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('readme.md')
      expect(results[0].type).toBe('md')
    })

    it('should search files by multiple types', async () => {
      const criteria: FileSearchCriteria = {
        types: ['txt', 'json']
      }

      const results = await storageService.search(criteria)
      
      expect(results).toHaveLength(3) // 2 txt + 1 json
      expect(results.every(f => ['txt', 'json'].includes(f.type))).toBe(true)
    })

    it('should search files by size range', async () => {
      const criteria: FileSearchCriteria = {
        sizeRange: { min: 15, max: 25 }
      }

      const results = await storageService.search(criteria)
      
      expect(results).toHaveLength(2) // readme.md (20), notes.txt (15)
      expect(results.every(f => f.size >= 15 && f.size <= 25)).toBe(true)
    })

    it('should search files by date range', async () => {
      const fromDate = new Date('2024-12-31')
      const toDate = new Date('2025-01-02')
      
      const criteria: FileSearchCriteria = {
        createdDateRange: { from: fromDate, to: toDate }
      }

      const results = await storageService.search(criteria)
      
      expect(results).toHaveLength(4) // 全ファイルが範囲内
    })

    it('should combine multiple search criteria', async () => {
      const criteria: FileSearchCriteria = {
        namePattern: 'document',
        types: ['txt'],
        sizeRange: { min: 5, max: 15 }
      }

      const results = await storageService.search(criteria)
      
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('document1.txt')
    })
  })

  describe('File Preview and Statistics', () => {
    beforeEach(async () => {
      const files = [
        { 
          metadata: { ...testMetadata, id: 'old', name: 'old.txt', 
                     createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
          content: 'Old content' 
        },
        { 
          metadata: { ...testMetadata, id: 'new', name: 'new.txt',
                     createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
          content: 'New content'
        },
        { 
          metadata: { ...testMetadata, id: 'md', name: 'file.md', type: 'md' as FileType },
          content: '# Title\nContent here'
        }
      ]

      for (const file of files) {
        await storageService.save(file.metadata, file.content)
      }
    })

    it('should get file preview list', async () => {
      const previews = await storageService.getPreviewList(2)
      
      expect(previews).toHaveLength(2)
      expect(previews[0].metadata.name).toBe('new.txt') // 最新順
      expect(previews[0].preview).toBe('New content')
      expect(previews[0].extension).toBe('.txt')
    })

    it('should generate preview for different file types', async () => {
      const previews = await storageService.getPreviewList()
      const mdPreview = previews.find(p => p.metadata.type === 'md')
      
      expect(mdPreview).toBeTruthy()
      expect(mdPreview?.preview).toBe('# Title Content here')
      expect(mdPreview?.extension).toBe('.md')
    })

    it('should truncate long preview content', async () => {
      const longContent = 'a'.repeat(200)
      await storageService.save({
        ...testMetadata,
        id: 'long',
        name: 'long.txt'
      }, longContent)

      const previews = await storageService.getPreviewList()
      const longPreview = previews.find(p => p.metadata.name === 'long.txt')
      
      expect(longPreview?.preview.length).toBeLessThanOrEqual(100)
      expect(longPreview?.preview).toMatch(/\.\.\.$/) // 省略記号で終わる
    })

    it('should calculate storage statistics correctly', async () => {
      const stats = await storageService.getStatistics()
      
      expect(stats.totalFiles).toBe(3)
      expect(stats.fileTypeCount.txt).toBe(2)
      expect(stats.fileTypeCount.md).toBe(1)
      expect(stats.fileTypeCount.json).toBe(0)
      expect(stats.totalSize).toBeGreaterThan(0)
      expect(stats.storageSize).toBeGreaterThan(0)
      expect(stats.oldestFile?.createdAt).toEqual(new Date('2024-01-01'))
      expect(stats.newestFile?.updatedAt).toEqual(new Date('2025-01-01'))
    })
  })

  describe('Storage Management', () => {
    beforeEach(async () => {
      // テストデータを設定
      await storageService.save(testMetadata, 'test content')
    })

    it('should clear all storage', async () => {
      const clearResult = await storageService.clear()
      
      expect(clearResult.success).toBe(true)
      
      const files = await storageService.listAll()
      expect(files).toHaveLength(0)
    })

    it('should export data correctly', async () => {
      const exportResult = await storageService.exportData()
      
      expect(exportResult.success).toBe(true)
      expect(exportResult.data).toBeTruthy()
      
      const exportData = JSON.parse(exportResult.data!)
      expect(exportData.version).toBe(1)
      expect(exportData.files).toHaveLength(1)
      expect(exportData.files[0].metadata.name).toBe('test.txt')
    })

    it('should import data correctly (merge mode)', async () => {
      // 既存データをクリア
      await storageService.clear()
      
      const importData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        files: [{
          metadata: testMetadata,
          content: 'imported content',
          savedAt: new Date().toISOString(),
          version: 1
        }]
      }

      const importResult = await storageService.importData(
        JSON.stringify(importData), 
        'merge'
      )
      
      expect(importResult.success).toBe(true)
      
      const files = await storageService.listAll()
      expect(files).toHaveLength(1)
      expect(files[0].name).toBe('test.txt')
    })

    it('should import data correctly (replace mode)', async () => {
      // 追加のファイルを作成
      await storageService.save({
        ...testMetadata,
        id: 'additional',
        name: 'additional.txt'
      }, 'additional content')

      const importData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        files: [{
          metadata: { ...testMetadata, id: 'imported', name: 'imported.txt' },
          content: 'imported content',
          savedAt: new Date().toISOString(),
          version: 1
        }]
      }

      const importResult = await storageService.importData(
        JSON.stringify(importData), 
        'replace'
      )
      
      expect(importResult.success).toBe(true)
      
      const files = await storageService.listAll()
      expect(files).toHaveLength(1) // 完全置換
      expect(files[0].name).toBe('imported.txt')
    })

    it('should handle invalid import data', async () => {
      const invalidData = '{"invalid": "data"}'
      
      const importResult = await storageService.importData(invalidData)
      
      expect(importResult.success).toBe(false)
      expect(importResult.error).toContain('Invalid import data format')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle localStorage errors gracefully', async () => {
      // localStorageのsetItemをモックしてエラーを発生させる
      const originalSetItem = mockLocalStorage.setItem
      mockLocalStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const saveResult = await storageService.save(testMetadata, 'content')
      
      expect(saveResult.success).toBe(false)
      expect(saveResult.error).toContain('Storage quota exceeded')

      // 元に戻す
      mockLocalStorage.setItem = originalSetItem
    })

    it('should handle corrupted storage data', async () => {
      // 破損したデータを手動で設定
      mockLocalStorage.setItem('text-editor-files', 'corrupted json')

      const files = await storageService.listAll()
      
      // 破損データの場合は空配列を返す
      expect(files).toEqual([])
    })

    it('should handle empty storage gracefully', async () => {
      const files = await storageService.listAll()
      const stats = await storageService.getStatistics()
      const previews = await storageService.getPreviewList()

      expect(files).toEqual([])
      expect(stats.totalFiles).toBe(0)
      expect(previews).toEqual([])
    })

    it('should validate search criteria', async () => {
      const invalidCriteria: FileSearchCriteria = {
        sizeRange: { min: 100, max: 50 } // 無効な範囲
      }

      const results = await storageService.search(invalidCriteria)
      
      // 無効な条件でも空配列を返す（エラーにしない）
      expect(results).toEqual([])
    })
  })

  describe('Metadata Cache', () => {
    it('should update metadata cache on save', async () => {
      await storageService.save(testMetadata, 'content')
      
      // キャッシュからのメタデータ取得をテスト
      const cachedData = mockLocalStorage.getItem('text-editor-metadata')
      expect(cachedData).toBeTruthy()
      
      const metadata = JSON.parse(cachedData!)
      expect(metadata).toHaveLength(1)
      expect(metadata[0].name).toBe('test.txt')
    })

    it('should update metadata cache on delete', async () => {
      await storageService.save(testMetadata, 'content')
      await storageService.delete('test-id-123')
      
      const cachedData = mockLocalStorage.getItem('text-editor-metadata')
      const metadata = JSON.parse(cachedData!)
      expect(metadata).toHaveLength(0)
    })

    it('should use metadata cache for fast listing', async () => {
      // データを保存してキャッシュを作成
      await storageService.save(testMetadata, 'content')
      
      // メインデータを手動で削除（キャッシュのみ残す）
      mockLocalStorage.removeItem('text-editor-files')
      
      const files = await storageService.listAll()
      
      // キャッシュから取得できることを確認
      expect(files).toHaveLength(1)
      expect(files[0].name).toBe('test.txt')
    })
  })
})