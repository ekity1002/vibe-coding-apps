/**
 * エディタ設定管理
 *
 * Design Patterns:
 * - Singleton Pattern: アプリケーション全体で一つのインスタンスのみ存在
 * - Observer Pattern: 設定変更時の通知機能
 * - グローバル設定の一貫性を保証
 * - メモリ効率とアクセスの簡便性を提供
 */

import type { EditorConfigChangeData, IObserver, ISubject } from '../../observer/types/ObserverTypes'

export type Theme = 'light' | 'dark'
export type FontSize = 12 | 14 | 16 | 18

export interface EditorSettings {
  fontSize: FontSize
  theme: Theme
  showLineNumbers: boolean
  autoSave: boolean
  tabSize: number
  wordWrap: boolean
}

/**
 * エディタ設定を管理するSingletonクラス
 *
 * このクラスはSingleton + Observer パターンを実装し、
 * アプリケーション全体で一貫したエディタ設定を提供し、
 * 設定変更時にObserverに通知します。
 */
export class EditorConfig implements ISubject<EditorConfigChangeData> {
  private static instance: EditorConfig
  private settings: EditorSettings
  private observers: Map<string, IObserver<EditorConfigChangeData>> = new Map()

  private constructor() {
    this.settings = {
      fontSize: 14,
      theme: 'light',
      showLineNumbers: true,
      autoSave: false,
      tabSize: 2,
      wordWrap: true
    }
  }

  public static getInstance(): EditorConfig {
    if (!EditorConfig.instance) {
      EditorConfig.instance = new EditorConfig()
    }
    return EditorConfig.instance
  }

  // テスト用のリセットメソッド
  public static resetInstance(): void {
    // テスト用のインスタンスリセット
    if (EditorConfig.instance) {
      EditorConfig.instance.observers.clear()
    }
    EditorConfig.instance = null as EditorConfig | null
  }

  // Getter methods
  public getFontSize(): FontSize {
    return this.settings.fontSize
  }

  public getTheme(): Theme {
    return this.settings.theme
  }

  public getShowLineNumbers(): boolean {
    return this.settings.showLineNumbers
  }

  public getAutoSave(): boolean {
    return this.settings.autoSave
  }

  public getSettings(): EditorSettings {
    return { ...this.settings }
  }

  public getTabSize(): number {
    return this.settings.tabSize
  }

  public getWordWrap(): boolean {
    return this.settings.wordWrap
  }

  // Observer Pattern メソッド
  public attach(observer: IObserver<EditorConfigChangeData>): void {
    this.observers.set(observer.getId(), observer)
  }

  public detach(observer: IObserver<EditorConfigChangeData>): void {
    this.observers.delete(observer.getId())
  }

  public detachById(id: string): void {
    this.observers.delete(id)
  }

  public notify(data: EditorConfigChangeData): void {
    for (const observer of this.observers.values()) {
      try {
        if (!observer.isActive || observer.isActive()) {
          observer.update(data)
        }
      } catch (error) {
        console.error(`Error notifying observer ${observer.getId()}:`, error)
      }
    }
  }

  public getObserverCount(): number {
    return this.observers.size
  }

  // 設定変更の通知を伴うSetter methods
  public setFontSize(size: FontSize): void {
    const oldValue = this.settings.fontSize
    if (oldValue !== size) {
      this.settings.fontSize = size
      this.notifyChange('fontSize', oldValue, size)
    }
  }

  public setTheme(theme: Theme): void {
    const oldValue = this.settings.theme
    if (oldValue !== theme) {
      this.settings.theme = theme
      this.notifyChange('theme', oldValue, theme)
    }
  }

  public setShowLineNumbers(show: boolean): void {
    const oldValue = this.settings.showLineNumbers
    if (oldValue !== show) {
      this.settings.showLineNumbers = show
      this.notifyChange('showLineNumbers', oldValue, show)
    }
  }

  public setAutoSave(autoSave: boolean): void {
    const oldValue = this.settings.autoSave
    if (oldValue !== autoSave) {
      this.settings.autoSave = autoSave
      this.notifyChange('autoSave', oldValue, autoSave)
    }
  }

  public setTabSize(tabSize: number): void {
    const oldValue = this.settings.tabSize
    if (oldValue !== tabSize) {
      this.settings.tabSize = tabSize
      this.notifyChange('tabSize', oldValue, tabSize)
    }
  }

  public setWordWrap(wordWrap: boolean): void {
    const oldValue = this.settings.wordWrap
    if (oldValue !== wordWrap) {
      this.settings.wordWrap = wordWrap
      this.notifyChange('wordWrap', oldValue, wordWrap)
    }
  }

  // 複数設定の一括変更
  public updateSettings(newSettings: Partial<EditorSettings>): void {
    const changes: Array<{key: keyof EditorSettings, oldValue: any, newValue: any}> = []

    // 変更を検出
    for (const [key, newValue] of Object.entries(newSettings) as Array<[keyof EditorSettings, any]>) {
      const oldValue = this.settings[key]
      if (oldValue !== newValue) {
        changes.push({ key, oldValue, newValue })
        // @ts-ignore - 動的なプロパティアクセス
        this.settings[key] = newValue
      }
    }

    // 変更を通知
    for (const change of changes) {
      this.notifyChange(change.key, change.oldValue, change.newValue)
    }
  }

  // Observer パターンのヘルパーメソッド
  private notifyChange(key: keyof EditorSettings, oldValue: any, newValue: any): void {
    const changeData: EditorConfigChangeData = {
      key,
      oldValue,
      newValue,
      timestamp: Date.now(),
      source: 'EditorConfig'
    }

    this.notify(changeData)
  }

  // デバッグ用メソッド
  public getObserverIds(): string[] {
    return Array.from(this.observers.keys())
  }

  public hasObserver(id: string): boolean {
    return this.observers.has(id)
  }

  // 設定のリセット
  public resetToDefaults(): void {
    const oldSettings = { ...this.settings }
    const defaultSettings: EditorSettings = {
      fontSize: 14,
      theme: 'light',
      showLineNumbers: true,
      autoSave: false,
      tabSize: 2,
      wordWrap: true
    }

    this.updateSettings(defaultSettings)
  }

  // 設定の検証
  public validateSettings(settings: Partial<EditorSettings>): boolean {
    try {
      if (settings.fontSize && ![12, 14, 16, 18].includes(settings.fontSize)) {
        return false
      }
      if (settings.theme && !['light', 'dark'].includes(settings.theme)) {
        return false
      }
      if (settings.tabSize && (settings.tabSize < 1 || settings.tabSize > 8)) {
        return false
      }
      return true
    } catch {
      return false
    }
  }
}
