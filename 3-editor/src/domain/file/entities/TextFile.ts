/**
 * テキストファイルエンティティ
 * 
 * Factory Patternにおける具象Product
 * プレーンテキスト（.txt）ファイルの実装
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
import { FILE_CONSTANTS } from '../types/FileTypes'

/**
 * テキストファイルエンティティ
 * 
 * プレーンテキストファイルの具象実装
 * 最もシンプルなファイル形式で、特別なバリデーションは行わない
 */
export class TextFile extends FileEntity {
  /**
   * コンストラクタ
   * @param options ファイル作成オプション
   */
  constructor(options: FileCreationOptions = {}) {
    super({
      ...options,
      // デフォルトの拡張子を追加
      name: options.name || `${FILE_CONSTANTS.DEFAULT_NAME_PREFIX}${FILE_CONSTANTS.EXTENSIONS.txt}`
    })
  }

  /**
   * ファイル形式を取得
   * @returns 'txt'
   */
  protected getFileType(): FileType {
    return 'txt'
  }

  /**
   * ファイル拡張子を取得
   * @returns '.txt'
   */
  public getExtension(): string {
    return FILE_CONSTANTS.EXTENSIONS.txt
  }

  /**
   * テキストファイルの内容バリデーション
   * 
   * プレーンテキストは基本的に任意の文字列を受け入れるため、
   * 最小限のバリデーションのみ実行
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

    // 制御文字チェック（エラーレベル）
    // ただし、改行文字（\n, \r）とタブ文字（\t）は許可
    const controlCharsRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/
    if (controlCharsRegex.test(content)) {
      errors.push('ファイルに制御文字が含まれています')
    }

    // 非常に長い行のチェック（警告レベル）
    const lines = content.split('\n')
    const longLines = lines.filter(line => line.length > 1000)
    if (longLines.length > 0) {
      warnings.push(`非常に長い行が ${longLines.length} 行あります（1000文字以上）`)
    }

    // UTF-8でエンコード可能かチェック
    try {
      new TextEncoder().encode(content)
    } catch (error) {
      errors.push('UTF-8でエンコードできない文字が含まれています')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * ファイルのプレビューを生成
   * 
   * テキストファイルの場合、先頭から指定文字数を取得し、
   * 改行文字を空白に置換して見やすくする
   * 
   * @param maxLength プレビューの最大文字数（デフォルト: 200）
   * @returns プレビュー文字列
   */
  public getPreview(maxLength: number = FILE_CONSTANTS.PREVIEW_MAX_LENGTH): string {
    const content = this.getContent()
    
    if (!content || content.length === 0) {
      return '（空のファイル）'
    }

    // 改行とタブを空白に置換
    let preview = content
      .replace(/\r\n/g, ' ')  // Windows改行
      .replace(/\n/g, ' ')    // Unix改行
      .replace(/\r/g, ' ')    // Mac改行
      .replace(/\t/g, ' ')    // タブ
      .replace(/\s+/g, ' ')   // 連続する空白を1つに
      .trim()

    // 指定長で切り詰め
    if (preview.length > maxLength) {
      preview = preview.substring(0, maxLength - 3) + '...'
    }

    return preview
  }

  /**
   * テキストファイル特有のメソッド
   */

  /**
   * 行数を取得
   */
  public getLineCount(): number {
    const content = this.getContent()
    if (!content) return 0
    return content.split('\n').length
  }

  /**
   * 単語数を取得（空白区切り）
   */
  public getWordCount(): number {
    const content = this.getContent()
    if (!content || content.trim().length === 0) return 0
    
    return content
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length
  }

  /**
   * 文字数を取得（空白を除く）
   */
  public getCharacterCountWithoutSpaces(): number {
    const content = this.getContent()
    return content.replace(/\s/g, '').length
  }

  /**
   * 特定の文字列が含まれているかチェック
   * @param searchText 検索文字列
   * @param caseSensitive 大文字小文字を区別するか
   */
  public contains(searchText: string, caseSensitive: boolean = true): boolean {
    const content = this.getContent()
    const target = caseSensitive ? content : content.toLowerCase()
    const search = caseSensitive ? searchText : searchText.toLowerCase()
    return target.includes(search)
  }

  /**
   * 行単位での操作
   */

  /**
   * 指定行の内容を取得
   * @param lineNumber 行番号（1から開始）
   */
  public getLine(lineNumber: number): string | null {
    const lines = this.getContent().split('\n')
    if (lineNumber < 1 || lineNumber > lines.length) {
      return null
    }
    return lines[lineNumber - 1]
  }

  /**
   * 指定行を置換
   * @param lineNumber 行番号（1から開始）
   * @param newContent 新しい行の内容
   */
  public replaceLine(lineNumber: number, newContent: string): FileValidationResult {
    const lines = this.getContent().split('\n')
    if (lineNumber < 1 || lineNumber > lines.length) {
      return {
        isValid: false,
        errors: ['指定された行番号が範囲外です'],
        warnings: []
      }
    }

    lines[lineNumber - 1] = newContent
    return this.updateContent(lines.join('\n'))
  }

  /**
   * ファイル統計情報を取得
   */
  public getStatistics(): {
    lines: number
    words: number
    characters: number
    charactersWithoutSpaces: number
    bytes: number
  } {
    const content = this.getContent()
    const bytes = new TextEncoder().encode(content).length

    return {
      lines: this.getLineCount(),
      words: this.getWordCount(),
      characters: content.length,
      charactersWithoutSpaces: this.getCharacterCountWithoutSpaces(),
      bytes
    }
  }

  /**
   * 文字列表現をオーバーライド
   */
  public toString(): string {
    const stats = this.getStatistics()
    return `Text File: ${this.getName()} (${stats.lines} lines, ${stats.words} words, ${stats.characters} chars)`
  }
}