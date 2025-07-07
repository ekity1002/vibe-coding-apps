# Phase 1: 基本エディタ + Singleton Pattern - TDD実装手順

## 目標
- 基本的なテキスト編集機能の実装
- Singletonパターンの理解と実装
- TDDアプローチでの開発体験
- Tailwind CSS + shadcn/uiでのUI実装

## 学習内容
- Singletonパターンの概念と実装
- グローバル状態管理の重要性
- テスト駆動開発のサイクル
- モダンUIライブラリの活用

---

## Task 1: Singletonパターンの理解と設計

### 1.1 Singletonパターンの学習
- [ ] Singletonパターンの概念を調べる
- [ ] TypeScriptでのSingleton実装パターンを理解
- [ ] エディタ設定でSingletonが適切な理由を考える

### 1.2 EditorConfig設計
- [ ] エディタ設定として管理すべき項目を定義
  - フォントサイズ（12px, 14px, 16px, 18px）
  - テーマ（light, dark）
  - 行番号表示設定（boolean）
  - 自動保存設定（boolean）
  - エディタの幅・高さ設定

---

## Task 2: EditorConfig Singletonの実装

### 2.1 テスト作成（Red）
**ファイル**: `tests/config/EditorConfig.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { EditorConfig } from '../../src/config/EditorConfig'

describe('EditorConfig Singleton', () => {
  beforeEach(() => {
    // Singletonインスタンスをリセット（テスト用）
    EditorConfig.resetInstance()
  })

  it('should create only one instance', () => {
    const instance1 = EditorConfig.getInstance()
    const instance2 = EditorConfig.getInstance()
    expect(instance1).toBe(instance2)
  })

  it('should have default settings', () => {
    const config = EditorConfig.getInstance()
    expect(config.getFontSize()).toBe(14)
    expect(config.getTheme()).toBe('light')
    expect(config.getShowLineNumbers()).toBe(true)
    expect(config.getAutoSave()).toBe(false)
  })

  it('should update settings correctly', () => {
    const config = EditorConfig.getInstance()
    config.setFontSize(16)
    config.setTheme('dark')
    
    expect(config.getFontSize()).toBe(16)
    expect(config.getTheme()).toBe('dark')
  })
})
```

### 2.2 最小実装（Green）
**ファイル**: `src/config/EditorConfig.ts`

```typescript
export type Theme = 'light' | 'dark'
export type FontSize = 12 | 14 | 16 | 18

export interface EditorSettings {
  fontSize: FontSize
  theme: Theme
  showLineNumbers: boolean
  autoSave: boolean
}

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
```

### 2.3 リファクタリング（Refactor）
- [ ] TypeScriptの型定義を追加
- [ ] 設定値のバリデーション機能
- [ ] LocalStorageとの連携機能
- [ ] 設定変更のイベント通知機能

---

## Task 3: UI Components（shadcn/ui）の準備

### 3.1 必要なshadcn/uiコンポーネントの追加
**インストールコマンド（手動で実行）**:
```bash
npx shadcn@latest add textarea
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add switch
npx shadcn@latest add select
```

### 3.2 テスト作成（Red）
**ファイル**: `tests/components/ui/Textarea.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Textarea } from '../../../src/components/ui/textarea'

describe('Textarea Component', () => {
  it('should render textarea element', () => {
    render(<Textarea placeholder="Enter text..." />)
    expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument()
  })

  it('should handle text input', async () => {
    const user = userEvent.setup()
    render(<Textarea placeholder="Enter text..." />)
    
    const textarea = screen.getByPlaceholderText('Enter text...')
    await user.type(textarea, 'Hello World')
    
    expect(textarea).toHaveValue('Hello World')
  })
})
```

---

## Task 4: TextAreaコンポーネントの実装

### 4.1 テスト作成（Red）
**ファイル**: `tests/editor/TextArea.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TextArea } from '../../src/editor/TextArea'

describe('TextArea Component', () => {
  it('should render with default props', () => {
    render(<TextArea />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should handle text changes', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    
    render(<TextArea onChange={handleChange} />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Hello')
    
    expect(handleChange).toHaveBeenCalled()
  })

  it('should apply EditorConfig settings', () => {
    render(<TextArea />)
    const textarea = screen.getByRole('textbox')
    
    // フォントサイズとテーマが適用されているかを確認
    expect(textarea).toHaveClass('text-sm') // 14px相当
  })
})
```

### 4.2 最小実装（Green）
**ファイル**: `src/editor/TextArea.tsx`

