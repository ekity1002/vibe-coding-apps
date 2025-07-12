import type { IObserver, EditorConfigChangeData } from '../types/ObserverTypes'

/**
 * エディタ設定変更用のObserver実装
 *
 * EditorConfigの設定変更を監視し、UIコンポーネントに変更を通知する。
 * 特定の設定項目のみを監視する条件付きObserverとしても利用可能。
 *
 * Design Pattern: Observer Pattern
 * - エディタ設定の変更を監視
 * - UIコンポーネントへの自動通知
 * - 設定項目別のフィルタリング
 */
export class ConfigObserver implements IObserver<EditorConfigChangeData> {
  private readonly id: string
  private readonly callback: (data: EditorConfigChangeData) => void
  private readonly watchedKeys: Set<string> | null
  private active: boolean = true

  constructor(
    callback: (data: EditorConfigChangeData) => void,
    options: {
      id?: string
      watchedKeys?: string[]
    } = {}
  ) {
    this.callback = callback
    this.id = options.id || `config-observer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.watchedKeys = options.watchedKeys ? new Set(options.watchedKeys) : null
  }

  /**
   * 設定変更の通知を受け取る
   */
  update(data: EditorConfigChangeData): void {
    if (!this.active) {
      return
    }

    // 監視対象のキーが指定されている場合、フィルタリング
    if (this.watchedKeys && !this.watchedKeys.has(data.key)) {
      return
    }

    try {
      this.callback(data)
    } catch (error) {
      console.error(`ConfigObserver ${this.id} callback error:`, error)
    }
  }

  /**
   * オブザーバーIDを取得
   */
  getId(): string {
    return this.id
  }

  /**
   * オブザーバーがアクティブかどうか
   */
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

  /**
   * 監視対象のキーを追加
   */
  addWatchedKey(key: string): void {
    if (!this.watchedKeys) {
      this.watchedKeys = new Set()
    }
    this.watchedKeys.add(key)
  }

  /**
   * 監視対象のキーを削除
   */
  removeWatchedKey(key: string): void {
    if (this.watchedKeys) {
      this.watchedKeys.delete(key)
    }
  }

  /**
   * 監視対象のキー一覧を取得
   */
  getWatchedKeys(): string[] {
    return this.watchedKeys ? Array.from(this.watchedKeys) : []
  }

  /**
   * 全てのキーを監視するように設定
   */
  watchAllKeys(): void {
    this.watchedKeys = null
  }

  /**
   * 指定したキーを監視しているかチェック
   */
  isWatchingKey(key: string): boolean {
    return this.watchedKeys ? this.watchedKeys.has(key) : true
  }
}

/**
 * テーマ変更専用のConfigObserver
 */
export class ThemeConfigObserver extends ConfigObserver {
  constructor(callback: (newTheme: 'light' | 'dark') => void, id?: string) {
    super(
      (data) => {
        if (data.key === 'theme') {
          callback(data.newValue as 'light' | 'dark')
        }
      },
      { 
        id: id || 'theme-observer',
        watchedKeys: ['theme'] 
      }
    )
  }
}

/**
 * フォントサイズ変更専用のConfigObserver
 */
export class FontSizeConfigObserver extends ConfigObserver {
  constructor(callback: (newFontSize: number) => void, id?: string) {
    super(
      (data) => {
        if (data.key === 'fontSize') {
          callback(data.newValue as number)
        }
      },
      { 
        id: id || 'font-size-observer',
        watchedKeys: ['fontSize'] 
      }
    )
  }
}

/**
 * 行番号表示変更専用のConfigObserver
 */
export class LineNumberConfigObserver extends ConfigObserver {
  constructor(callback: (showLineNumbers: boolean) => void, id?: string) {
    super(
      (data) => {
        if (data.key === 'showLineNumbers') {
          callback(data.newValue as boolean)
        }
      },
      { 
        id: id || 'line-number-observer',
        watchedKeys: ['showLineNumbers'] 
      }
    )
  }
}

/**
 * 複数の設定変更を監視するComposite Observer
 */
export class CompositeConfigObserver implements IObserver<EditorConfigChangeData> {
  private readonly id: string
  private readonly observers: Map<string, ConfigObserver> = new Map()
  private active: boolean = true

  constructor(id?: string) {
    this.id = id || `composite-config-observer-${Date.now()}`
  }

  /**
   * 子Observerを追加
   */
  addObserver(key: string, observer: ConfigObserver): void {
    this.observers.set(key, observer)
  }

  /**
   * 子Observerを削除
   */
  removeObserver(key: string): void {
    this.observers.delete(key)
  }

  /**
   * 設定変更の通知を受け取り、適切な子Observerに委譲
   */
  update(data: EditorConfigChangeData): void {
    if (!this.active) {
      return
    }

    // 全ての子Observerに通知
    for (const observer of this.observers.values()) {
      if (observer.isActive() && observer.isWatchingKey(data.key)) {
        observer.update(data)
      }
    }
  }

  getId(): string {
    return this.id
  }

  isActive(): boolean {
    return this.active
  }

  /**
   * 全ての子Observerを無効化
   */
  deactivate(): void {
    this.active = false
    for (const observer of this.observers.values()) {
      observer.deactivate()
    }
  }

  /**
   * 全ての子Observerを有効化
   */
  activate(): void {
    this.active = true
    for (const observer of this.observers.values()) {
      observer.activate()
    }
  }

  /**
   * 登録されている子Observer数を取得
   */
  getObserverCount(): number {
    return this.observers.size
  }

  /**
   * 子Observerの一覧を取得
   */
  getObserverKeys(): string[] {
    return Array.from(this.observers.keys())
  }
}

/**
 * ConfigObserverのファクトリークラス
 */
export class ConfigObserverFactory {
  /**
   * 基本的なConfigObserverを作成
   */
  static createBasicObserver(
    callback: (data: EditorConfigChangeData) => void,
    options: { id?: string; watchedKeys?: string[] } = {}
  ): ConfigObserver {
    return new ConfigObserver(callback, options)
  }

  /**
   * テーマ変更用Observerを作成
   */
  static createThemeObserver(
    callback: (newTheme: 'light' | 'dark') => void,
    id?: string
  ): ThemeConfigObserver {
    return new ThemeConfigObserver(callback, id)
  }

  /**
   * フォントサイズ変更用Observerを作成
   */
  static createFontSizeObserver(
    callback: (newFontSize: number) => void,
    id?: string
  ): FontSizeConfigObserver {
    return new FontSizeConfigObserver(callback, id)
  }

  /**
   * 行番号表示変更用Observerを作成
   */
  static createLineNumberObserver(
    callback: (showLineNumbers: boolean) => void,
    id?: string
  ): LineNumberConfigObserver {
    return new LineNumberConfigObserver(callback, id)
  }

  /**
   * Composite Observerを作成
   */
  static createCompositeObserver(id?: string): CompositeConfigObserver {
    return new CompositeConfigObserver(id)
  }

  /**
   * UI更新用の汎用Observerを作成
   */
  static createUIUpdateObserver(
    updateFunction: (key: string, newValue: any, oldValue: any) => void,
    id?: string
  ): ConfigObserver {
    return new ConfigObserver(
      (data) => {
        updateFunction(data.key, data.newValue, data.oldValue)
      },
      { id: id || 'ui-update-observer' }
    )
  }
}

/**
 * よく使用されるConfigObserverの定義済みセット
 */
export const PredefinedConfigObservers = {
  /**
   * ダークモード切り替え用Observer
   */
  createDarkModeToggle: (
    toggleFunction: (isDark: boolean) => void
  ) => ConfigObserverFactory.createThemeObserver(
    (theme) => toggleFunction(theme === 'dark'),
    'dark-mode-toggle'
  ),

  /**
   * アクセシビリティ対応フォントサイズObserver
   */
  createAccessibilityFontSize: (
    updateFunction: (fontSize: number) => void
  ) => ConfigObserverFactory.createFontSizeObserver(
    updateFunction,
    'accessibility-font-size'
  ),

  /**
   * エディタレイアウト用Observer（行番号表示）
   */
  createLayoutObserver: (
    layoutFunction: (showLineNumbers: boolean) => void
  ) => ConfigObserverFactory.createLineNumberObserver(
    layoutFunction,
    'layout-observer'
  )
}