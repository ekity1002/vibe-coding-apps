/**
 * ファイルエンティティの抽象基底クラス
 * 
 * Factory Patternにおける「Product」の抽象クラス
 * 全ての具象ファイルエンティティが継承する共通のインターフェースと振る舞いを定義
 * 
 * Design Patterns:
 * - Factory Pattern: Productの抽象クラス
 * - Template Method Pattern: 共通処理を基底クラスで実装
 */

import type { 
  FileType, 
  FileMetadata, 
  FileContent, 
  FileValidationResult,
  FileCreationOptions 
} from '../types/FileTypes'
import { FILE_CONSTANTS, FILE_ERROR_MESSAGES } from '../types/FileTypes'

/**
 * ファイルエンティティの抽象基底クラス
 * 
 * Template Method Patternを使用して、共通処理を基底クラスで実装し、
 * ファイル形式固有の処理を具象クラスで実装する設計
 */
export abstract class FileEntity {
  protected metadata: FileMetadata
  protected content: FileContent

  /**
   * コンストラクタ
   * @param options ファイル作成オプション
   */
  constructor(options: FileCreationOptions) {
    const now = new Date()
    
    this.metadata = {
      id: this.generateId(),
      name: options.name || this.generateDefaultName(),
      type: this.getFileType(),
      createdAt: now,
      updatedAt: now,
      size: (options.content || '').length,
      ...options.metadata
    }

    this.content = {
      content: options.content || '',
      encoding: options.encoding || FILE_CONSTANTS.DEFAULT_ENCODING,
      isDirty: false
    }
  }

  // ===== 抽象メソッド（具象クラスで実装必須） =====

  /**
   * ファイル形式を取得
   * 各具象クラスで実装必須
   */
  protected abstract getFileType(): FileType

  /**
   * ファイル内容のバリデーション
   * ファイル形式固有のバリデーションロジック
   */
  protected abstract validateContent(content: string): FileValidationResult

  /**
   * ファイル拡張子を取得
   */
  public abstract getExtension(): string

  /**
   * ファイルのプレビュー文字列を生成
   * @param maxLength プレビューの最大文字数
   */
  public abstract getPreview(maxLength?: number): string

  // ===== 公開メソッド =====

  /**
   * ファイルメタデータの取得
   */
  public getMetadata(): FileMetadata {
    return { ...this.metadata }
  }

  /**
   * ファイル内容の取得
   */
  public getContent(): string {
    return this.content.content
  }

  /**
   * ファイル内容情報の取得
   */
  public getContentInfo(): FileContent {
    return { ...this.content }
  }

  /**
   * ファイル名の取得
   */
  public getName(): string {
    return this.metadata.name
  }

  /**
   * ファイル形式の取得
   */
  public getType(): FileType {
    return this.metadata.type
  }

  /**
   * ファイルサイズの取得
   */
  public getSize(): number {
    return this.metadata.size
  }

  /**
   * ファイルIDの取得
   */
  public getId(): string {
    return this.metadata.id
  }

  /**
   * ファイルが変更されているかどうか
   */
  public isDirty(): boolean {
    return this.content.isDirty
  }

  /**
   * ファイル内容の更新
   * @param newContent 新しい内容
   */
  public updateContent(newContent: string): FileValidationResult {
    // バリデーション実行
    const validationResult = this.validateContent(newContent)
    
    if (!validationResult.isValid) {
      return validationResult
    }

    // サイズチェック
    if (newContent.length > FILE_CONSTANTS.MAX_FILE_SIZE) {
      return {
        isValid: false,
        errors: [FILE_ERROR_MESSAGES.FILE_TOO_LARGE],
        warnings: []
      }
    }

    // 内容を更新
    this.content = {
      ...this.content,
      content: newContent,
      isDirty: true
    }

    // メタデータを更新
    this.metadata = {
      ...this.metadata,
      size: newContent.length,
      updatedAt: new Date()
    }

    return validationResult
  }

