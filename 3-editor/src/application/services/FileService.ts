/**
 * ファイルサービス
 * 
 * ファイル操作のユースケースを管理するアプリケーションサービス
 * Factory PatternとRepository Patternを統合して完全なファイル管理機能を提供
 * 
 * Design Patterns:
 * - Facade Pattern: 複雑なファイル操作を統一インターフェースで提供
 * - Command Pattern: ファイル操作をコマンドとして抽象化（将来拡張用）
 * - Observer Pattern: ファイル操作の通知
 */

import { FileFactoryManager } from '../../domain/file/factories/FileFactory'
import { StorageService } from './StorageService'
import { FileEntity } from '../../domain/file/entities/FileEntity'
import { TextFile } from '../../domain/file/entities/TextFile'
import { MarkdownFile } from '../../domain/file/entities/MarkdownFile'
import { JsonFile } from '../../domain/file/entities/JsonFile'
import type { 
  FileType, 
  FileCreationOptions, 
  FileOperationResult,
  FileSearchCriteria,
  FilePreview,
  FileMetadata
} from '../../domain/file/types/FileTypes'

/**
 * ファイル操作の通知データ
 * Observer Patternでの通知に使用
 */
export interface FileOperationNotification {
  operation: 'create' | 'save' | 'load' | 'delete' | 'update'
  file: FileMetadata
  success: boolean
  timestamp: Date
  details?: string
}

/**
 * ファイル操作の観察者インターフェース
 */
export interface FileOperationObserver {
  onFileOperation(notification: FileOperationNotification): void
}

/**
 * ファイルサービス実装
 * 
 * Facade Patternを適用し、複雑なファイル操作を統一インターフェースで提供
 * Factory PatternとRepository Patternを内部で組み合わせて使用
 */
export class FileService {
  private fileFactory: FileFactoryManager
  private storageService: StorageService
  private observers: Set<FileOperationObserver> = new Set()

  constructor() {
    this.fileFactory = FileFactoryManager.getInstance()
    this.storageService = new StorageService()
  }

  // ===== Observer Pattern メソッド =====

  /**
   * ファイル操作の観察者を追加
   */
  public addObserver(observer: FileOperationObserver): void {
    this.observers.add(observer)
  }

  /**
   * ファイル操作の観察者を削除
   */
  public removeObserver(observer: FileOperationObserver): void {
    this.observers.delete(observer)
  }

  /**
   * ファイル操作を通知
   */
  private notifyObservers(notification: FileOperationNotification): void {
    this.observers.forEach(observer => {
      try {
        observer.onFileOperation(notification)
      } catch (error) {
        console.error('Error notifying file operation observer:', error)
      }
    })
  }

  // ===== ファイル作成・編集 =====

  /**
   * 新しいファイルを作成
   * 
   * Factory Patternを使用してファイルエンティティを生成し、
   * Repository Patternを使用して永続化
   * 
   * @param fileType ファイル形式
   * @param options 作成オプション
   * @returns 作成結果
   */
  public async createFile(
    fileType: FileType, 
    options: FileCreationOptions = {}
  ): Promise<FileOperationResult & { fileEntity?: FileEntity }> {
    try {
      // 1. Factory Patternでファイル作成
      const factoryResult = this.fileFactory.createFile(fileType, options)
      
      if (!factoryResult.success || !factoryResult.file) {
        this.notifyObservers({
          operation: 'create',
          file: factoryResult.file!,
          success: false,
          timestamp: new Date(),
          details: factoryResult.error
        })
        return factoryResult
      }

      // 2. エンティティの再構築（ファクトリーからはメタデータのみ返される）
      const fileEntity = await this.reconstructFileEntity(factoryResult.file, options.content || '')

      // 3. Repository Patternで永続化
      const saveResult = await this.storageService.save(
        factoryResult.file,
        fileEntity.getContent()
      )

      if (!saveResult.success) {
        this.notifyObservers({
          operation: 'create',
          file: factoryResult.file,
          success: false,
          timestamp: new Date(),
          details: saveResult.error
        })
        return saveResult
      }

      // 4. 成功通知
      this.notifyObservers({
        operation: 'create',
        file: factoryResult.file,
        success: true,
        timestamp: new Date()
      })

      return {
        ...saveResult,
        fileEntity
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        error: errorMessage,
        operation: 'create',
        timestamp: new Date()
      }
    }
  }

