/**
 * Markdownファイルエンティティ
 * 
 * Factory Patternにおける具象Product
 * Markdown（.md）ファイルの実装
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
 * Markdownファイルエンティティ
 * 
 * Markdownファイルの具象実装
 * Markdown記法の基本的なバリデーションとプレビュー機能を提供
 */
export class MarkdownFile extends FileEntity {
  /**
   * コンストラクタ
   * @param options ファイル作成オプション
   */
  constructor(options: FileCreationOptions = {}) {
    super({
      ...options,
      // デフォルトの拡張子を追加
      name: options.name || `${FILE_CONSTANTS.DEFAULT_NAME_PREFIX}${FILE_CONSTANTS.EXTENSIONS.md}`
    })
  }

  /**
   * ファイル形式を取得
   * @returns 'md'
   */
  protected getFileType(): FileType {
    return 'md'
  }

  /**
   * ファイル拡張子を取得
   * @returns '.md'
   */
  public getExtension(): string {
    return FILE_CONSTANTS.EXTENSIONS.md
  }

  /**
   * Markdownファイルの内容バリデーション
   * 
   * Markdown記法の基本的な構文チェックを実行
   * エラーではなく警告レベルでの通知が中心
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

    // UTF-8エンコードチェック
    try {
      new TextEncoder().encode(content)
    } catch (error) {
      errors.push('UTF-8でエンコードできない文字が含まれています')
    }

    // Markdown記法の基本チェック
    this.validateMarkdownSyntax(content, warnings)

    // リンクのチェック
    this.validateLinks(content, warnings)

    // 画像リンクのチェック
    this.validateImages(content, warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Markdown記法の基本構文チェック
   * @param content ファイル内容
   * @param warnings 警告メッセージ配列
   */
  private validateMarkdownSyntax(content: string, warnings: string[]): void {
    const lines = content.split('\n')

    // 見出し記法のチェック
    lines.forEach((line, index) => {
      const lineNumber = index + 1
      const trimmedLine = line.trim()

      // 不正な見出し記法（#の後に空白がない）
      const invalidHeadingMatch = trimmedLine.match(/^(#{1,6})[^#\s]/)
      if (invalidHeadingMatch) {
        warnings.push(`行 ${lineNumber}: 見出し記法で#の後に空白が必要です`)
      }

      // 7レベル以上の見出し
      const tooDeepHeadingMatch = trimmedLine.match(/^#{7,}/)
      if (tooDeepHeadingMatch) {
        warnings.push(`行 ${lineNumber}: 見出しレベルは6まで推奨されています`)
      }

      // リストの記法チェック
      const invalidListMatch = trimmedLine.match(/^[-*+][^\s]/)
      if (invalidListMatch) {
        warnings.push(`行 ${lineNumber}: リスト記法で記号の後に空白が必要です`)
      }

      // コードブロックの対称性チェック
      if (trimmedLine.startsWith('```')) {
        // この実装は簡易版。実際にはブロックの開始・終了をペアで管理する必要がある
        const codeBlocksInFile = content.match(/```/g)
        if (codeBlocksInFile && codeBlocksInFile.length % 2 !== 0) {
          warnings.push('コードブロックの開始と終了が対応していない可能性があります')
        }
      }
    })

    // 空の見出しチェック
    const emptyHeadings = content.match(/^#{1,6}\s*$/gm)
    if (emptyHeadings) {
      warnings.push(`空の見出しが ${emptyHeadings.length} 個あります`)
    }
  }

  /**
   * リンクの妥当性チェック
   * @param content ファイル内容
   * @param warnings 警告メッセージ配列
   */
  private validateLinks(content: string, warnings: string[]): void {
    // Markdownリンク記法: [text](url) または [text](url "title")
    const linkPattern = /\[([^\]]*)\]\(([^)]*)\)/g
    const links = Array.from(content.matchAll(linkPattern))

    links.forEach(match => {
      const linkText = match[1]
      const url = match[2].split(' ')[0] // タイトル部分を除去

      // 空のリンクテキスト
      if (!linkText.trim()) {
        warnings.push('空のリンクテキストがあります')
      }

      // 空のURL
      if (!url.trim()) {
        warnings.push('空のリンクURLがあります')
      }

      // 無効なURL形式（簡易チェック）
      if (url.startsWith('http')) {
        try {
          new URL(url)
        } catch {
          warnings.push(`無効なURL形式: ${url}`)
        }
      }

      // 相対リンクの警告
      if (!url.startsWith('http') && !url.startsWith('#') && !url.startsWith('/')) {
        warnings.push(`相対リンクが使用されています: ${url}`)
      }
    })

    // 参照リンクのチェック: [text][ref]
    const refLinkPattern = /\[([^\]]*)\]\[([^\]]*)\]/g
    const refLinks = Array.from(content.matchAll(refLinkPattern))
    const refDefinitions = Array.from(content.matchAll(/^\[([^\]]+)\]:\s*(.+)$/gm))
    
    const definedRefs = new Set(refDefinitions.map(match => match[1].toLowerCase()))
    
    refLinks.forEach(match => {
      const refId = (match[2] || match[1]).toLowerCase()
      if (!definedRefs.has(refId)) {
        warnings.push(`未定義の参照リンク: ${refId}`)
      }
    })
  }

  /**
   * 画像リンクの妥当性チェック
   * @param content ファイル内容
   * @param warnings 警告メッセージ配列
   */
  private validateImages(content: string, warnings: string[]): void {
    // Markdown画像記法: ![alt](src) または ![alt](src "title")
    const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g
    const images = Array.from(content.matchAll(imagePattern))

    images.forEach(match => {
      const altText = match[1]
      const src = match[2].split(' ')[0] // タイトル部分を除去

      // 空のalt属性
      if (!altText.trim()) {
        warnings.push('画像にalt属性がありません（アクセシビリティのため推奨）')
      }

      // 無効な画像URL
      if (src.startsWith('http')) {
        try {
          new URL(src)
        } catch {
          warnings.push(`無効な画像URL: ${src}`)
        }
      }

      // 画像拡張子のチェック
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp']
      const hasValidExtension = imageExtensions.some(ext => 
        src.toLowerCase().includes(ext)
      )
      if (!hasValidExtension && src.startsWith('http')) {
        warnings.push(`画像拡張子が不明: ${src}`)
      }
    })
  }

  /**
   * ファイルのプレビューを生成
   * 
   * Markdownファイルの場合、Markdown記法を除去して
   * プレーンテキストとしてプレビューを生成
   * 
   * @param maxLength プレビューの最大文字数
   * @returns プレビュー文字列
   */
  public getPreview(maxLength: number = FILE_CONSTANTS.PREVIEW_MAX_LENGTH): string {
    const content = this.getContent()
    
    if (!content || content.length === 0) {
      return '（空のMarkdownファイル）'
    }

    // Markdown記法を除去してプレーンテキスト化
    let preview = content
      // 見出し記号を除去
      .replace(/^#{1,6}\s+/gm, '')
      // 強調記法を除去
      .replace(/\*\*([^*]+)\*\*/g, '$1')  // **bold**
      .replace(/\*([^*]+)\*/g, '$1')      // *italic*
      .replace(/__([^_]+)__/g, '$1')      // __bold__
      .replace(/_([^_]+)_/g, '$1')        // _italic_
      // リンクをテキストのみに
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // 画像を除去
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '[画像]')
      // コードブロックを除去
      .replace(/```[\s\S]*?```/g, '[コードブロック]')
      // インラインコードを除去
      .replace(/`([^`]+)`/g, '$1')
      // リスト記号を除去
      .replace(/^[-*+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      // 引用記号を除去
      .replace(/^>\s*/gm, '')
      // 水平線を除去
      .replace(/^[-*_]{3,}$/gm, '')
      // 改行を空白に
      .replace(/\r?\n/g, ' ')
      // 連続する空白を1つに
      .replace(/\s+/g, ' ')
      .trim()

    // 指定長で切り詰め
    if (preview.length > maxLength) {
      preview = preview.substring(0, maxLength - 3) + '...'
    }

    return preview
  }

  /**
   * Markdownファイル特有のメソッド
   */

  /**
   * 見出し一覧を取得
   */
  public getHeadings(): Array<{ level: number; text: string; line: number }> {
    const content = this.getContent()
    const lines = content.split('\n')
    const headings: Array<{ level: number; text: string; line: number }> = []

    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/)
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2].trim(),
          line: index + 1
        })
      }
    })

    return headings
  }

  /**
   * リンク一覧を取得
   */
  public getLinks(): Array<{ text: string; url: string; line: number }> {
    const content = this.getContent()
    const lines = content.split('\n')
    const links: Array<{ text: string; url: string; line: number }> = []

    lines.forEach((line, index) => {
      const linkMatches = Array.from(line.matchAll(/\[([^\]]*)\]\(([^)]+)\)/g))
      linkMatches.forEach(match => {
        links.push({
          text: match[1],
          url: match[2].split(' ')[0], // タイトル部分を除去
          line: index + 1
        })
      })
    })

    return links
  }

  /**
   * 目次（TOC）を自動生成
   */
  public generateTableOfContents(): string {
    const headings = this.getHeadings()
    
    if (headings.length === 0) {
      return ''
    }

    const toc = headings.map(heading => {
      const indent = '  '.repeat(heading.level - 1)
      const anchor = heading.text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
      
      return `${indent}- [${heading.text}](#${anchor})`
    }).join('\n')

    return `## 目次\n\n${toc}\n`
  }

  /**
   * Markdown統計情報を取得
   */
  public getMarkdownStatistics(): {
    headings: number
    links: number
    images: number
    codeBlocks: number
    lists: number
    tables: number
  } {
    const content = this.getContent()

    const headingCount = (content.match(/^#{1,6}\s+/gm) || []).length
    const linkCount = (content.match(/\[([^\]]*)\]\(([^)]+)\)/g) || []).length
    const imageCount = (content.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || []).length
    const codeBlockCount = (content.match(/```/g) || []).length / 2
    const listCount = (content.match(/^[-*+]\s+/gm) || []).length
    const tableCount = (content.match(/\|.*\|/gm) || []).length

    return {
      headings: headingCount,
      links: linkCount,
      images: imageCount,
      codeBlocks: Math.floor(codeBlockCount),
      lists: listCount,
      tables: tableCount
    }
  }

  /**
   * 文字列表現をオーバーライド
   */
  public toString(): string {
    const stats = this.getMarkdownStatistics()
    return `Markdown File: ${this.getName()} (${stats.headings} headings, ${stats.links} links)`
  }
}