  /**
   * ファイル名の更新
   * @param newName 新しいファイル名
   */
  public updateName(newName: string): FileValidationResult {
    const validationResult = this.validateFileName(newName)
    
    if (!validationResult.isValid) {
      return validationResult
    }

    this.metadata = {
      ...this.metadata,
      name: newName,
      updatedAt: new Date()
    }

    this.content = {
      ...this.content,
      isDirty: true
    }

    return validationResult
  }

  /**
   * ファイルの保存状態をクリア（保存完了時に呼び出し）
   */
  public markAsSaved(): void {
    this.content = {
      ...this.content,
      isDirty: false
    }
  }

  /**
   * 完全なバリデーション実行
   */
  public validate(): FileValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // ファイル名のバリデーション
    const nameValidation = this.validateFileName(this.metadata.name)
    errors.push(...nameValidation.errors)
    warnings.push(...nameValidation.warnings)

    // 内容のバリデーション
    const contentValidation = this.validateContent(this.content.content)
    errors.push(...contentValidation.errors)
    warnings.push(...contentValidation.warnings)

    // サイズチェック
    if (this.metadata.size > FILE_CONSTANTS.MAX_FILE_SIZE) {
      errors.push(FILE_ERROR_MESSAGES.FILE_TOO_LARGE)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * シリアライズ（保存用）
   */
  public serialize(): object {
    return {
      metadata: this.metadata,
      content: this.content
    }
  }

  /**
   * オブジェクトの文字列表現
   */
  public toString(): string {
    return `${this.metadata.type.toUpperCase()} File: ${this.metadata.name} (${this.metadata.size} chars)`
  }

  // ===== プライベートメソッド =====

  /**
   * 一意IDの生成
   */
  private generateId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * デフォルトファイル名の生成
   */
  private generateDefaultName(): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '_')
    const extension = this.getExtension()
    return `${FILE_CONSTANTS.DEFAULT_NAME_PREFIX}_${timestamp}${extension}`
  }

  /**
   * ファイル名のバリデーション
   */
  private validateFileName(name: string): FileValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 空文字チェック
    if (!name || name.trim().length === 0) {
      errors.push(FILE_ERROR_MESSAGES.INVALID_FILE_NAME)
      return { isValid: false, errors, warnings }
    }

    // 無効な文字チェック
    const invalidChars = /[<>:"/\\|?*]/
    if (invalidChars.test(name)) {
      errors.push('ファイル名に使用できない文字が含まれています')
    }

    // 長さチェック
    if (name.length > 255) {
      errors.push('ファイル名が長すぎます（255文字以内）')
    }

    // 拡張子チェック（警告レベル）
    const expectedExtension = this.getExtension()
    if (!name.endsWith(expectedExtension)) {
      warnings.push(`ファイル名に拡張子 ${expectedExtension} を含めることを推奨します`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}

/**
 * ファイルエンティティのユーティリティ関数
 */
export class FileEntityUtils {
  /**
   * ファイル形式から適切な拡張子を取得
   */
  static getExtensionForType(type: FileType): string {
    return FILE_CONSTANTS.EXTENSIONS[type]
  }

  /**
   * ファイル形式からMIMEタイプを取得
   */
  static getMimeTypeForType(type: FileType): string {
    return FILE_CONSTANTS.MIME_TYPES[type]
  }

  /**
   * ファイルサイズを人間が読みやすい形式に変換
   */
  static formatFileSize(size: number): string {
    if (size < 1024) return `${size} 文字`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  /**
   * 相対時間の表示（例：2分前、1時間前）
   */
  static formatRelativeTime(date: Date): string {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'たった今'
    if (minutes < 60) return `${minutes}分前`
    if (hours < 24) return `${hours}時間前`
    if (days < 7) return `${days}日前`
    return date.toLocaleDateString('ja-JP')
  }
}