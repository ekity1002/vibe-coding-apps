/**
 * JSONファイルエンティティ
 * 
 * Factory Patternにおける具象Product
 * JSON（.json）ファイルの実装
 * 
 * Design Patterns:
 * - Factory Pattern: 具象Product
 * - Template Method Pattern: FileEntityの抽象メソッドを実装
 */

import { FileEntity } from './FileEntity'
import type { 
  FileType, 
  FileValidationResult, 
  FileCreationOptions 
} from '../types/FileTypes'
import { FILE_CONSTANTS, FILE_ERROR_MESSAGES } from '../types/FileTypes'

/**
 * JSONファイルエンティティ
 * 
 * JSONファイルの具象実装
 * JSON形式の厳密なバリデーションとフォーマット機能を提供
 */
export class JsonFile extends FileEntity {
  private parsedJson: any = null
  private parseError: string | null = null

  /**
   * コンストラクタ
   * @param options ファイル作成オプション
   */
  constructor(options: FileCreationOptions = {}) {
    super({
      ...options,
      // デフォルトの拡張子を追加
      name: options.name || `${FILE_CONSTANTS.DEFAULT_NAME_PREFIX}${FILE_CONSTANTS.EXTENSIONS.json}`,
      // デフォルトで空のJSONオブジェクト
      content: options.content || '{}'
    })

    // 初期パース実行
    this.parseJsonContent()
  }

  /**
   * ファイル形式を取得
   * @returns 'json'
   */
  protected getFileType(): FileType {
    return 'json'
  }

  /**
   * ファイル拡張子を取得
   * @returns '.json'
   */
  public getExtension(): string {
    return FILE_CONSTANTS.EXTENSIONS.json
  }

  /**
   * JSONファイルの内容バリデーション
   * 
   * JSON形式の厳密な構文チェックを実行
   * パース可能性とデータ構造の妥当性を検証
   * 
   * @param content 検証する内容
   * @returns バリデーション結果
   */
  protected validateContent(content: string): FileValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // nullチェック
    if (content === null || content === undefined) {
      errors.push('ファイル内容がnullまたはundefinedです')
      return { isValid: false, errors, warnings }
    }

    // 空文字チェック
    if (content.trim().length === 0) {
      errors.push('JSONファイルが空です')
      return { isValid: false, errors, warnings }
    }

    // JSON構文の検証
    try {
      const parsed = JSON.parse(content)
      this.parsedJson = parsed
      this.parseError = null

      // JSONの構造チェック
      this.validateJsonStructure(parsed, warnings)

    } catch (error) {
      this.parsedJson = null
      this.parseError = error instanceof Error ? error.message : 'Unknown parse error'
      errors.push(FILE_ERROR_MESSAGES.INVALID_JSON_FORMAT + `: ${this.parseError}`)
      return { isValid: false, errors, warnings }
    }

    // UTF-8エンコードチェック
    try {
      new TextEncoder().encode(content)
    } catch (error) {
      errors.push('UTF-8でエンコードできない文字が含まれています')
    }

