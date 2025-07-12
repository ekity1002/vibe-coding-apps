/**
 * ストレージサービス
 * 
 * ファイルのローカル保存・読み込みを管理するアプリケーションサービス
 * ブラウザのLocalStorageを使用した永続化機能を提供
 * 
 * Design Patterns:
 * - Repository Pattern: データアクセスの抽象化
 * - Adapter Pattern: LocalStorage APIの抽象化
 * - Observer Pattern: ストレージ変更の通知（将来拡張用）
 */

import type { 
  FileType, 
  FileMetadata, 
  FileOperationResult,
  FileSearchCriteria,
  FilePreview
} from '../../domain/file/types/FileTypes'
import { FILE_ERROR_MESSAGES } from '../../domain/file/types/FileTypes'

/**
 * ストレージアイテムの内部表現
 * LocalStorageに保存される実際のデータ構造
 */
interface StorageItem {
  /** ファイルメタデータ */
  metadata: FileMetadata
  /** ファイル内容 */
  content: string
  /** 保存時刻 */
  savedAt: string
  /** ストレージバージョン（マイグレーション用） */
  version: number
}

/**
 * ストレージ統計情報
 */
interface StorageStatistics {
  /** 総ファイル数 */
  totalFiles: number
  /** ファイル形式別の数 */
  fileTypeCount: Record<FileType, number>
  /** 総データサイズ（文字数） */
  totalSize: number
  /** 使用ストレージサイズ（推定バイト数） */
  storageSize: number
  /** 最古のファイル */
  oldestFile?: FileMetadata
  /** 最新のファイル */
  newestFile?: FileMetadata
}

/**
 * ストレージサービス実装
 * 
 * Repository Patternを適用したデータアクセス層
 * LocalStorageの詳細を隠蔽し、ファイル操作の統一インターフェースを提供
 */
export class StorageService {
  private readonly STORAGE_KEY = 'text-editor-files'
  private readonly METADATA_KEY = 'text-editor-metadata'
  private readonly CURRENT_VERSION = 1

  /**
   * ファイルを保存
   * 
   * @param metadata ファイルメタデータ
   * @param content ファイル内容
   * @returns 保存結果
   */
  public async save(metadata: FileMetadata, content: string): Promise<FileOperationResult> {
    try {
      // 現在のファイル一覧を取得
      const existingFiles = await this.loadAllStorageItems()
      
      // 同名ファイルのチェック（上書き確認）
      const existingIndex = existingFiles.findIndex(item => 
        item.metadata.name === metadata.name
      )

      // ストレージアイテムの作成
      const storageItem: StorageItem = {
        metadata: {
          ...metadata,
          updatedAt: new Date()
        },
        content,
        savedAt: new Date().toISOString(),
        version: this.CURRENT_VERSION
      }

      // ファイル一覧の更新
      if (existingIndex >= 0) {
        // 既存ファイルの更新
        existingFiles[existingIndex] = storageItem
      } else {
        // 新規ファイルの追加
        existingFiles.push(storageItem)
      }

      // LocalStorageに保存
      await this.saveAllStorageItems(existingFiles)
      
      // メタデータキャッシュの更新
      await this.updateMetadataCache()

      return {
        success: true,
        file: storageItem.metadata,
        operation: existingIndex >= 0 ? 'update' : 'save',
        timestamp: new Date()
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : FILE_ERROR_MESSAGES.STORAGE_ERROR,
        operation: 'save',
        timestamp: new Date()
      }
    }
  }

