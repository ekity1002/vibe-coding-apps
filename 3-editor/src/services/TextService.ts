/**
 * テキストサービス - 文字列処理のユーティリティクラス
 * 
 * TDD実装による文字列解析、統計計算、検索・置換機能を提供
 * 
 * Features:
 * - Unicode対応の文字数カウント
 * - 様々な改行文字に対応した行数カウント
 * - 空白文字を考慮した単語数カウント
 * - テキスト検証とサニタイゼーション
 * - 包括的なテキスト統計情報
 * - 大小文字を考慮した検索機能
 * 
 * Design Patterns:
 * - Static Factory Pattern: 静的メソッドによるユーティリティ機能提供
 * - Strategy Pattern: 検索オプションによる動作切り替え
 */
export class TextService {
  // パフォーマンス向上のためのキャッシュ（大きなテキスト処理用）
  private static readonly CACHE_SIZE_THRESHOLD = 10000
  private static textStatsCache = new Map<string, {
    characters: number
    lines: number
    words: number
    charactersNoSpaces: number
  }>()
  
  /**
   * 文字数をカウントする（Unicode文字を正しく処理）
   */
  static getCharacterCount(text: string): number {
    if (typeof text !== 'string') {
      throw new TypeError('Input must be a string')
    }
    
    // Unicode絵文字や結合文字を正しくカウントするため、Array.fromを使用
    // 改行文字は統一せずにそのままカウント
    return Array.from(text).length
  }

  /**
   * 行数をカウントする
   */
  static getLineCount(text: string): number {
    if (typeof text !== 'string') {
      throw new TypeError('Input must be a string')
    }
    
    if (text === '') return 1

    // 改行文字を統一してカウント
    const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const lines = normalizedText.split('\n')
    return lines.length
  }

  /**
   * 単語数をカウントする
   */
  static getWordCount(text: string): number {
    if (typeof text !== 'string') {
      throw new TypeError('Input must be a string')
    }
    
    // 空文字列や空白のみの場合は0
    const trimmed = text.trim()
    if (trimmed === '') return 0

    // 空白文字（スペース、タブ、改行）で分割
    const words = trimmed.split(/\s+/)
    return words.length
  }

  /**
   * テキストが有効かどうかを検証する
   */
  static isValidText(value: unknown): value is string {
    return typeof value === 'string'
  }

  /**
   * テキストをサニタイズする（制御文字の除去）
   */
  static sanitizeText(value: unknown): string {
    if (!this.isValidText(value)) {
      return ''
    }

    // 制御文字を除去（タブ、改行、復帰は保持）
    // eslint-disable-next-line no-control-regex
    return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  }

  /**
   * テキストを指定した長さで切り詰める
   */
  static truncateText(value: unknown, maxLength: number): string {
    if (!this.isValidText(value)) {
      return ''
    }

    if (maxLength <= 0) {
      return '...'
    }

    // Unicode文字を正しく処理するためArray.fromを使用
    const chars = Array.from(value)
    if (chars.length <= maxLength) {
      return value
    }

    // 末尾のスペースを除去してから切り詰める
    const truncated = chars.slice(0, maxLength).join('').trimEnd()
    return truncated + '...'
  }

  /**
   * 包括的なテキスト統計を取得する
   */
  static getTextStatistics(text: string): {
    characters: number
    lines: number
    words: number
    charactersNoSpaces: number
  } {
    if (typeof text !== 'string') {
      throw new TypeError('Input must be a string')
    }
    
    // 大きなテキストの場合はキャッシュを使用
    if (text.length > this.CACHE_SIZE_THRESHOLD) {
      const cached = this.textStatsCache.get(text)
      if (cached) return cached
    }
    
    const stats = {
      characters: this.getCharacterCount(text),
      lines: this.getLineCount(text),
      words: this.getWordCount(text),
      charactersNoSpaces: Array.from(text.replace(/\s/g, '')).length
    }
    
    // キャッシュに保存（最大100エントリまで）
    if (text.length > this.CACHE_SIZE_THRESHOLD && this.textStatsCache.size < 100) {
      this.textStatsCache.set(text, stats)
    }
    
    return stats
  }

  /**
   * テキスト内での文字列の位置を検索する
   */
  static findTextPositions(text: string, searchTerm: string, caseSensitive: boolean = true): number[] {
    if (typeof text !== 'string' || typeof searchTerm !== 'string') {
      throw new TypeError('Both text and searchTerm must be strings')
    }
    
    if (searchTerm === '') return []

    const positions: number[] = []
    const searchText = caseSensitive ? text : text.toLowerCase()
    const searchTarget = caseSensitive ? searchTerm : searchTerm.toLowerCase()

    let index = 0
    while ((index = searchText.indexOf(searchTarget, index)) !== -1) {
      positions.push(index)
      index += searchTarget.length
    }

    return positions
  }

  /**
   * テキストが空かどうかを判定する
   */
  static isEmpty(text: string): boolean {
    return text.trim() === ''
  }

  /**
   * テキストが単一行かどうかを判定する
   */
  static isSingleLine(text: string): boolean {
    return !text.includes('\n') && !text.includes('\r')
  }

  /**
   * テキストのプレビューを取得する
   */
  static getTextPreview(text: string, maxLength: number): string {
    return this.truncateText(text, maxLength)
  }
}
