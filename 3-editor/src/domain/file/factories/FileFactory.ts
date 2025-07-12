/**
 * File Factory Pattern実装
 * 
 * Factory Patternの核心部分
 * ファイル形式に応じた適切なエンティティの生成を抽象化
 * 
 * Design Patterns:
 * - Factory Method Pattern: ファイル生成の抽象化
 * - Abstract Factory Pattern: ファミリー単位でのファクトリー管理
 * - Singleton Pattern: ファクトリーインスタンスの管理
 */

import { FileEntity } from '../entities/FileEntity'
import { TextFile } from '../entities/TextFile'
import { MarkdownFile } from '../entities/MarkdownFile'
import { JsonFile } from '../entities/JsonFile'
import type { 
  FileType, 
  FileCreationOptions, 
  FileOperationResult,
  FileOperation
} from '../types/FileTypes'
import { FILE_ERROR_MESSAGES } from '../types/FileTypes'

/**
 * 抽象ファクトリークラス
 * 
 * Factory Method Patternの抽象Creator
 * 具象ファクトリーが実装すべきインターフェースを定義
 */
export abstract class FileFactory {
  /**
   * ファイルエンティティを作成（抽象メソッド）
   * 
   * 各具象ファクトリーで実装される核心メソッド
   * Template Method Patternと組み合わせて、作成前後の処理を共通化
   * 
   * @param options ファイル作成オプション
   * @returns 作成されたファイルエンティティ
   */
  protected abstract createFileEntity(options: FileCreationOptions): FileEntity

  /**
   * ファクトリーが対応するファイル形式を取得
   */
  public abstract getSupportedFileType(): FileType

  /**
   * ファイル作成のパブリックメソッド（Template Method Pattern）
   * 
   * 作成前後の共通処理を含む完全なファイル作成フロー
   * 
   * @param options ファイル作成オプション
   * @returns ファイル作成結果
   */
  public createFile(options: FileCreationOptions = {}): FileOperationResult {
    const startTime = Date.now()

    try {
      // 1. 作成前のバリデーション
      const validationResult = this.validateCreationOptions(options)
      if (!validationResult.success) {
        return validationResult
      }

      // 2. ファイルエンティティの作成（抽象メソッド）
      const fileEntity = this.createFileEntity(options)

      // 3. 作成後のバリデーション
      const fileValidation = fileEntity.validate()
      if (!fileValidation.isValid) {
        return {
          success: false,
          error: fileValidation.errors.join(', '),
          operation: 'create',
          timestamp: new Date()
        }
      }

      // 4. 成功結果を返す
      return {
        success: true,
        file: fileEntity.getMetadata(),
        fileEntity: fileEntity,
        operation: 'create',
        timestamp: new Date()
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during file creation',
        operation: 'create',
        timestamp: new Date()
      }
    }
  }

  /**
   * ファイル作成オプションのバリデーション（共通処理）
   * 
   * @param options 作成オプション
   * @returns バリデーション結果
   */
  protected validateCreationOptions(options: FileCreationOptions): FileOperationResult {
    // ファイル名の空チェック
    if (!options.name || options.name.trim() === '') {
      return {
        success: false,
        error: 'ファイル名が空です',
        operation: 'create',
        timestamp: new Date()
      }
    }

    // ファイル名の長さチェック
    if (options.name.length > 255) {
      return {
        success: false,
        error: 'ファイル名が長すぎます（255文字以内）',
        operation: 'create',
        timestamp: new Date()
      }
    }

    // 無効な文字チェック
    const invalidChars = /[<>:"/\\|?*]/
    if (invalidChars.test(options.name)) {
      return {
        success: false,
        error: 'ファイル名に使用できない文字が含まれています',
        operation: 'create',
        timestamp: new Date()
      }
    }

    // 予約語チェック
    const reservedNames = ['con', 'prn', 'aux', 'nul', 'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9', 'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9']
    const nameWithoutExt = options.name.split('.')[0].toLowerCase()
    if (reservedNames.includes(nameWithoutExt)) {
      return {
        success: false,
        error: 'ファイル名に予約語が使用されています',
        operation: 'create',
        timestamp: new Date()
      }
    }

    // ファイルサイズチェック
    if (options.content && options.content.length > 1000000) {
      return {
        success: false,
        error: 'ファイルサイズが大きすぎます',
        operation: 'create',
        timestamp: new Date()
      }
    }

    return {
      success: true,
      operation: 'create',
      timestamp: new Date()
    }
  }

  /**
   * ファクトリーの説明を取得
   */
  public getDescription(): string {
    return `Factory for ${this.getSupportedFileType().toUpperCase()} files`
  }
}

/**
 * テキストファイル用ファクトリー
 * 
 * .txtファイルの生成を担当する具象ファクトリー
 */
export class TextFileFactory extends FileFactory {
  /**
   * サポートするファイル形式を返す
   */
  public getSupportedFileType(): FileType {
    return 'txt'
  }

