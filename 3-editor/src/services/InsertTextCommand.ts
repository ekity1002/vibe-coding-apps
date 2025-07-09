import { CommandContext, ITextCommand, TEXT_COMMAND_TYPES, TextCommandType, TextPosition } from '../types/CommandTypes'

/**
 * テキスト挿入コマンド
 *
 * 指定された位置にテキストを挿入する操作を表現するCommandパターンの実装。
 * アンドゥ時は挿入したテキストを削除して元の状態に戻す。
 *
 * Design Pattern: Command Pattern
 * - execute(): テキスト挿入の実行
 * - undo(): 挿入の取り消し（削除）
 */
export class InsertTextCommand implements ITextCommand {
  public readonly type: TextCommandType = TEXT_COMMAND_TYPES.INSERT
  public readonly position: TextPosition

  private readonly textToInsert: string
  private readonly context: CommandContext
  private executed: boolean = false
  private previousText: string = ''

  constructor(
    text: string,
    insertPosition: number,
    context: CommandContext
  ) {
    this.textToInsert = text
    this.context = context
    this.position = {
      start: insertPosition,
      end: insertPosition
    }
  }

  /**
   * テキスト挿入を実行
   */
  execute(): boolean {
    try {
      // 実行前の状態を保存
      this.previousText = this.context.currentText

      // テキスト挿入の実行
      const beforeText = this.context.currentText.slice(0, this.position.start)
      const afterText = this.context.currentText.slice(this.position.start)
      const newText = beforeText + this.textToInsert + afterText

      // テキストを更新
      this.context.updateText(newText)

      // カーソル位置を挿入終了位置に設定
      if (this.context.setCursorPosition) {
        this.context.setCursorPosition(this.position.start + this.textToInsert.length)
      }

      this.executed = true
      return true
    } catch (error) {
      console.error('InsertTextCommand execution failed:', error)
      return false
    }
  }

  /**
   * テキスト挿入を取り消し
   */
  undo(): boolean {
    if (!this.executed) {
      return false
    }

    try {
      // 元のテキスト状態に復元
      this.context.updateText(this.previousText)

      // カーソル位置を挿入開始位置に戻す
      if (this.context.setCursorPosition) {
        this.context.setCursorPosition(this.position.start)
      }

      this.executed = false
      return true
    } catch (error) {
      console.error('InsertTextCommand undo failed:', error)
      return false
    }
  }

  /**
   * コマンドの説明を取得
   */
  getDescription(): string {
    const preview = this.textToInsert.length > 20
      ? this.textToInsert.substring(0, 20) + '...'
      : this.textToInsert

    return `テキスト挿入: "${preview}" at position ${this.position.start}`
  }

  /**
   * アンドゥ可能かどうかを判定
   */
  canUndo(): boolean {
    return this.executed
  }

  /**
   * 挿入するテキストを取得
   */
  public getInsertedText(): string {
    return this.textToInsert
  }

  /**
   * 挿入位置を取得
   */
  public getInsertPosition(): number {
    return this.position.start
  }

  /**
   * 実行状態を取得
   */
  public isExecuted(): boolean {
    return this.executed
  }
}
