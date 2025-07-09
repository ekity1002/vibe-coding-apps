import { CommandContext, ITextCommand, TEXT_COMMAND_TYPES, TextCommandType, TextPosition } from '../types/CommandTypes'

/**
 * テキスト削除コマンド
 *
 * 指定された範囲のテキストを削除する操作を表現するCommandパターンの実装。
 * アンドゥ時は削除したテキストを元の位置に復元する。
 *
 * Design Pattern: Command Pattern
 * - execute(): テキスト削除の実行
 * - undo(): 削除の取り消し（復元）
 */
export class DeleteTextCommand implements ITextCommand {
  public readonly type: TextCommandType = TEXT_COMMAND_TYPES.DELETE
  public readonly position: TextPosition

  private readonly context: CommandContext
  private executed: boolean = false
  private deletedText: string = ''
  private previousText: string = ''

  constructor(
    start: number,
    end: number,
    context: CommandContext
  ) {
    this.context = context
    this.position = {
      start: Math.min(start, end),
      end: Math.max(start, end)
    }
  }

  /**
   * テキスト削除を実行
   */
  execute(): boolean {
    try {
      // 実行前の状態を保存
      this.previousText = this.context.currentText

      // 削除対象のテキストを保存
      this.deletedText = this.context.currentText.slice(
        this.position.start,
        this.position.end
      )

      // テキスト削除の実行
      const beforeText = this.context.currentText.slice(0, this.position.start)
      const afterText = this.context.currentText.slice(this.position.end)
      const newText = beforeText + afterText

      // テキストを更新
      this.context.updateText(newText)

      // カーソル位置を削除開始位置に設定
      if (this.context.setCursorPosition) {
        this.context.setCursorPosition(this.position.start)
      }

      this.executed = true
      return true
    } catch (error) {
      console.error('DeleteTextCommand execution failed:', error)
      return false
    }
  }

  /**
   * テキスト削除を取り消し
   */
  undo(): boolean {
    if (!this.executed) {
      return false
    }

    try {
      // 元のテキスト状態に復元
      this.context.updateText(this.previousText)

      // 削除範囲を選択状態に設定
      if (this.context.setSelection) {
        this.context.setSelection(this.position.start, this.position.end)
      } else if (this.context.setCursorPosition) {
        this.context.setCursorPosition(this.position.end)
      }

      this.executed = false
      return true
    } catch (error) {
      console.error('DeleteTextCommand undo failed:', error)
      return false
    }
  }

  /**
   * コマンドの説明を取得
   */
  getDescription(): string {
    const length = this.position.end - this.position.start
    const preview = this.deletedText.length > 20
      ? this.deletedText.substring(0, 20) + '...'
      : this.deletedText

    return `テキスト削除: "${preview}" (${length}文字) from ${this.position.start}-${this.position.end}`
  }

  /**
   * アンドゥ可能かどうかを判定
   */
  canUndo(): boolean {
    return this.executed
  }

  /**
   * 削除されたテキストを取得
   */
  public getDeletedText(): string {
    return this.deletedText
  }

  /**
   * 削除範囲を取得
   */
  public getDeleteRange(): { start: number; end: number } {
    return {
      start: this.position.start,
      end: this.position.end
    }
  }

  /**
   * 削除された文字数を取得
   */
  public getDeletedLength(): number {
    return this.position.end - this.position.start
  }

  /**
   * 実行状態を取得
   */
  public isExecuted(): boolean {
    return this.executed
  }
}