  /**
   * ファイルを読み込み
   * 
   * @param fileId ファイルID
   * @returns 読み込み結果
   */
  public async load(fileId: string): Promise<FileOperationResult & { content?: string }> {
    try {
      const files = await this.loadAllStorageItems()
      const file = files.find(item => item.metadata.id === fileId)

      if (!file) {
        return {
          success: false,
          error: FILE_ERROR_MESSAGES.FILE_NOT_FOUND,
          operation: 'load',
          timestamp: new Date()
        }
      }

      return {
        success: true,
        file: file.metadata,
        content: file.content,
        operation: 'load',
        timestamp: new Date()
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : FILE_ERROR_MESSAGES.STORAGE_ERROR,
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
  public async loadByName(fileName: string): Promise<FileOperationResult & { content?: string }> {
    try {
      const files = await this.loadAllStorageItems()
      const file = files.find(item => item.metadata.name === fileName)

      if (!file) {
        return {
          success: false,
          error: FILE_ERROR_MESSAGES.FILE_NOT_FOUND,
          operation: 'load',
          timestamp: new Date()
        }
      }

      return {
        success: true,
        file: file.metadata,
        content: file.content,
        operation: 'load',
        timestamp: new Date()
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : FILE_ERROR_MESSAGES.STORAGE_ERROR,
        operation: 'load',
        timestamp: new Date()
      }
    }
  }

  /**
   * ファイル削除
   * 
   * @param fileId ファイルID
   * @returns 削除結果
   */
  public async delete(fileId: string): Promise<FileOperationResult> {
    try {
      const files = await this.loadAllStorageItems()
      const fileIndex = files.findIndex(item => item.metadata.id === fileId)

      if (fileIndex === -1) {
        return {
          success: false,
          error: FILE_ERROR_MESSAGES.FILE_NOT_FOUND,
          operation: 'delete',
          timestamp: new Date()
        }
      }

      const deletedFile = files[fileIndex]
      files.splice(fileIndex, 1)

      await this.saveAllStorageItems(files)
      await this.updateMetadataCache()

      return {
        success: true,
        file: deletedFile.metadata,
        operation: 'delete',
        timestamp: new Date()
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : FILE_ERROR_MESSAGES.STORAGE_ERROR,
        operation: 'delete',
        timestamp: new Date()
      }
    }
  }

  /**
   * 全ファイルのメタデータを取得
   * 
   * @returns ファイルメタデータの配列
   */
  public async listAll(): Promise<FileMetadata[]> {
    try {
      // メタデータキャッシュから高速取得を試行
      const cachedMetadata = await this.getMetadataFromCache()
      if (cachedMetadata.length > 0) {
        return cachedMetadata
      }

      // キャッシュが無い場合は全データから抽出
      const files = await this.loadAllStorageItems()
      return files.map(item => item.metadata)

    } catch (error) {
      console.error('Failed to list files:', error)
      return []
    }
  }

  /**
   * ファイル検索
   * 
   * @param criteria 検索条件
   * @returns 検索にマッチするファイルメタデータ
   */
  public async search(criteria: FileSearchCriteria): Promise<FileMetadata[]> {
    try {
      const allFiles = await this.listAll()
      
      return allFiles.filter(file => {
        // ファイル名パターンマッチ
        if (criteria.namePattern) {
          const pattern = criteria.namePattern.toLowerCase()
          if (!file.name.toLowerCase().includes(pattern)) {
            return false
          }
        }

        // ファイル形式フィルタ
        if (criteria.types && criteria.types.length > 0) {
          if (!criteria.types.includes(file.type)) {
            return false
          }
        }

        // 作成日時範囲フィルタ
        if (criteria.createdDateRange) {
          const fileDate = new Date(file.createdAt)
          if (criteria.createdDateRange.from && fileDate < criteria.createdDateRange.from) {
            return false
          }
          if (criteria.createdDateRange.to && fileDate > criteria.createdDateRange.to) {
            return false
          }
        }

        // ファイルサイズ範囲フィルタ
        if (criteria.sizeRange) {
          if (criteria.sizeRange.min !== undefined && file.size < criteria.sizeRange.min) {
            return false
          }
          if (criteria.sizeRange.max !== undefined && file.size > criteria.sizeRange.max) {
            return false
          }
        }

        return true
      })

    } catch (error) {
      console.error('Failed to search files:', error)
      return []
    }
  }

  /**
   * ファイルプレビュー一覧を取得
   * 
   * @param limit 取得数上限
   * @returns ファイルプレビューの配列
   */
  public async getPreviewList(limit?: number): Promise<FilePreview[]> {
    try {
      const files = await this.loadAllStorageItems()
      
      // 更新日時順でソート
      const sortedFiles = files.sort((a, b) => 
        new Date(b.metadata.updatedAt).getTime() - new Date(a.metadata.updatedAt).getTime()
      )

      // 制限数を適用
      const limitedFiles = limit ? sortedFiles.slice(0, limit) : sortedFiles

      return limitedFiles.map(item => ({
        metadata: item.metadata,
        preview: this.generatePreview(item.content, item.metadata.type),
        extension: this.getExtensionForType(item.metadata.type)
      }))

    } catch (error) {
      console.error('Failed to get preview list:', error)
      return []
    }
  }

  /**
   * ストレージ統計情報を取得
   * 
   * @returns ストレージ統計
   */
  public async getStatistics(): Promise<StorageStatistics> {
    try {
      const files = await this.loadAllStorageItems()
      
      const stats: StorageStatistics = {
        totalFiles: files.length,
        fileTypeCount: { txt: 0, md: 0, json: 0 },
        totalSize: 0,
        storageSize: 0
      }

      if (files.length === 0) {
        return stats
      }

      // 統計計算
      let oldest = files[0].metadata
      let newest = files[0].metadata

      files.forEach(item => {
        // ファイル形式別カウント
        stats.fileTypeCount[item.metadata.type]++
        
        // 総サイズ計算
        stats.totalSize += item.metadata.size
        
        // 最古・最新ファイル判定
        if (new Date(item.metadata.createdAt) < new Date(oldest.createdAt)) {
          oldest = item.metadata
        }
        if (new Date(item.metadata.updatedAt) > new Date(newest.updatedAt)) {
          newest = item.metadata
        }
      })

      stats.oldestFile = oldest
      stats.newestFile = newest

      // ストレージサイズ推定（JSON文字列化後のサイズ）
      const storageData = JSON.stringify(files)
      stats.storageSize = new TextEncoder().encode(storageData).length

      return stats

    } catch (error) {
      console.error('Failed to get storage statistics:', error)
      return {
        totalFiles: 0,
        fileTypeCount: { txt: 0, md: 0, json: 0 },
        totalSize: 0,
        storageSize: 0
      }
    }
  }

  /**
   * ストレージをクリア
   * 
   * @returns クリア結果
   */
  public async clear(): Promise<FileOperationResult> {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      localStorage.removeItem(this.METADATA_KEY)

      return {
        success: true,
        operation: 'delete',
        timestamp: new Date()
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear storage',
        operation: 'delete',
        timestamp: new Date()
      }
    }
  }

  /**
   * ストレージデータのエクスポート
   * 
   * @returns エクスポートデータ
   */
  public async exportData(): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const files = await this.loadAllStorageItems()
      const exportData = {
        version: this.CURRENT_VERSION,
        exportedAt: new Date().toISOString(),
        files
      }

      return {
        success: true,
        data: JSON.stringify(exportData, null, 2)
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export data'
      }
    }
  }

