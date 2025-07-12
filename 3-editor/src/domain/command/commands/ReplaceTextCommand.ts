import { ITextCommand, TextCommandType, TextPosition, CommandContext, TEXT_COMMAND_TYPES } from '../types/Command'

/**
 * テキスト置換コマンド
 * 
 * 指定された範囲のテキストを新しいテキストで置換する操作を表現するCommandパターンの実装。
 * アンドゥ時は元のテキストに復元する。
 * 
 * Design Pattern: Command Pattern
 * - execute(): テキスト置換の実行
 * - undo(): 置換の取り消し（元テキストへの復元）
 */
export class ReplaceTextCommand implements ITextCommand {
  public readonly type: TextCommandType = TEXT_COMMAND_TYPES.REPLACE
  public readonly position: TextPosition
  
  private readonly newText: string
  private readonly context: CommandContext
  private executed: boolean = false
  private originalText: string = ''
  private previousFullText: string = ''

  constructor(
    newText: string,
    start: number,
    end: number,
    context: CommandContext
  ) {
    this.newText = newText
    this.context = context
    this.position = {
      start: Math.min(start, end),
      end: Math.max(start, end)
    }
  }

  /**
   * テキスト置換を実行
   */
  execute(): boolean {
    try {
      // 実行前の状態を保存
      this.previousFullText = this.context.currentText
      
      // 置換対象のテキストを保存
      this.originalText = this.context.currentText.slice(
        this.position.start, 
        this.position.end
      )
      
      // テキスト置換の実行
      const beforeText = this.context.currentText.slice(0, this.position.start)
      const afterText = this.context.currentText.slice(this.position.end)
      const resultText = beforeText + this.newText + afterText
      
      // テキストを更新
      this.context.updateText(resultText)
      
      // カーソル位置を置換終了位置に設定
      if (this.context.setCursorPosition) {
        this.context.setCursorPosition(this.position.start + this.newText.length)
      }
      
      this.executed = true
      return true
    } catch (error) {
      console.error('ReplaceTextCommand execution failed:', error)
      return false
    }
  }

  /**
   * テキスト置換を取り消し
   */
  undo(): boolean {
    if (!this.executed) {
      return false
    }

    try {
      // 元のテキスト状態に復元
      this.context.updateText(this.previousFullText)
      
      // 元の置換範囲を選択状態に設定
      if (this.context.setSelection) {
        this.context.setSelection(this.position.start, this.position.end)
      } else if (this.context.setCursorPosition) {
        this.context.setCursorPosition(this.position.end)
      }
      
      this.executed = false
      return true
    } catch (error) {
      console.error('ReplaceTextCommand undo failed:', error)
      return false
    }
  }

  /**
   * コマンドの説明を取得
   */
  getDescription(): string {
    const originalPreview = this.originalText.length > 15 
      ? this.originalText.substring(0, 15) + '...'
      : this.originalText
    
    const newPreview = this.newText.length > 15 
      ? this.newText.substring(0, 15) + '...'
      : this.newText
    
    return `テキスト置換: "${originalPreview}" → "${newPreview}" at ${this.position.start}-${this.position.end}`
  }

  /**
   * アンドゥ可能かどうかを判定
   */
  canUndo(): boolean {
    return this.executed
  }

  /**
   * 置換前のテキストを取得
   */
  public getOriginalText(): string {
    return this.originalText
  }

  /**
   * 置換後のテキストを取得
   */
  public getNewText(): string {
    return this.newText
  }

  /**
   * 置換範囲を取得
   */
  public getReplaceRange(): { start: number; end: number } {
    return {
      start: this.position.start,
      end: this.position.end
    }
  }

  /**
   * 置換による文字数の変化を取得
   */
  public getLengthChange(): number {
    return this.newText.length - this.originalText.length
  }

  /**
   * 実行状態を取得
   */
  public isExecuted(): boolean {
    return this.executed
  }
}