import { 
  IObserver, 
  ISubject, 
  ObserverServiceConfig, 
  ObserverStats,
  ObserverEvent,
  ObserverEventType
} from '../types/ObserverTypes'

/**
 * Observer管理サービス
 *
 * Observer Patternの実装において、オブザーバーの登録・解除・通知を管理する。
 * 複数のSubject間でのオブザーバー管理を一元化し、パフォーマンス監視とエラーハンドリングを提供する。
 *
 * Design Patterns:
 * - Observer Pattern: オブザーバーの管理と通知
 * - Singleton Pattern: アプリケーション全体での一元管理（オプション）
 */
export class ObserverService<T = any> implements ISubject<T> {
  private observers: Map<string, IObserver<T>> = new Map()
  private readonly config: ObserverServiceConfig
  private stats: ObserverStats

  constructor(config?: Partial<ObserverServiceConfig>) {
    this.config = {
      maxObservers: 100,
      notificationTimeout: 5000,
      enableDebug: false,
      enableErrorLog: true,
      enablePerformanceMonitoring: true,
      ...config
    }

    this.stats = {
      totalObservers: 0,
      activeObservers: 0,
      totalNotifications: 0,
      notificationErrors: 0,
      lastNotificationTime: 0,
      averageNotificationTime: 0
    }
  }

  /**
   * オブザーバーを登録
   */
  attach(observer: IObserver<T>): void {
    const id = observer.getId()

    if (this.observers.has(id)) {
      if (this.config.enableDebug) {
        console.warn(`Observer with id '${id}' is already registered`)
      }
      return
    }

    if (this.observers.size >= this.config.maxObservers) {
      throw new Error(`Maximum number of observers (${this.config.maxObservers}) exceeded`)
    }

    this.observers.set(id, observer)
    this.stats.totalObservers++
    this.updateActiveObserverCount()

    if (this.config.enableDebug) {
      console.log(`Observer '${id}' attached. Total: ${this.observers.size}`)
    }
  }

  /**
   * オブザーバーの登録を解除
   */
  detach(observer: IObserver<T>): void {
    const id = observer.getId()
    const removed = this.observers.delete(id)

    if (removed) {
      this.updateActiveObserverCount()
      
      if (this.config.enableDebug) {
        console.log(`Observer '${id}' detached. Total: ${this.observers.size}`)
      }
    } else if (this.config.enableDebug) {
      console.warn(`Observer with id '${id}' not found for removal`)
    }
  }

  /**
   * IDによるオブザーバーの解除
   */
  detachById(id: string): boolean {
    const removed = this.observers.delete(id)
    
    if (removed) {
      this.updateActiveObserverCount()
      
      if (this.config.enableDebug) {
        console.log(`Observer '${id}' detached by ID. Total: ${this.observers.size}`)
      }
    }
    
    return removed
  }

  /**
   * 全てのオブザーバーに通知
   */
  notify(data: T): void {
    const startTime = performance.now()
    const activeObservers = this.getActiveObservers()

    if (activeObservers.length === 0) {
      if (this.config.enableDebug) {
        console.log('No active observers to notify')
      }
      return
    }

    let successCount = 0
    let errorCount = 0

    for (const observer of activeObservers) {
      try {
        observer.update(data)
        successCount++
      } catch (error) {
        errorCount++
        this.stats.notificationErrors++

        if (this.config.enableErrorLog) {
          console.error(`Error notifying observer '${observer.getId()}':`, error)
        }
      }
    }

    // 統計情報の更新
    const endTime = performance.now()
    const notificationTime = endTime - startTime

    this.stats.totalNotifications++
    this.stats.lastNotificationTime = Date.now()
    
    if (this.config.enablePerformanceMonitoring) {
      this.updateAverageNotificationTime(notificationTime)
    }

    if (this.config.enableDebug) {
      console.log(`Notified ${successCount} observers successfully, ${errorCount} errors. Time: ${notificationTime.toFixed(2)}ms`)
    }
  }

  /**
   * イベント形式での通知
   */
  notifyEvent(type: ObserverEventType, data: T, source: string = 'ObserverService'): void {
    const event: ObserverEvent<T> = {
      type,
      data,
      timestamp: Date.now(),
      source
    }

    this.notify(event as T)
  }