```typescript
import React, { useEffect, useState } from 'react'
import { Textarea } from './ui/textarea'
import { EditorConfig } from '../patterns/singleton/EditorConfig'
import { cn } from '../utils/cn'

interface TextAreaProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
}

export const TextArea: React.FC<TextAreaProps> = ({
  value = '',
  onChange,
  placeholder = 'Enter your text here...',
  className,
}) => {
  const [text, setText] = useState(value)
  const [config, setConfig] = useState(EditorConfig.getInstance().getSettings())

  useEffect(() => {
    // EditorConfig設定を監視（将来的にObserverパターンで実装）
    const editorConfig = EditorConfig.getInstance()
    setConfig(editorConfig.getSettings())
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setText(newValue)
    onChange?.(newValue)
  }

  const getFontSizeClass = () => {
    switch (config.fontSize) {
      case 12:
        return 'text-xs'
      case 14:
        return 'text-sm'
      case 16:
        return 'text-base'
      case 18:
        return 'text-lg'
      default:
        return 'text-sm'
    }
  }

  return (
    <div className={cn('w-full h-full', className)}>
      <Textarea
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          'w-full h-full resize-none border-0 focus-visible:ring-0 p-4',
          getFontSizeClass(),
          config.theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-black'
        )}
      />
    </div>
  )
}
```

### 4.3 リファクタリング（Refactor）
- [ ] プロパティの型定義を強化
- [ ] パフォーマンスの最適化（React.memo）
- [ ] アクセシビリティの向上
- [ ] 行番号表示機能の追加

---

## Task 5: Editorコンポーネントの実装

### 5.1 テスト作成（Red）
**ファイル**: `tests/editor/Editor.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Editor } from '../../src/editor/Editor'
import { EditorConfig } from '../../src/patterns/singleton/EditorConfig'

describe('Editor Component', () => {
  beforeEach(() => {
    EditorConfig.resetInstance()
  })

  it('should render editor with TextArea', () => {
    render(<Editor />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should use EditorConfig singleton', () => {
    render(<Editor />)
    const config = EditorConfig.getInstance()
    expect(config).toBeDefined()
  })

  it('should display line numbers when enabled', () => {
    const config = EditorConfig.getInstance()
    config.setShowLineNumbers(true)
    
    render(<Editor />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})
```

### 5.2 最小実装（Green）
**ファイル**: `src/editor/Editor.tsx`

```typescript
import React, { useState, useEffect } from 'react'
import { Card } from './ui/card'
import { TextArea } from './TextArea'
import { EditorConfig } from '../patterns/singleton/EditorConfig'
import { cn } from '../utils/cn'

interface EditorProps {
  initialValue?: string
  onTextChange?: (text: string) => void
  className?: string
}

export const Editor: React.FC<EditorProps> = ({
  initialValue = '',
  onTextChange,
  className,
}) => {
  const [text, setText] = useState(initialValue)
  const [config, setConfig] = useState(EditorConfig.getInstance().getSettings())

  useEffect(() => {
    // EditorConfig設定を監視
    const editorConfig = EditorConfig.getInstance()
    setConfig(editorConfig.getSettings())
  }, [])

  const handleTextChange = (newText: string) => {
    setText(newText)
    onTextChange?.(newText)
  }

  const getLineNumbers = () => {
    if (!config.showLineNumbers) return null
    
    const lines = text.split('\n')
    return (
      <div className="flex flex-col text-gray-500 text-sm min-w-12 px-2 py-4 border-r">
        {lines.map((_, index) => (
          <div key={index + 1} className="leading-6">
            {index + 1}
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card 
      className={cn(
        'w-full h-96 overflow-hidden flex',
        config.theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white',
        className
      )}
    >
      {getLineNumbers()}
      <div className="flex-1">
        <TextArea
          value={text}
          onChange={handleTextChange}
          className="h-full"
        />
      </div>
    </Card>
  )
}
```

### 5.3 リファクタリング（Refactor）
- [ ] コンポーネントの責務を明確化
- [ ] 再利用性の向上
- [ ] エラーハンドリングの追加
- [ ] 設定変更のリアルタイム反映

---

## Task 6: TextServiceの実装

### 6.1 テスト作成（Red）
**ファイル**: `tests/services/TextService.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { TextService } from '../../src/services/TextService'

describe('TextService', () => {
  it('should count characters correctly', () => {
    expect(TextService.getCharacterCount('Hello World')).toBe(11)
    expect(TextService.getCharacterCount('')).toBe(0)
  })

  it('should count lines correctly', () => {
    expect(TextService.getLineCount('Hello\nWorld')).toBe(2)
    expect(TextService.getLineCount('Single line')).toBe(1)
    expect(TextService.getLineCount('')).toBe(1)
  })

  it('should count words correctly', () => {
    expect(TextService.getWordCount('Hello World')).toBe(2)
    expect(TextService.getWordCount('  Hello   World  ')).toBe(2)
    expect(TextService.getWordCount('')).toBe(0)
  })

  it('should validate text correctly', () => {
    expect(TextService.isValidText('Valid text')).toBe(true)
    expect(TextService.isValidText('')).toBe(true)
    expect(TextService.isValidText(null as any)).toBe(false)
  })
})
```

### 6.2 最小実装（Green）
**ファイル**: `src/services/TextService.ts`