  /**
   * テキストファイルエンティティを作成
   * 
   * @param options ファイル作成オプション
   * @returns TextFileインスタンス
   */
  protected createFileEntity(options: FileCreationOptions): FileEntity {
    return new TextFile(options)
  }

  /**
   * ファクトリーの説明をオーバーライド
   */
  public getDescription(): string {
    return 'プレーンテキストファイル（.txt）を作成するファクトリー'
  }
}

/**
 * Markdownファイル用ファクトリー
 * 
 * .mdファイルの生成を担当する具象ファクトリー
 */
export class MarkdownFileFactory extends FileFactory {
  /**
   * サポートするファイル形式を返す
   */
  public getSupportedFileType(): FileType {
    return 'md'
  }

  /**
   * Markdownファイルエンティティを作成
   * 
   * @param options ファイル作成オプション
   * @returns MarkdownFileインスタンス
   */
  protected createFileEntity(options: FileCreationOptions): FileEntity {
    // Markdownファイルの場合、デフォルトでテンプレートを設定
    const defaultContent = options.content || this.getMarkdownTemplate()
    
    return new MarkdownFile({
      ...options,
      content: defaultContent
    })
  }

  /**
   * Markdownファイルのデフォルトテンプレートを取得
   */
  private getMarkdownTemplate(): string {
    return `# 新しいドキュメント

## 概要

ここに概要を記述してください。

## 内容

- 箇条書き項目1
- 箇条書き項目2
- 箇条書き項目3

## まとめ

ここにまとめを記述してください。
`
  }

  /**
   * ファクトリーの説明をオーバーライド
   */
  public getDescription(): string {
    return 'Markdownファイル（.md）を作成するファクトリー（テンプレート付き）'
  }
}

/**
 * JSONファイル用ファクトリー
 * 
 * .jsonファイルの生成を担当する具象ファクトリー
 */
export class JsonFileFactory extends FileFactory {
  /**
   * サポートするファイル形式を返す
   */
  public getSupportedFileType(): FileType {
    return 'json'
  }

  /**
   * JSONファイルエンティティを作成
   * 
   * @param options ファイル作成オプション
   * @returns JsonFileインスタンス
   */
  protected createFileEntity(options: FileCreationOptions): FileEntity {
    // JSONファイルの場合、デフォルトで整形されたオブジェクトを設定
    let defaultContent = options.content
    
    if (!defaultContent) {
      defaultContent = JSON.stringify(this.getJsonTemplate(), null, 2)
    } else {
      // 渡された内容が有効なJSONかチェックし、整形
      try {
        const parsed = JSON.parse(defaultContent)
        defaultContent = JSON.stringify(parsed, null, 2)
      } catch (error) {
        // 無効なJSONの場合はそのまま使用（エンティティ側でエラーになる）
      }
    }
    
    return new JsonFile({
      ...options,
      content: defaultContent
    })
  }

  /**
   * JSONファイルのデフォルトテンプレートを取得
   */
  private getJsonTemplate(): object {
    return {
      name: "新しいJSONファイル",
      version: "1.0.0",
      description: "ここに説明を記述してください",
      author: "",
      created: new Date().toISOString(),
      data: {
        items: [],
        settings: {
          enabled: true,
          level: 1
        }
      }
    }
  }

  /**
   * ファクトリーの説明をオーバーライド
   */
  public getDescription(): string {
    return 'JSONファイル（.json）を作成するファクトリー（テンプレート付き）'
  }
}

/**
 * ファクトリーマネージャー（Abstract Factory Pattern + Registry Pattern）
 * 
 * 複数のファクトリーを統一的に管理し、型に応じて適切なファクトリーを提供
 * Singleton Patternで実装してグローバルアクセスポイントを提供
 */
export class FileFactoryManager {
  private static instance: FileFactoryManager
  private factories: Map<FileType, FileFactory> = new Map()

  /**
   * プライベートコンストラクタ（Singleton Pattern）
   */
  private constructor() {
    this.initializeFactories()
  }

  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): FileFactoryManager {
    if (!FileFactoryManager.instance) {
      FileFactoryManager.instance = new FileFactoryManager()
    }
    return FileFactoryManager.instance
  }