    // フォーマットの推奨事項チェック
    this.validateJsonFormat(content, warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * JSON構造の妥当性チェック
   * @param parsed パース済みJSONオブジェクト
   * @param warnings 警告メッセージ配列
   */
  private validateJsonStructure(parsed: any, warnings: string[]): void {
    // 循環参照チェック
    try {
      JSON.stringify(parsed)
    } catch (error) {
      warnings.push('循環参照が検出されました')
    }

    // 深すぎるネストチェック
    const maxDepth = 50
    const depth = this.getObjectDepth(parsed)
    if (depth > maxDepth) {
      warnings.push(`オブジェクトのネストが深すぎます（${depth}層、推奨: ${maxDepth}層以下）`)
    }

    // 大きすぎる配列チェック
    this.checkLargeArrays(parsed, warnings)

    // 非標準的なデータ型チェック
    this.checkNonStandardTypes(parsed, warnings)
  }

  /**
   * JSONフォーマットの推奨事項チェック
   * @param content JSON文字列
   * @param warnings 警告メッセージ配列
   */
  private validateJsonFormat(content: string, warnings: string[]): void {
    // インデントなしのチェック
    if (!content.includes('\n')) {
      warnings.push('可読性のためインデントの使用を推奨します')
    }

    // BOMの存在チェック
    if (content.charCodeAt(0) === 0xFEFF) {
      warnings.push('BOM（Byte Order Mark）が検出されました')
    }

    // 末尾カンマチェック（JSONでは無効だが一般的な問題）
    if (content.includes(',}') || content.includes(',]')) {
      warnings.push('末尾カンマが含まれている可能性があります（JSONでは無効）')
    }

    // 重複キーチェック（簡易版）
    const keyPattern = /"([^"]+)"\s*:/g
    const keys: string[] = []
    let match
    while ((match = keyPattern.exec(content)) !== null) {
      keys.push(match[1])
    }
    const duplicateKeys = keys.filter((key, index) => keys.indexOf(key) !== index)
    if (duplicateKeys.length > 0) {
      warnings.push(`重複キーが検出されました: ${[...new Set(duplicateKeys)].join(', ')}`)
    }
  }

  /**
   * オブジェクトの深度を計算
   * @param obj 対象オブジェクト
   * @returns 深度
   */
  private getObjectDepth(obj: any): number {
    if (obj === null || typeof obj !== 'object') {
      return 0
    }

    let maxDepth = 0
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const depth = this.getObjectDepth(obj[key])
        maxDepth = Math.max(maxDepth, depth)
      }
    }
    return maxDepth + 1
  }

  /**
   * 大きすぎる配列をチェック
   * @param obj 対象オブジェクト
   * @param warnings 警告メッセージ配列
   */
  private checkLargeArrays(obj: any, warnings: string[]): void {
    const maxArrayLength = 10000

    const checkRecursive = (current: any, path: string = '') => {
      if (Array.isArray(current)) {
        if (current.length > maxArrayLength) {
          warnings.push(`非常に大きな配列が検出されました${path}: ${current.length}要素`)
        }
        current.forEach((item, index) => {
          checkRecursive(item, `${path}[${index}]`)
        })
      } else if (current && typeof current === 'object') {
        for (const key in current) {
          if (current.hasOwnProperty(key)) {
            const newPath = path ? `${path}.${key}` : key
            checkRecursive(current[key], newPath)
          }
        }
      }
    }

    checkRecursive(obj)
  }

  /**
   * 非標準的なデータ型をチェック
   * @param obj 対象オブジェクト
   * @param warnings 警告メッセージ配列
   */
  private checkNonStandardTypes(obj: any, warnings: string[]): void {
    const checkRecursive = (current: any, path: string = '') => {
      if (current === undefined) {
        warnings.push(`undefined値が検出されました${path}（JSONでは無効）`)
      } else if (typeof current === 'function') {
        warnings.push(`関数が検出されました${path}（JSONでは無効）`)
      } else if (typeof current === 'symbol') {
        warnings.push(`シンボルが検出されました${path}（JSONでは無効）`)
      } else if (typeof current === 'number') {
        if (!isFinite(current)) {
          warnings.push(`無限大またはNaNが検出されました${path}（JSONでは無効）`)
        }
      } else if (Array.isArray(current)) {
        current.forEach((item, index) => {
          checkRecursive(item, `${path}[${index}]`)
        })
      } else if (current && typeof current === 'object') {
        for (const key in current) {
          if (current.hasOwnProperty(key)) {
            const newPath = path ? `${path}.${key}` : key
            checkRecursive(current[key], newPath)
          }
        }
      }
    }

    checkRecursive(obj)
  }

  /**
   * JSONコンテンツの再パース
   */
  private parseJsonContent(): void {
    const content = this.getContent()
    try {
      this.parsedJson = JSON.parse(content)
      this.parseError = null
    } catch (error) {
      this.parsedJson = null
      this.parseError = error instanceof Error ? error.message : 'Unknown parse error'
    }
  }

  /**
   * ファイル内容更新時のオーバーライド
   * JSONパースも同時に実行
   */
  public updateContent(newContent: string): FileValidationResult {
    const result = super.updateContent(newContent)
    if (result.isValid) {
      this.parseJsonContent()
    }
    return result
  }

  /**
   * ファイルのプレビューを生成
   * 
   * JSONファイルの場合、整形されたJSONの一部を表示
   * 
   * @param maxLength プレビューの最大文字数
   * @returns プレビュー文字列
   */
  public getPreview(maxLength: number = FILE_CONSTANTS.PREVIEW_MAX_LENGTH): string {
    const content = this.getContent()
    
    if (!content || content.length === 0) {
      return '（空のJSONファイル）'
    }

    if (this.parseError) {
      return `（JSONパースエラー: ${this.parseError}）`
    }

    try {
      // インデント付きで整形
      const formatted = JSON.stringify(this.parsedJson, null, 2)
      
      if (formatted.length <= maxLength) {
        return formatted
      }

      // 長すぎる場合は切り詰め
      const truncated = formatted.substring(0, maxLength - 3)
      // 最後の行を完全にするため、最後の改行まで戻る
      const lastNewline = truncated.lastIndexOf('\n')
      if (lastNewline > 0) {
        return truncated.substring(0, lastNewline) + '\n...'
      }
      
      return truncated + '...'
    } catch (error) {
      return '（プレビュー生成エラー）'
    }
  }

  /**
   * JSONファイル特有のメソッド
   */

  /**
   * パース済みJSONオブジェクトを取得
   */
  public getParsedJson(): any {
    return this.parsedJson
  }

  /**
   * パースエラーを取得
   */
  public getParseError(): string | null {
    return this.parseError
  }

  /**
   * JSONが有効かどうか
   */
  public isValidJson(): boolean {
    return this.parsedJson !== null && this.parseError === null
  }

  /**
   * JSON文字列を整形（美化）
   * @param indent インデント文字数（デフォルト: 2）
   */
  public formatJson(indent: number = 2): FileValidationResult {
    if (!this.isValidJson()) {
      return {
        isValid: false,
        errors: ['JSONが無効なため整形できません'],
        warnings: []
      }
    }

    try {
      const formatted = JSON.stringify(this.parsedJson, null, indent)
      return this.updateContent(formatted)
    } catch (error) {
      return {
        isValid: false,
        errors: ['JSON整形中にエラーが発生しました'],
        warnings: []
      }
    }
  }

  /**
   * JSON文字列を圧縮（改行・空白除去）
   */
  public minifyJson(): FileValidationResult {
    if (!this.isValidJson()) {
      return {
        isValid: false,
        errors: ['JSONが無効なため圧縮できません'],
        warnings: []
      }
    }

    try {
      const minified = JSON.stringify(this.parsedJson)
      return this.updateContent(minified)
    } catch (error) {
      return {
        isValid: false,
        errors: ['JSON圧縮中にエラーが発生しました'],
        warnings: []
      }
    }
  }

  /**
   * 指定パスの値を取得
   * @param path ドット記法のパス（例: "user.name"）
   */
  public getValueAtPath(path: string): any {
    if (!this.isValidJson()) {
      return undefined
    }

    const keys = path.split('.')
    let current = this.parsedJson

    for (const key of keys) {
      if (current === null || typeof current !== 'object' || !(key in current)) {
        return undefined
      }
      current = current[key]
    }

    return current
  }

  /**
   * JSON統計情報を取得
   */
  public getJsonStatistics(): {
    isValid: boolean
    depth: number
    totalKeys: number
    totalValues: number
    types: Record<string, number>
  } {
    if (!this.isValidJson()) {
      return {
        isValid: false,
        depth: 0,
        totalKeys: 0,
        totalValues: 0,
        types: {}
      }
    }

    const stats = {
      isValid: true,
      depth: this.getObjectDepth(this.parsedJson),
      totalKeys: 0,
      totalValues: 0,
      types: {} as Record<string, number>
    }

    const countRecursive = (obj: any) => {
      if (obj === null) {
        stats.types.null = (stats.types.null || 0) + 1
        stats.totalValues++
      } else if (Array.isArray(obj)) {
        stats.types.array = (stats.types.array || 0) + 1
        stats.totalValues++
        obj.forEach(item => countRecursive(item))
      } else if (typeof obj === 'object') {
        stats.types.object = (stats.types.object || 0) + 1
        stats.totalValues++
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            stats.totalKeys++
            countRecursive(obj[key])
          }
        }
      } else {
        const type = typeof obj
        stats.types[type] = (stats.types[type] || 0) + 1
        stats.totalValues++
      }
    }

    countRecursive(this.parsedJson)
    return stats
  }

  /**
   * 文字列表現をオーバーライド
   */
  public toString(): string {
    const stats = this.getJsonStatistics()
    if (!stats.isValid) {
      return `JSON File: ${this.getName()} (Invalid JSON)`
    }
    return `JSON File: ${this.getName()} (${stats.totalKeys} keys, depth: ${stats.depth})`
  }
}