  /**
   * ストレージデータのインポート
   * 
   * @param data インポートデータ
   * @param mergeMode 既存データとのマージモード
   * @returns インポート結果
   */
  public async importData(
    data: string, 
    mergeMode: 'replace' | 'merge' = 'merge'
  ): Promise<FileOperationResult> {
    try {
      const importData = JSON.parse(data)
      
      // データ形式の検証
      if (!importData.files || !Array.isArray(importData.files)) {
        return {
          success: false,
          error: 'Invalid import data format',
          operation: 'load',
          timestamp: new Date()
        }
      }

      let files: StorageItem[] = []

      if (mergeMode === 'merge') {
        // 既存データと統合
        files = await this.loadAllStorageItems()
        
        // 重複チェックして追加
        importData.files.forEach((importItem: StorageItem) => {
          const existingIndex = files.findIndex(item => 
            item.metadata.name === importItem.metadata.name
          )
          
          if (existingIndex >= 0) {
            // 既存ファイルを更新
            files[existingIndex] = importItem
          } else {
            // 新規ファイルを追加
            files.push(importItem)
          }
        })
      } else {
        // 完全置換
        files = importData.files
      }

      await this.saveAllStorageItems(files)
      await this.updateMetadataCache()

      return {
        success: true,
        operation: 'load',
        timestamp: new Date()
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import data',
        operation: 'load',
        timestamp: new Date()
      }
    }
  }

  // ===== プライベートメソッド =====

  /**
   * 全ストレージアイテムを読み込み
   */
  private async loadAllStorageItems(): Promise<StorageItem[]> {
    const data = localStorage.getItem(this.STORAGE_KEY)
    if (!data) {
      return []
    }

    try {
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error('Failed to parse storage data:', error)
      return []
    }
  }

  /**
   * 全ストレージアイテムを保存
   */
  private async saveAllStorageItems(items: StorageItem[]): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items))
  }

  /**
   * メタデータキャッシュを更新
   */
  private async updateMetadataCache(): Promise<void> {
    try {
      const files = await this.loadAllStorageItems()
      const metadata = files.map(item => item.metadata)
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata))
    } catch (error) {
      console.error('Failed to update metadata cache:', error)
    }
  }

  /**
   * メタデータキャッシュから取得
   */
  private async getMetadataFromCache(): Promise<FileMetadata[]> {
    try {
      const data = localStorage.getItem(this.METADATA_KEY)
      if (!data) return []
      
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      return []
    }
  }

  /**
   * プレビュー文字列を生成
   */
  private generatePreview(content: string, type: FileType): string {
    const maxLength = 100
    
    if (!content || content.length === 0) {
      return `（空の${type.toUpperCase()}ファイル）`
    }

    // 改行を除去してプレビュー作成
    let preview = content
      .replace(/\r?\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (preview.length > maxLength) {
      preview = preview.substring(0, maxLength - 3) + '...'
    }

    return preview
  }

  /**
   * ファイル形式から拡張子を取得
   */
  private getExtensionForType(type: FileType): string {
    const extensions = { txt: '.txt', md: '.md', json: '.json' }
    return extensions[type]
  }
}