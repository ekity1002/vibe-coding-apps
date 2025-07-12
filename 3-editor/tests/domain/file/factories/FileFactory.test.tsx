/**
 * FileFactory テストスイート
 * 
 * Factory Pattern の核心機能をテスト
 * - 抽象ファクトリーの動作
 * - 具象ファクトリーの実装
 * - ファクトリーマネージャーの統合機能
 * - エラーハンドリング
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { FileFactoryManager, TextFileFactory, MarkdownFileFactory, JsonFileFactory } from '../../../../src/domain/file/factories/FileFactory'
import { TextFile } from '../../../../src/domain/file/entities/TextFile'
import { MarkdownFile } from '../../../../src/domain/file/entities/MarkdownFile'
import { JsonFile } from '../../../../src/domain/file/entities/JsonFile'
import type { FileType, FileCreationOptions } from '../../../../src/domain/file/types/FileTypes'

describe('Factory Pattern Implementation', () => {
  let factoryManager: FileFactoryManager

  beforeEach(() => {
    // テスト前に新しいインスタンスを取得
    factoryManager = FileFactoryManager.getInstance()
  })

  afterEach(() => {
    // テスト後のクリーンアップ
    FileFactoryManager.resetInstance()
  })

  describe('FileFactoryManager (Singleton + Abstract Factory)', () => {
    it('should return the same instance (Singleton Pattern)', () => {
      const instance1 = FileFactoryManager.getInstance()
      const instance2 = FileFactoryManager.getInstance()
      
      expect(instance1).toBe(instance2)
    })

    it('should support all file types', () => {
      const supportedTypes = factoryManager.getSupportedFileTypes()
      
      expect(supportedTypes).toEqual(['txt', 'md', 'json'])
      expect(supportedTypes).toHaveLength(3)
    })

    it('should validate file type support correctly', () => {
      expect(factoryManager.isSupported('txt')).toBe(true)
      expect(factoryManager.isSupported('md')).toBe(true)
      expect(factoryManager.isSupported('json')).toBe(true)
      expect(factoryManager.isSupported('pdf' as FileType)).toBe(false)
      expect(factoryManager.isSupported('doc' as FileType)).toBe(false)
    })

    it('should register and retrieve factories correctly', () => {
      const txtFactory = new TextFileFactory()
      factoryManager.registerFactory(txtFactory)
      
      const retrievedFactory = factoryManager.getFactory('txt')
      expect(retrievedFactory).toBe(txtFactory)
      expect(retrievedFactory.getSupportedFileType()).toBe('txt')
    })

    it('should throw error for unsupported file type', () => {
      expect(() => {
        factoryManager.getFactory('unsupported' as FileType)
      }).toThrow('サポートされていないファイル形式です: unsupported')
    })
  })

  describe('TextFileFactory (Concrete Factory)', () => {
    let txtFactory: TextFileFactory

    beforeEach(() => {
      txtFactory = new TextFileFactory()
    })

    it('should create TextFile instances', () => {
      const options: FileCreationOptions = {
        name: 'test.txt',
        content: 'Hello, World!'
      }

      const result = txtFactory.createFile(options)
      
      expect(result.success).toBe(true)
      expect(result.fileEntity).toBeInstanceOf(TextFile)
      expect(result.file?.type).toBe('txt')
      expect(result.file?.name).toBe('test.txt')
    })

    it('should handle empty content', () => {
      const options: FileCreationOptions = {
        name: 'empty.txt',
        content: ''
      }

      const result = txtFactory.createFile(options)
      
      expect(result.success).toBe(true)
      expect(result.fileEntity?.getContent()).toBe('')
    })

    it('should generate unique IDs for each file', () => {
      const options1: FileCreationOptions = { name: 'file1.txt', content: 'content1' }
      const options2: FileCreationOptions = { name: 'file2.txt', content: 'content2' }

      const result1 = txtFactory.createFile(options1)
      const result2 = txtFactory.createFile(options2)
      
      expect(result1.file?.id).not.toBe(result2.file?.id)
      expect(result1.file?.id).toBeTruthy()
      expect(result2.file?.id).toBeTruthy()
    })

    it('should validate content and reject invalid characters', () => {
      const options: FileCreationOptions = {
        name: 'invalid.txt',
        content: 'Valid content\x00Invalid null character'
      }

      const result = txtFactory.createFile(options)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('制御文字')
    })
  })

  describe('MarkdownFileFactory (Concrete Factory)', () => {
    let mdFactory: MarkdownFileFactory

    beforeEach(() => {
      mdFactory = new MarkdownFileFactory()
    })

    it('should create MarkdownFile instances with template', () => {
      const options: FileCreationOptions = {
        name: 'test.md'
        // content省略時はテンプレートが使用される
      }

      const result = mdFactory.createFile(options)
      
      expect(result.success).toBe(true)
      expect(result.fileEntity).toBeInstanceOf(MarkdownFile)
      expect(result.file?.type).toBe('md')
      expect(result.fileEntity?.getContent()).toContain('# 新しいドキュメント')
    })

    it('should use provided content over template', () => {
      const customContent = '# Custom Title\n\nCustom content here.'
      const options: FileCreationOptions = {
        name: 'custom.md',
        content: customContent
      }

      const result = mdFactory.createFile(options)
      
      expect(result.success).toBe(true)
      expect(result.fileEntity?.getContent()).toBe(customContent)
    })

    it('should validate Markdown syntax', () => {
      const invalidMarkdown = '# Title\n\n[Invalid link]()'
      const options: FileCreationOptions = {
        name: 'invalid.md',
        content: invalidMarkdown
      }

      const result = mdFactory.createFile(options)
      
      // Markdownの場合は緩い検証のため、構文エラーでも警告として処理
      expect(result.success).toBe(true)
      if (result.fileEntity) {
        const validation = result.fileEntity.validate()
        expect(validation.warnings.length).toBeGreaterThan(0)
      }
    })

    it('should extract headings correctly', () => {
      const content = '# Heading 1\n\n## Heading 2\n\n### Heading 3'
      const options: FileCreationOptions = {
        name: 'headings.md',
        content
      }

      const result = mdFactory.createFile(options)
      
      expect(result.success).toBe(true)
      if (result.fileEntity instanceof MarkdownFile) {
        const headings = result.fileEntity.getHeadings()
        expect(headings).toHaveLength(3)
        expect(headings[0]).toEqual({ level: 1, text: 'Heading 1', line: 1 })
        expect(headings[1]).toEqual({ level: 2, text: 'Heading 2', line: 3 })
        expect(headings[2]).toEqual({ level: 3, text: 'Heading 3', line: 5 })
      }
    })
  })

  describe('JsonFileFactory (Concrete Factory)', () => {
    let jsonFactory: JsonFileFactory

    beforeEach(() => {
      jsonFactory = new JsonFileFactory()
    })

    it('should create JsonFile instances with default template', () => {
      const options: FileCreationOptions = {
        name: 'test.json'
      }

      const result = jsonFactory.createFile(options)
      
      expect(result.success).toBe(true)
      expect(result.fileEntity).toBeInstanceOf(JsonFile)
      expect(result.file?.type).toBe('json')
      
      // デフォルトテンプレートが有効なJSONであることを確認
      const content = result.fileEntity?.getContent()
      expect(() => JSON.parse(content || '')).not.toThrow()
    })

    it('should validate and format JSON content', () => {
      const validJson = '{"name":"test","value":123}'
      const options: FileCreationOptions = {
        name: 'valid.json',
        content: validJson
      }

      const result = jsonFactory.createFile(options)
      
      expect(result.success).toBe(true)
      
      // JSONが整形されていることを確認
      const content = result.fileEntity?.getContent()
      expect(content).toContain('{\n  "name": "test",\n  "value": 123\n}')
    })

    it('should reject invalid JSON', () => {
      const invalidJson = '{"name": "test", "value": invalid}'
      const options: FileCreationOptions = {
        name: 'invalid.json',
        content: invalidJson
      }

      const result = jsonFactory.createFile(options)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('JSON')
    })

    it('should handle complex JSON structures', () => {
      const complexJson = {
        users: [
          { id: 1, name: 'Alice', preferences: { theme: 'dark' } },
          { id: 2, name: 'Bob', preferences: { theme: 'light' } }
        ],
        settings: {
          version: '1.0.0',
          features: ['auth', 'sync']
        }
      }

      const options: FileCreationOptions = {
        name: 'complex.json',
        content: JSON.stringify(complexJson)
      }

      const result = jsonFactory.createFile(options)
      
      expect(result.success).toBe(true)
      
      const content = result.fileEntity?.getContent()
      const parsed = JSON.parse(content || '{}')
      expect(parsed.users).toHaveLength(2)
      expect(parsed.settings.features).toEqual(['auth', 'sync'])
    })
  })

  describe('Factory Integration (FileFactoryManager)', () => {
    it('should create different file types correctly', () => {
      const txtResult = factoryManager.createFile('txt', { name: 'test.txt', content: 'text' })
      const mdResult = factoryManager.createFile('md', { name: 'test.md', content: '# title' })
      const jsonResult = factoryManager.createFile('json', { name: 'test.json', content: '{"key":"value"}' })

      expect(txtResult.success).toBe(true)
      expect(txtResult.fileEntity).toBeInstanceOf(TextFile)
      
      expect(mdResult.success).toBe(true)
      expect(mdResult.fileEntity).toBeInstanceOf(MarkdownFile)
      
      expect(jsonResult.success).toBe(true)
      expect(jsonResult.fileEntity).toBeInstanceOf(JsonFile)
    })

    it('should handle file creation errors gracefully', () => {
      // 不正なJSONでテスト
      const result = factoryManager.createFile('json', {
        name: 'invalid.json',
        content: 'invalid json content'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
      expect(result.fileEntity).toBeUndefined()
    })

    it('should maintain file metadata consistency', () => {
      const options: FileCreationOptions = {
        name: 'test.txt',
        content: 'Test content'
      }

      const result = factoryManager.createFile('txt', options)
      
      expect(result.success).toBe(true)
      expect(result.file?.name).toBe('test.txt')
      expect(result.file?.type).toBe('txt')
      expect(result.file?.size).toBe('Test content'.length)
      expect(result.file?.createdAt).toBeInstanceOf(Date)
      expect(result.file?.updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle extremely large file content', () => {
      const largeContent = 'x'.repeat(1000001) // 1MB + 1文字のコンテンツ
      const options: FileCreationOptions = {
        name: 'large.txt',
        content: largeContent
      }

      const result = factoryManager.createFile('txt', options)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('ファイルサイズが大きすぎます')
    })

    it('should validate file names', () => {
      const invalidNames = ['', 'file<name>.txt', 'file|name.txt', 'con.txt']
      
      invalidNames.forEach(name => {
        const result = factoryManager.createFile('txt', {
          name,
          content: 'content'
        })
        
        expect(result.success).toBe(false)
        expect(result.error).toBeTruthy()
      })
    })

    it('should handle Unicode content correctly', () => {
      const unicodeContent = '日本語のテスト 🚀 émojis and àccénts'
      const options: FileCreationOptions = {
        name: 'unicode.txt',
        content: unicodeContent
      }

      const result = factoryManager.createFile('txt', options)
      
      expect(result.success).toBe(true)
      expect(result.fileEntity?.getContent()).toBe(unicodeContent)
    })

    it('should reset instance correctly for testing', () => {
      const instance1 = FileFactoryManager.getInstance()
      FileFactoryManager.resetInstance()
      const instance2 = FileFactoryManager.getInstance()
      
      expect(instance1).not.toBe(instance2)
    })
  })

  describe('Template Method Pattern in Factory', () => {
    it('should follow consistent creation workflow', () => {
      const options: FileCreationOptions = {
        name: 'workflow-test.txt',
        content: 'test content'
      }

      const result = factoryManager.createFile('txt', options)
      
      // Template Method Patternにより、以下の手順が実行されることを確認
      expect(result.success).toBe(true)
      expect(result.operation).toBe('create')
      expect(result.timestamp).toBeInstanceOf(Date)
      expect(result.file).toBeTruthy()
      expect(result.fileEntity).toBeTruthy()
    })

    it('should validate before creation (Template Method step)', () => {
      const invalidOptions: FileCreationOptions = {
        name: '', // 無効なファイル名
        content: 'content'
      }

      const result = factoryManager.createFile('txt', invalidOptions)
      
      // バリデーション段階でエラーになることを確認
      expect(result.success).toBe(false)
      expect(result.error).toContain('ファイル名')
      expect(result.fileEntity).toBeUndefined()
    })
  })
})