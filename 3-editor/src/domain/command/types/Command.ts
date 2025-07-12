/**
 * Command Pattern 関連の型定義
 * 
 * テキストエディタでの操作をCommandオブジェクトとして抽象化し、
 * アンドゥ・リドゥ機能を実現するための型システム
 */

/**
 * Command パターンの基本インターフェース
 * 
 * 全ての操作はこのインターフェースを実装し、
 * execute() で実行、undo() で取り消しを行う
 */
export interface ICommand {
  /**
   * コマンドを実行する
   * @returns 実行結果（成功時はtrue）
   */
  execute(): boolean

  /**
   * コマンドを取り消す
   * @returns 取り消し結果（成功時はtrue）
   */
  undo(): boolean

  /**
   * コマンドの説明を取得
   * @returns 人間が読める形式の操作説明
   */
  getDescription(): string

  /**
   * コマンドがアンドゥ可能かどうか
   * @returns アンドゥ可能な場合はtrue
   */
  canUndo(): boolean
}

/**
 * テキスト操作用のCommandの基底インターフェース
 * 
 * テキストエディタ特有の情報を追加
 */
export interface ITextCommand extends ICommand {
  /**
   * 操作対象のテキスト位置情報
   */
  readonly position: TextPosition

  /**
   * 操作の種類
   */
  readonly type: TextCommandType
}

/**
 * テキスト内の位置を表す型
 */
export interface TextPosition {
  /** 開始位置（文字インデックス） */
  start: number
  /** 終了位置（文字インデックス） */
  end: number
  /** 行番号（1から開始） */
  line?: number
  /** 列番号（1から開始） */
  column?: number
}

/**
 * テキスト操作の種類
 */
export type TextCommandType = 'insert' | 'delete' | 'replace' | 'format' | 'move'

/**
 * テキスト操作の種類定数
 */
export const TEXT_COMMAND_TYPES = {
  INSERT: 'insert' as const,
  DELETE: 'delete' as const,
  REPLACE: 'replace' as const,
  FORMAT: 'format' as const,
  MOVE: 'move' as const
} as const

/**
 * コマンド実行の結果
 */
export interface CommandResult {
  /** 実行成功フラグ */
  success: boolean
  /** エラーメッセージ（失敗時） */
  error?: string
  /** 実行前のテキスト状態 */
  previousState?: string
  /** 実行後のテキスト状態 */
  newState?: string
}

/**
 * コマンドの実行コンテキスト
 * 
 * コマンド実行時に必要な環境情報
 */
export interface CommandContext {
  /** 現在のテキスト内容 */
  currentText: string
  /** テキストを更新する関数 */
  updateText: (newText: string) => void
  /** カーソル位置を設定する関数 */
  setCursorPosition?: (position: number) => void
  /** 選択範囲を設定する関数 */
  setSelection?: (start: number, end: number) => void
}

/**
 * コマンド履歴の設定
 */
export interface CommandHistoryConfig {
  /** 最大履歴数（デフォルト: 100） */
  maxHistorySize: number
  /** 自動保存間隔（ms、0で無効） */
  autoSaveInterval: number
  /** メモリ最適化を有効にするか */
  enableMemoryOptimization: boolean
}

/**
 * 複合コマンド（マクロ）用のインターフェース
 */
export interface ICompositeCommand extends ICommand {
  /** 子コマンドの配列 */
  readonly commands: ICommand[]
  /** コマンドを追加 */
  addCommand(command: ICommand): void
  /** コマンドを削除 */
  removeCommand(command: ICommand): void
}

/**
 * コマンドファクトリーのインターフェース
 */
export interface ICommandFactory {
  /**
   * テキスト挿入コマンドを作成
   */
  createInsertCommand(
    text: string, 
    position: number, 
    context: CommandContext
  ): ITextCommand

  /**
   * テキスト削除コマンドを作成
   */
  createDeleteCommand(
    start: number, 
    end: number, 
    context: CommandContext
  ): ITextCommand

  /**
   * テキスト置換コマンドを作成
   */
  createReplaceCommand(
    newText: string, 
    start: number, 
    end: number, 
    context: CommandContext
  ): ITextCommand
}