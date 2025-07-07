/**
 * エディタ設定管理
 * 
 * Design Pattern: Singleton Pattern
 * - アプリケーション全体で一つのインスタンスのみ存在
 * - グローバル設定の一貫性を保証
 * - メモリ効率とアクセスの簡便性を提供
 */

export type Theme = 'light' | 'dark'
export type FontSize = 12 | 14 | 16 | 18

export interface EditorSettings {
  fontSize: FontSize
  theme: Theme
  showLineNumbers: boolean
  autoSave: boolean
}

/**
 * エディタ設定を管理するSingletonクラス
 * 
 * このクラスはSingletonパターンを実装し、
 * アプリケーション全体で一貫したエディタ設定を提供します。
 */
export class EditorConfig {
  private static instance: EditorConfig
  private settings: EditorSettings

  private constructor() {
    this.settings = {
      fontSize: 14,
      theme: 'light',
      showLineNumbers: true,
      autoSave: false,
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
    EditorConfig.instance = null as any
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

  // Setter methods
  public setFontSize(size: FontSize): void {
    this.settings.fontSize = size
  }

  public setTheme(theme: Theme): void {
    this.settings.theme = theme
  }

  public setShowLineNumbers(show: boolean): void {
    this.settings.showLineNumbers = show
  }

  public setAutoSave(autoSave: boolean): void {
    this.settings.autoSave = autoSave
  }
}