```typescript
export class TextService {
  /**
   * テキストの文字数をカウント
   */
  public static getCharacterCount(text: string): number {
    return text.length
  }

  /**
   * テキストの行数をカウント
   */
  public static getLineCount(text: string): number {
    if (text === '') return 1
    return text.split('\n').length
  }

  /**
   * テキストの単語数をカウント
   */
  public static getWordCount(text: string): number {
    if (text.trim() === '') return 0
    return text.trim().split(/\s+/).length
  }

  /**
   * テキストの妥当性を検証
   */
  public static isValidText(text: any): text is string {
    return typeof text === 'string'
  }

  /**
   * テキストをサニタイズ
   */
  public static sanitizeText(text: string): string {
    if (!this.isValidText(text)) return ''
    return text.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
  }

  /**
   * テキストを指定した長さで切り詰め
   */
  public static truncateText(text: string, maxLength: number): string {
    if (!this.isValidText(text)) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }
}
```

### 6.3 リファクタリング（Refactor）
- [ ] パフォーマンスの最適化
- [ ] エラーハンドリングの充実
- [ ] 国際化対応
- [ ] より高度なテキスト操作機能の追加

---

## Task 7: 統合とApp.tsxの更新

### 7.1 テスト作成（Red）
**ファイル**: `tests/App.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../src/App'

describe('App Component', () => {
  it('should render the main application', () => {
    render(<App />)
    expect(screen.getByText('Text Editor with Design Patterns')).toBeInTheDocument()
  })

  it('should render Editor component', () => {
    render(<App />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should have proper layout', () => {
    render(<App />)
    const main = screen.getByRole('main')
    expect(main).toHaveClass('container', 'mx-auto', 'py-8')
  })
})
```

### 7.2 最小実装（Green）
**ファイル**: `src/App.tsx`

```typescript
import React from 'react'
import { Editor } from './components/Editor'
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card'
import { EditorConfig } from './patterns/singleton/EditorConfig'

function App() {
  const config = EditorConfig.getInstance()
  
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Text Editor with Design Patterns
            </CardTitle>
            <p className="text-muted-foreground text-center">
              Phase 1: Basic Editor + Singleton Pattern
            </p>
          </CardHeader>
        </Card>
        
        <div className="grid gap-6">
          <Editor
            onTextChange={(text) => console.log('Text changed:', text)}
          />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Editor Settings (Singleton)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Font Size: {config.getFontSize()}px</div>
                <div>Theme: {config.getTheme()}</div>
                <div>Line Numbers: {config.getShowLineNumbers() ? 'On' : 'Off'}</div>
                <div>Auto Save: {config.getAutoSave() ? 'On' : 'Off'}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default App
```

### 7.3 リファクタリング（Refactor）
- [ ] レイアウトの改善
- [ ] 不要なコードの削除
- [ ] パフォーマンスの確認
- [ ] レスポンシブ対応の強化

---

## Task 8: E2Eテストと最終調整

### 8.1 E2Eテストの作成
**ファイル**: `tests/e2e/basic-editor.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'

describe('Basic Editor E2E', () => {
  it('should provide complete text editing experience', async () => {
    const user = userEvent.setup()
    render(<App />)

    // エディタが表示されている
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()

    // テキスト入力ができる
    await user.type(textarea, 'Hello World!\nSecond line')
    expect(textarea).toHaveValue('Hello World!\nSecond line')

    // 行番号が表示されている
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()

    // Singleton設定が表示されている
    expect(screen.getByText('Font Size: 14px')).toBeInTheDocument()
    expect(screen.getByText('Theme: light')).toBeInTheDocument()
  })
})
```

---

## 完成チェックリスト

### 機能要件
- [ ] テキストの入力・表示ができる
- [ ] EditorConfigがSingletonパターンで実装されている
- [ ] 行番号が表示される
- [ ] フォントサイズとテーマ設定が反映される
- [ ] shadcn/uiコンポーネントが正しく動作する
- [ ] すべてのテストが通る

### 品質要件
- [ ] テストカバレッジが80%以上
- [ ] TypeScriptの型エラーがない
- [ ] ESLintのエラーがない
- [ ] Tailwind CSSが正しく適用されている
- [ ] レスポンシブデザインに対応

### 学習目標
- [ ] Singletonパターンの概念を理解している
- [ ] TDDのサイクルを体験している
- [ ] Tailwind CSS + shadcn/uiの使い方を理解している
- [ ] TypeScriptでのデザインパターン実装を理解している

---

## 実行コマンド

```bash
# shadcn/uiコンポーネント追加（必要に応じて）
npx shadcn@latest add textarea
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add switch
npx shadcn@latest add select

# テスト実行
npm run test

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# リント
npm run lint
```

---

## 次のPhase準備

Phase 1完了後、以下を確認：
- [ ] Singletonパターンの理解度
- [ ] TDDアプローチの習得度
- [ ] Tailwind CSS + shadcn/uiの使用感
- [ ] 次のPhase（Command Pattern）への準備

Phase 2では、アンドゥ・リドゥ機能の実装を通じてCommandパターンを学習します。