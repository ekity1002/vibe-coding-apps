# EditorConfig設計ドキュメント

## 概要

テキストエディタの設定管理をSingletonパターンで実装するための設計ドキュメントです。

## 設定項目の調査結果

### 一般的なエディタ設定項目

1. **表示設定**
   - フォントサイズ、フォントファミリー
   - テーマ（ライト/ダーク）
   - 行番号表示、行の折り返し

2. **編集設定**
   - 自動保存、タブサイズ
   - インデントタイプ、自動インデント

3. **UI設定**
   - エディタサイズ、ステータスバー表示
   - ツールバー表示

4. **動作設定**
   - 自動補完、構文ハイライト
   - 検索設定

## Phase1での実装範囲

### 基本型定義

```typescript
// 基本型定義
export type Theme = 'light' | 'dark'
export type FontSize = 12 | 14 | 16 | 18
export type TabSize = 2 | 4 | 8
export type IndentType = 'spaces' | 'tabs'

// Phase1用の基本設定インターフェース
export interface EditorSettings {
  // 表示設定
  fontSize: FontSize
  theme: Theme
  showLineNumbers: boolean
  wordWrap: boolean
  
  // 編集設定
  autoSave: boolean
  tabSize: TabSize
  indentType: IndentType
  autoIndent: boolean
  
  // UI設定
  showStatusBar: boolean
  editorWidth: string
  editorHeight: string
}
```

### デフォルト設定

```typescript
export const DEFAULT_SETTINGS: EditorSettings = {
  // 表示設定
  fontSize: 14,           // 読みやすい標準サイズ
  theme: 'light',         // デフォルトはライトテーマ
  showLineNumbers: true,  // コーディングに有用
  wordWrap: false,        // 長い行の表示制御
  
  // 編集設定
  autoSave: false,        // ユーザーの意図しない保存を防ぐ
  tabSize: 4,             // 一般的なタブサイズ
  indentType: 'spaces',   // 一貫性のあるインデント
  autoIndent: true,       // 作業効率の向上
  
  // UI設定
  showStatusBar: true,    // 情報表示のため
  editorWidth: '100%',    // レスポンシブ対応
  editorHeight: '400px'   // 適切な初期サイズ
}
```

## 拡張性を考慮した設計

### 1. 階層化された設定構造（将来対応）

```typescript
export interface ExtendedEditorConfig {
  display: {
    fontSize: FontSize
    theme: Theme
    showLineNumbers: boolean
    wordWrap: boolean
    fontFamily: string
  }
  editing: {
    autoSave: boolean
    tabSize: TabSize
    indentType: IndentType
    autoIndent: boolean
    autoComplete: boolean
  }
  ui: {
    showStatusBar: boolean
    showToolbar: boolean
    editorWidth: string
    editorHeight: string
  }
  behavior: {
    syntaxHighlight: boolean
    caseSensitiveSearch: boolean
    autoCloseBrackets: boolean
  }
}
```

### 2. バリデーション機能

```typescript
export interface ConfigValidator {
  validateFontSize(size: number): boolean
  validateTheme(theme: string): boolean
  validateTabSize(size: number): boolean
  sanitizeSettings(settings: Partial<EditorSettings>): EditorSettings
}

export class EditorConfigValidator implements ConfigValidator {
  validateFontSize(size: number): boolean {
    return [12, 14, 16, 18].includes(size)
  }
  
  validateTheme(theme: string): boolean {
    return ['light', 'dark'].includes(theme)
  }
  
  validateTabSize(size: number): boolean {
    return [2, 4, 8].includes(size)
  }
  
  sanitizeSettings(settings: Partial<EditorSettings>): EditorSettings {
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      fontSize: this.validateFontSize(settings.fontSize || 14) 
        ? settings.fontSize as FontSize 
        : 14,
      theme: this.validateTheme(settings.theme || 'light') 
        ? settings.theme as Theme 
        : 'light'
    }
  }
}
```

### 3. 設定の永続化（LocalStorage連携）

```typescript
export interface ConfigPersistence {
  save(settings: EditorSettings): void
  load(): EditorSettings | null
  reset(): void
  isSupported(): boolean
}

export class LocalStorageConfigPersistence implements ConfigPersistence {
  private readonly STORAGE_KEY = 'editor-config'
  
  save(settings: EditorSettings): void {
    if (this.isSupported()) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings))
    }
  }
  
  load(): EditorSettings | null {
    if (this.isSupported()) {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    }
    return null
  }
  
  reset(): void {
    if (this.isSupported()) {
      localStorage.removeItem(this.STORAGE_KEY)
    }
  }
  
  isSupported(): boolean {
    return typeof Storage !== 'undefined'
  }
}
```

### 4. 設定変更の通知（Observer準備）

```typescript
// Phase4のObserverパターンで使用予定
export interface ConfigObserver {
  onSettingChanged(key: keyof EditorSettings, oldValue: any, newValue: any): void
}

export interface ConfigSubject {
  addObserver(observer: ConfigObserver): void
  removeObserver(observer: ConfigObserver): void
  notifyObservers(key: keyof EditorSettings, oldValue: any, newValue: any): void
}
```

## EditorConfigクラスの基本設計

```typescript
export class EditorConfig {
  private static instance: EditorConfig
  private settings: EditorSettings
  private validator: ConfigValidator
  private persistence: ConfigPersistence
  
  private constructor() {
    this.validator = new EditorConfigValidator()
    this.persistence = new LocalStorageConfigPersistence()
    this.settings = this.loadSettings()
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
  
  private loadSettings(): EditorSettings {
    const saved = this.persistence.load()
    return saved ? this.validator.sanitizeSettings(saved) : DEFAULT_SETTINGS
  }
  
  // Getter/Setterメソッド群
  // ... (各設定項目のアクセサメソッド)
}
```

## Phase別の実装計画

### Phase1（現在）
- 基本的なSingleton実装
- 主要設定項目（フォントサイズ、テーマ、行番号、自動保存）
- 基本的なGetter/Setterメソッド

### Phase2以降
- LocalStorage連携
- バリデーション機能の強化
- 設定変更の通知機能（Observer連携）
- 設定UIコンポーネントの実装

## 実装上の注意点

1. **型安全性**: TypeScriptの型システムを最大限活用
2. **テスト容易性**: リセットメソッドと依存注入の考慮
3. **パフォーマンス**: 設定の頻繁な変更に対する最適化
4. **後方互換性**: 設定形式の変更に対する対応策

## 期待される効果

1. **一貫性**: アプリケーション全体で統一された設定管理
2. **効率性**: 設定データの重複排除とメモリ効率
3. **拡張性**: 新しい設定項目の追加が容易
4. **保守性**: 設定関連のロジックの集約化