  /**
   * ファイルの内容を更新
   * 
   * @param fileId ファイルID
   * @param newContent 新しい内容
   * @returns 更新結果
   */
  public async updateFileContent(
    fileId: string, 
    newContent: string
  ): Promise<FileOperationResult & { fileEntity?: FileEntity }> {
    try {
      // 1. 既存ファイルを読み込み
      const loadResult = await this.loadFile(fileId)
      if (!loadResult.success || !loadResult.fileEntity) {
        return {
          success: false,
          error: 'ファイルが見つかりません',
          operation: 'update',
          timestamp: new Date()
        }
      }

      // 2. 内容を更新
      const fileEntity = loadResult.fileEntity
      const validationResult = fileEntity.updateContent(newContent)
      
      if (!validationResult.isValid) {
        this.notifyObservers({
          operation: 'update',
          file: fileEntity.getMetadata(),
          success: false,
          timestamp: new Date(),
          details: validationResult.errors.join(', ')
        })
        return {
          success: false,
          error: validationResult.errors.join(', '),
          operation: 'update',
          timestamp: new Date()
        }
      }

      // 3. 永続化
      const saveResult = await this.storageService.save(
        fileEntity.getMetadata(),
        fileEntity.getContent()
      )

      if (saveResult.success) {
        this.notifyObservers({
          operation: 'update',
          file: fileEntity.getMetadata(),
          success: true,
          timestamp: new Date()
        })
      }

      return {
        ...saveResult,
        fileEntity
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        error: errorMessage,
        operation: 'update',
        timestamp: new Date()
      }
    }
  }

  /**
   * ファイル名を変更
   * 
   * @param fileId ファイルID
   * @param newName 新しいファイル名
   * @returns 更新結果
   */
  public async renameFile(
    fileId: string, 
    newName: string
  ): Promise<FileOperationResult & { fileEntity?: FileEntity }> {
    try {
      // 1. 既存ファイルを読み込み
      const loadResult = await this.loadFile(fileId)
      if (!loadResult.success || !loadResult.fileEntity) {
        return {
          success: false,
          error: 'ファイルが見つかりません',
          operation: 'update',
          timestamp: new Date()
        }
      }

      // 2. ファイル名を更新
      const fileEntity = loadResult.fileEntity
      const validationResult = fileEntity.updateName(newName)
      
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.errors.join(', '),
          operation: 'update',
          timestamp: new Date()
        }
      }

      // 3. 永続化
      const saveResult = await this.storageService.save(
        fileEntity.getMetadata(),
        fileEntity.getContent()
      )

      if (saveResult.success) {
        this.notifyObservers({
          operation: 'update',
          file: fileEntity.getMetadata(),
          success: true,
          timestamp: new Date()
        })
      }