  /**
   * ファクトリーの初期化
   */
  private initializeFactories(): void {
    this.registerFactory(new TextFileFactory())
    this.registerFactory(new MarkdownFileFactory())
    this.registerFactory(new JsonFileFactory())
  }

  /**
   * ファクトリーを登録
   * 
   * 新しいファイル形式をサポートする際に使用
   * 
   * @param factory 登録するファクトリー
   */
  public registerFactory(factory: FileFactory): void {
    this.factories.set(factory.getSupportedFileType(), factory)
  }

  /**
   * ファクトリーの登録を解除
   * 
   * @param fileType 解除するファイル形式
   */
  public unregisterFactory(fileType: FileType): void {
    this.factories.delete(fileType)
  }

  /**
   * 指定された形式のファクトリーを取得
   * 
   * @param fileType ファイル形式
   * @returns 対応するファクトリー
   * @throws Error サポートされていない形式の場合
   */
  public getFactory(fileType: FileType): FileFactory {
    const factory = this.factories.get(fileType)
    if (!factory) {
      throw new Error(`${FILE_ERROR_MESSAGES.INVALID_FILE_TYPE}: ${fileType}`)
    }
    return factory
  }

  /**
   * ファイルを作成（ファサードメソッド）
   * 
   * クライアントコードが最もよく使用するメソッド
   * 
   * @param fileType ファイル形式
   * @param options 作成オプション
   * @returns ファイル作成結果
   */
  public createFile(fileType: FileType, options: FileCreationOptions = {}): FileOperationResult {
    try {
      const factory = this.getFactory(fileType)
      return factory.createFile(options)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        operation: 'create',
        timestamp: new Date()
      }
    }
  }

  /**
   * サポートされているファイル形式の一覧を取得
   */
  public getSupportedFileTypes(): FileType[] {
    return Array.from(this.factories.keys())
  }

  /**
   * 登録されているファクトリーの一覧を取得
   */
  public getFactories(): FileFactory[] {
    return Array.from(this.factories.values())
  }

  /**
   * 指定形式がサポートされているかチェック
   * 
   * @param fileType チェックするファイル形式
   * @returns サポートされている場合true
   */
  public isSupported(fileType: string): fileType is FileType {
    return this.factories.has(fileType as FileType)
  }

  /**
   * デバッグ用の統計情報を取得
   */
  public getStatistics(): {
    totalFactories: number
    supportedTypes: FileType[]
    factoryDescriptions: Record<FileType, string>
  } {
    const factoryDescriptions: Record<FileType, string> = {} as Record<FileType, string>
    
    for (const [type, factory] of this.factories) {
      factoryDescriptions[type] = factory.getDescription()
    }

    return {
      totalFactories: this.factories.size,
      supportedTypes: this.getSupportedFileTypes(),
      factoryDescriptions
    }
  }

  /**
   * テスト用のファクトリーリセット
   */
  public static resetInstance(): void {
    FileFactoryManager.instance = undefined as any
  }
}

/**
 * Factory Patternの便利関数
 * 
 * よく使用される操作のショートカット
 */
export class FileFactoryUtils {
  /**
   * 簡単なファイル作成
   * 
   * @param fileType ファイル形式
   * @param name ファイル名
   * @param content ファイル内容
   * @returns 作成結果
   */
  static createSimpleFile(
    fileType: FileType, 
    name?: string, 
    content?: string
  ): FileOperationResult {
    const manager = FileFactoryManager.getInstance()
    return manager.createFile(fileType, { name, content })
  }

  /**
   * 拡張子からファイル形式を推定
   * 
   * @param filename ファイル名
   * @returns 推定されたファイル形式（推定できない場合はnull）
   */
  static guessFileTypeFromExtension(filename: string): FileType | null {
    const extension = filename.toLowerCase().split('.').pop()
    
    switch (extension) {
      case 'txt': return 'txt'
      case 'md': case 'markdown': return 'md'
      case 'json': return 'json'
      default: return null
    }
  }

  /**
   * 全ファイル形式の作成テスト
   * 
   * 開発・デバッグ用途
   */
  static createTestFiles(): Record<FileType, FileOperationResult> {
    const manager = FileFactoryManager.getInstance()
    const results: Partial<Record<FileType, FileOperationResult>> = {}

    for (const fileType of manager.getSupportedFileTypes()) {
      results[fileType] = manager.createFile(fileType, {
        name: `test.${fileType}`,
        content: `Test content for ${fileType} file`
      })
    }

    return results as Record<FileType, FileOperationResult>
  }
}