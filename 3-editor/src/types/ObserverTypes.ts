/**
 * Observer Pattern 関連の型定義
 * 
 * Observer Patternの実装において、状態変更の監視・通知システムを実現するための型システム。
 * エディタ設定変更、Command実行、UI状態変更等の通知を統一的に管理する。
 * 
 * Design Patterns:
 * - Observer Pattern: オブジェクトの状態変化を監視・通知
 * - Subject-Observer関係: 疎結合な通知システム
 */

/**
 * Observer パターンの基本インターフェース
 * 
 * 状態変更の通知を受け取るオブザーバーが実装する
 */
export interface IObserver<T = any> {
  /**
   * 状態変更の通知を受け取る
   * @param data 変更された状態データ
   */
  update(data: T): void

  /**
   * オブザーバーの一意識別子を取得
   * @returns オブザーバーID
   */
  getId(): string

  /**
   * オブザーバーが有効かどうか
   * @returns 有効な場合はtrue
   */
  isActive?(): boolean
}

/**
 * Subject パターンの基本インターフェース
 * 
 * 状態を持ち、変更をオブザーバーに通知するオブジェクトが実装する
 */
export interface ISubject<T = any> {
  /**
   * オブザーバーを登録
   * @param observer 登録するオブザーバー
   */
  attach(observer: IObserver<T>): void

  /**
   * オブザーバーの登録を解除
   * @param observer 解除するオブザーバー
   */
  detach(observer: IObserver<T>): void

  /**
   * 全てのオブザーバーに通知
   * @param data 通知するデータ
   */
  notify(data: T): void

  /**
   * 登録されているオブザーバー数を取得
   * @returns オブザーバー数
   */
  getObserverCount(): number
}

/**
 * エディタ設定変更の通知データ
 */
export interface EditorConfigChangeData {
  /** 変更された設定のキー */
  key: keyof EditorSettings
  /** 変更前の値 */
  oldValue: any
  /** 変更後の値 */
  newValue: any
  /** 変更発生時刻 */
  timestamp: number
  /** 変更の発生源 */
  source?: string
}

/**
 * エディタ設定の型定義（参照用）
 */
export interface EditorSettings {
  theme: 'light' | 'dark'
  fontSize: number
  showLineNumbers: boolean
  autoSave: boolean
  tabSize: number
  wordWrap: boolean
}

/**
 * Command実行の通知データ
 */
export interface CommandExecutionData {
  /** 実行されたCommandの説明 */
  description: string
  /** Command実行の種類 */
  type: 'execute' | 'undo' | 'redo'
  /** 実行結果 */
  success: boolean
  /** 実行時刻 */
  timestamp: number
  /** 現在の履歴位置 */
  historyPosition: number
  /** 履歴の総数 */
  totalHistory: number
}

/**
 * テキスト変更の通知データ
 */
export interface TextChangeData {
  /** 変更前のテキスト */
  oldText: string
  /** 変更後のテキスト */
  newText: string
  /** 変更タイプ */
  changeType: 'insert' | 'delete' | 'replace' | 'format'
  /** 変更位置 */
  position: {
    start: number
    end: number
  }
  /** 変更時刻 */
  timestamp: number
}

/**
 * Observer の通知タイプ
 */
export type ObserverEventType = 
  | 'CONFIG_CHANGE'
  | 'COMMAND_EXECUTION' 
  | 'TEXT_CHANGE'
  | 'HISTORY_CHANGE'
  | 'UI_STATE_CHANGE'

/**
 * Observer 通知イベントの基本構造
 */
export interface ObserverEvent<T = any> {
  /** イベントタイプ */
  type: ObserverEventType
  /** イベントデータ */
  data: T
  /** イベント発生時刻 */
  timestamp: number
  /** イベント発生源 */
  source: string
}

/**
 * Observer の設定オプション
 */
export interface ObserverConfig {
  /** 通知の非同期実行を有効にするか */
  enableAsync: boolean
  /** エラー時の継続実行を有効にするか */
  continueOnError: boolean
  /** 通知のデバウンス時間（ms） */
  debounceTime?: number
  /** 通知の優先度 */
  priority?: 'high' | 'normal' | 'low'
}

/**
 * コールバック関数型のObserver実装
 */
export interface CallbackObserver<T = any> extends IObserver<T> {
  /** コールバック関数 */
  readonly callback: (data: T) => void
  /** Observer設定 */
  readonly config: ObserverConfig
}

/**
 * Observer管理の統計情報
 */
export interface ObserverStats {
  /** 登録されているObserver数 */
  totalObservers: number
  /** アクティブなObserver数 */
  activeObservers: number
  /** 送信された通知数 */
  totalNotifications: number
  /** 通知エラー数 */
  notificationErrors: number
  /** 最後の通知時刻 */
  lastNotificationTime: number
  /** 平均通知時間（ms） */
  averageNotificationTime: number
}

/**
 * Observer サービスの設定
 */
export interface ObserverServiceConfig {
  /** 最大Observer数 */
  maxObservers: number
  /** 通知タイムアウト時間（ms） */
  notificationTimeout: number
  /** デバッグモードを有効にするか */
  enableDebug: boolean
  /** エラーログを有効にするか */
  enableErrorLog: boolean
  /** パフォーマンス監視を有効にするか */
  enablePerformanceMonitoring: boolean
}

/**
 * 優先度付きObserver
 */
export interface PriorityObserver<T = any> extends IObserver<T> {
  /** 優先度（数値が大きいほど高優先度） */
  readonly priority: number
}

/**
 * 条件付きObserver
 */
export interface ConditionalObserver<T = any> extends IObserver<T> {
  /**
   * 通知を受け取るかどうかの条件判定
   * @param data 通知データ
   * @returns 通知を受け取る場合はtrue
   */
  shouldNotify(data: T): boolean
}

/**
 * Observer パターンのファクトリーインターフェース
 */
export interface IObserverFactory {
  /**
   * コールバック型Observerを作成
   * @param callback コールバック関数
   * @param config Observer設定
   * @returns 作成されたObserver
   */
  createCallbackObserver<T>(
    callback: (data: T) => void,
    config?: Partial<ObserverConfig>
  ): CallbackObserver<T>

  /**
   * 優先度付きObserverを作成
   * @param observer ベースObserver
   * @param priority 優先度
   * @returns 優先度付きObserver
   */
  createPriorityObserver<T>(
    observer: IObserver<T>,
    priority: number
  ): PriorityObserver<T>

  /**
   * 条件付きObserverを作成
   * @param observer ベースObserver
   * @param condition 条件判定関数
   * @returns 条件付きObserver
   */
  createConditionalObserver<T>(
    observer: IObserver<T>,
    condition: (data: T) => boolean
  ): ConditionalObserver<T>
}