      return {
        ...saveResult,
        fileEntity
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        error: errorMessage,
        operation: 'update',
        timestamp: new Date()
      }
    }
  }

  // ===== ファイル読み込み =====

  /**
   * ファイルを読み込み
   * 
   * @param fileId ファイルID
   * @returns 読み込み結果
   */
  public async loadFile(
    fileId: string
  ): Promise<FileOperationResult & { fileEntity?: FileEntity }> {
    try {
      // 1. ストレージから読み込み
      const loadResult = await this.storageService.load(fileId)
      
      if (!loadResult.success || !loadResult.file || !loadResult.content) {
        this.notifyObservers({
          operation: 'load',
          file: loadResult.file!,
          success: false,
          timestamp: new Date(),
          details: loadResult.error
        })
        return {
          success: false,
          error: loadResult.error || 'ファイルの読み込みに失敗しました',
          operation: 'load',
          timestamp: new Date()
        }
      }

      // 2. エンティティの再構築
      const fileEntity = await this.reconstructFileEntity(loadResult.file, loadResult.content)

      // 3. 成功通知
      this.notifyObservers({
        operation: 'load',
        file: loadResult.file,
        success: true,
        timestamp: new Date()
      })

      return {
        success: true,
        file: loadResult.file,
        operation: 'load',
        timestamp: new Date(),
        fileEntity
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        error: errorMessage,
        operation: 'load',
        timestamp: new Date()
      }
    }
  }

  /**
   * ファイル名で読み込み
   * 
   * @param fileName ファイル名
   * @returns 読み込み結果
   */
  public async loadFileByName(
    fileName: string
  ): Promise<FileOperationResult & { fileEntity?: FileEntity }> {
    try {
      const loadResult = await this.storageService.loadByName(fileName)
      
      if (!loadResult.success || !loadResult.file || !loadResult.content) {
        return {
          success: false,
          error: loadResult.error || 'ファイルの読み込みに失敗しました',
          operation: 'load',
          timestamp: new Date()
        }
      }

      const fileEntity = await this.reconstructFileEntity(loadResult.file, loadResult.content)

      this.notifyObservers({
        operation: 'load',
        file: loadResult.file,
        success: true,
        timestamp: new Date()
      })

      return {
        success: true,
        file: loadResult.file,
        operation: 'load',
        timestamp: new Date(),
        fileEntity
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        error: errorMessage,
        operation: 'load',
        timestamp: new Date()
      }
    }
  }

  // ===== ファイル削除 =====

  /**
   * ファイルを削除
   * 
   * @param fileId ファイルID
   * @returns 削除結果
   */
  public async deleteFile(fileId: string): Promise<FileOperationResult> {
    try {
      const deleteResult = await this.storageService.delete(fileId)
      
      if (deleteResult.success && deleteResult.file) {
        this.notifyObservers({
          operation: 'delete',
          file: deleteResult.file,
          success: true,
          timestamp: new Date()
        })
      } else if (deleteResult.file) {
        this.notifyObservers({
          operation: 'delete',
          file: deleteResult.file,
          success: false,
          timestamp: new Date(),
          details: deleteResult.error
        })
      }

      return deleteResult

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        error: errorMessage,
        operation: 'delete',
        timestamp: new Date()
      }
    }
  }

  // ===== ファイル一覧・検索 =====

  /**
   * 全ファイルの一覧を取得
   * 
   * @returns ファイルメタデータの配列
   */
  public async listAllFiles(): Promise<FileMetadata[]> {
    return await this.storageService.listAll()
  }

  /**
   * ファイルを検索
   * 
   * @param criteria 検索条件
   * @returns 検索結果
   */
  public async searchFiles(criteria: FileSearchCriteria): Promise<FileMetadata[]> {
    return await this.storageService.search(criteria)
  }

  /**
   * ファイルプレビュー一覧を取得
   * 
   * @param limit 取得数上限
   * @returns ファイルプレビューの配列
   */
  public async getFilePreviewList(limit?: number): Promise<FilePreview[]> {
    return await this.storageService.getPreviewList(limit)
  }

  // ===== ユーティリティ =====

  /**
   * サポートされているファイル形式の一覧を取得
   */
  public getSupportedFileTypes(): FileType[] {
    return this.fileFactory.getSupportedFileTypes()
  }

  /**
   * ファイル形式がサポートされているかチェック
   * 
   * @param fileType チェックするファイル形式
   * @returns サポートされている場合true
   */
  public isFileTypeSupported(fileType: string): fileType is FileType {
    return this.fileFactory.isSupported(fileType)
  }

  /**
   * ストレージ統計情報を取得
   */
  public async getStorageStatistics() {
    return await this.storageService.getStatistics()
  }

  /**
   * ストレージをクリア
   */
  public async clearStorage(): Promise<FileOperationResult> {
    return await this.storageService.clear()
  }

  /**
   * データのエクスポート
   */
  public async exportData() {
    return await this.storageService.exportData()
  }

  /**
   * データのインポート
   * 
   * @param data インポートデータ
   * @param mergeMode マージモード
   */
  public async importData(
    data: string, 
    mergeMode: 'replace' | 'merge' = 'merge'
  ): Promise<FileOperationResult> {
    return await this.storageService.importData(data, mergeMode)
  }

  // ===== プライベートメソッド =====

  /**
   * メタデータと内容からファイルエンティティを再構築
   * 
   * @param metadata ファイルメタデータ
   * @param content ファイル内容
   * @returns 再構築されたファイルエンティティ
   */
  private async reconstructFileEntity(
    metadata: FileMetadata, 
    content: string
  ): Promise<FileEntity> {
    const options: FileCreationOptions = {
      name: metadata.name,
      content,
      metadata
    }

    switch (metadata.type) {
      case 'txt':
        return new TextFile(options)
      case 'md':
        return new MarkdownFile(options)
      case 'json':
        return new JsonFile(options)
      default:
        throw new Error(`Unsupported file type: ${metadata.type}`)
    }
  }
}

/**
 * ファイルサービスのシングルトンインスタンス管理
 * 
 * アプリケーション全体で単一のファイルサービスインスタンスを提供
 */
export class FileServiceManager {
  private static instance: FileService

  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): FileService {
    if (!FileServiceManager.instance) {
      FileServiceManager.instance = new FileService()
    }
    return FileServiceManager.instance
  }

  /**
   * テスト用のインスタンスリセット
   */
  public static resetInstance(): void {
    FileServiceManager.instance = undefined as any
  }
}