  /**
   * 登録されているオブザーバー数を取得
   */
  getObserverCount(): number {
    return this.observers.size
  }

  /**
   * アクティブなオブザーバー数を取得
   */
  getActiveObserverCount(): number {
    return this.getActiveObservers().length
  }

  /**
   * 統計情報を取得
   */
  getStats(): Readonly<ObserverStats> {
    return { ...this.stats }
  }

  /**
   * 統計情報をリセット
   */
  resetStats(): void {
    this.stats = {
      ...this.stats,
      totalNotifications: 0,
      notificationErrors: 0,
      averageNotificationTime: 0
    }
  }

  /**
   * 全てのオブザーバーを解除
   */
  clear(): void {
    const count = this.observers.size
    this.observers.clear()
    this.updateActiveObserverCount()

    if (this.config.enableDebug) {
      console.log(`Cleared ${count} observers`)
    }
  }

  /**
   * オブザーバーが登録されているかチェック
   */
  hasObserver(id: string): boolean {
    return this.observers.has(id)
  }

  /**
   * 指定したIDのオブザーバーを取得
   */
  getObserver(id: string): IObserver<T> | undefined {
    return this.observers.get(id)
  }

  /**
   * 全てのオブザーバーIDを取得
   */
  getAllObserverIds(): string[] {
    return Array.from(this.observers.keys())
  }

  /**
   * 設定を更新
   */
  updateConfig(newConfig: Partial<ObserverServiceConfig>): void {
    Object.assign(this.config, newConfig)

    if (this.config.enableDebug) {
      console.log('ObserverService config updated:', newConfig)
    }
  }

  /**
   * デバッグ情報を出力
   */
  debug(): void {
    console.group('ObserverService Debug Info')
    console.log('Config:', this.config)
    console.log('Stats:', this.stats)
    console.log('Observers:', Array.from(this.observers.keys()))
    console.log('Active Observers:', this.getActiveObservers().map(o => o.getId()))
    console.groupEnd()
  }

  // プライベートメソッド

  /**
   * アクティブなオブザーバーを取得
   */
  private getActiveObservers(): IObserver<T>[] {
    return Array.from(this.observers.values()).filter(observer => {
      return observer.isActive ? observer.isActive() : true
    })
  }

  /**
   * アクティブなオブザーバー数を更新
   */
  private updateActiveObserverCount(): void {
    this.stats.activeObservers = this.getActiveObservers().length
  }

  /**
   * 平均通知時間を更新
   */
  private updateAverageNotificationTime(newTime: number): void {
    const totalNotifications = this.stats.totalNotifications
    const currentAverage = this.stats.averageNotificationTime
    
    // 移動平均の計算
    this.stats.averageNotificationTime = 
      (currentAverage * (totalNotifications - 1) + newTime) / totalNotifications
  }
}

/**
 * コールバック関数をObserverとして扱うためのヘルパークラス
 */
export class CallbackObserver<T = any> implements IObserver<T> {
  private readonly id: string
  private readonly callback: (data: T) => void
  private active: boolean = true

  constructor(callback: (data: T) => void, id?: string) {
    this.callback = callback
    this.id = id || `callback-observer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  update(data: T): void {
    if (this.active) {
      this.callback(data)
    }
  }

  getId(): string {
    return this.id
  }

  isActive(): boolean {
    return this.active
  }

  /**
   * オブザーバーを無効化
   */
  deactivate(): void {
    this.active = false
  }

  /**
   * オブザーバーを有効化
   */
  activate(): void {
    this.active = true
  }
}

/**
 * グローバルなObserverServiceインスタンス
 * アプリケーション全体での一元管理用（オプション）
 */
let globalObserverService: ObserverService | null = null

/**
 * グローバルObserverServiceを取得
 */
export function getGlobalObserverService(): ObserverService {
  if (!globalObserverService) {
    globalObserverService = new ObserverService({
      enableDebug: process.env.NODE_ENV === 'development',
      enablePerformanceMonitoring: true
    })
  }
  return globalObserverService
}

/**
 * グローバルObserverServiceをリセット
 */
export function resetGlobalObserverService(): void {
  if (globalObserverService) {
    globalObserverService.clear()
    globalObserverService = null
  }
}