import { CommandHistoryConfig, ICommand } from '../../domain/command/types/Command'

/**
 * Command管理サービス
 *
 * Command Patternの実装において、コマンドの実行・履歴管理・アンドゥ・リドゥ機能を提供する。
 * アプリケーション全体のコマンド実行を一元管理し、操作履歴の保持と復元機能を実現する。
 *
 * Design Patterns:
 * - Command Pattern: コマンドの実行と管理
 * - Memento Pattern: 履歴状態の保存
 * - Singleton Pattern: グローバルなコマンド管理（オプション）
 */
export class CommandService {
  private history: ICommand[] = []
  private currentIndex: number = -1
  private readonly config: CommandHistoryConfig

  constructor(config?: Partial<CommandHistoryConfig>) {
    this.config = {
      maxHistorySize: 100,
      autoSaveInterval: 0,
      enableMemoryOptimization: true,
      ...config
    }
  }

  /**
   * コマンドを実行し、履歴に追加
   */
  executeCommand(command: ICommand): boolean {
    try {
      // コマンドの実行
      const success = command.execute()

      if (success) {
        // 現在位置以降の履歴を削除（分岐の解決）
        if (this.currentIndex < this.history.length - 1) {
          this.history = this.history.slice(0, this.currentIndex + 1)
        }

        // 新しいコマンドを履歴に追加
        this.history.push(command)
        this.currentIndex++

        // 履歴サイズの制限
        this.enforceHistoryLimit()

        return true
      }

      return false
    } catch (error) {
      console.error('Command execution failed:', error)
      return false
    }
  }

  /**
   * 最後のコマンドを取り消し（アンドゥ）
   */
  undo(): boolean {
    if (!this.canUndo()) {
      return false
    }

    try {
      const command = this.history[this.currentIndex]
      const success = command.undo()

      if (success) {
        this.currentIndex--
        return true
      }

      return false
    } catch (error) {
      console.error('Undo failed:', error)
      return false
    }
  }

  /**
   * 取り消したコマンドを再実行（リドゥ）
   */
  redo(): boolean {
    if (!this.canRedo()) {
      return false
    }

    try {
      this.currentIndex++
      const command = this.history[this.currentIndex]
      const success = command.execute()

      if (!success) {
        this.currentIndex-- // 失敗時は元に戻す
        return false
      }

      return true
    } catch (error) {
      console.error('Redo failed:', error)
      this.currentIndex-- // エラー時は元に戻す
      return false
    }
  }

  /**
   * アンドゥが可能かどうかを判定
   */
  canUndo(): boolean {
    return this.currentIndex >= 0 &&
           this.currentIndex < this.history.length &&
           this.history[this.currentIndex].canUndo()
  }

  /**
   * リドゥが可能かどうかを判定
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1
  }

  /**
   * 履歴をクリア
   */
  clearHistory(): void {
    this.history = []
    this.currentIndex = -1
  }

  /**
   * 履歴の統計情報を取得
   */
  getHistoryStats(): {
    totalCommands: number
    currentPosition: number
    canUndo: boolean
    canRedo: boolean
    memoryUsage: number
  } {
    return {
      totalCommands: this.history.length,
      currentPosition: this.currentIndex + 1,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      memoryUsage: this.estimateMemoryUsage()
    }
  }

  /**
   * 履歴の一覧を取得（デバッグ用）
   */
  getHistoryList(): Array<{
    index: number
    description: string
    executed: boolean
    canUndo: boolean
  }> {
    return this.history.map((command, index) => ({
      index,
      description: command.getDescription(),
      executed: index <= this.currentIndex,
      canUndo: command.canUndo()
    }))
  }

  /**
   * 特定の履歴ポイントにジャンプ
   */
  jumpToHistoryPoint(targetIndex: number): boolean {
    if (targetIndex < -1 || targetIndex >= this.history.length) {
      return false
    }

    try {
      // 現在位置から目標位置へ移動
      while (this.currentIndex > targetIndex) {
        if (!this.undo()) return false
      }

      while (this.currentIndex < targetIndex) {
        if (!this.redo()) return false
      }

      return true
    } catch (error) {
      console.error('Jump to history point failed:', error)
      return false
    }
  }

  /**
   * 履歴サイズの制限を適用
   */
  private enforceHistoryLimit(): void {
    if (this.history.length > this.config.maxHistorySize) {
      const removeCount = this.history.length - this.config.maxHistorySize
      this.history = this.history.slice(removeCount)
      this.currentIndex -= removeCount

      // インデックスが負の値にならないように調整
      if (this.currentIndex < -1) {
        this.currentIndex = -1
      }
    }
  }

  /**
   * メモリ使用量の推定（簡易版）
   */
  private estimateMemoryUsage(): number {
    // 簡易的なメモリ使用量の推定
    return this.history.reduce((total, command) => {
      const description = command.getDescription()
      return total + description.length * 2 // 文字列のおおよそのメモリ使用量
    }, 0)
  }

  /**
   * 設定を更新
   */
  updateConfig(newConfig: Partial<CommandHistoryConfig>): void {
    Object.assign(this.config, newConfig)

    // 新しい設定に合わせて履歴を調整
    if (this.history.length > this.config.maxHistorySize) {
      this.enforceHistoryLimit()
    }
  }

  /**
   * 現在の設定を取得
   */
  getConfig(): CommandHistoryConfig {
    return { ...this.config }
  }
}
