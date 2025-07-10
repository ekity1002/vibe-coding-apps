import React, { useEffect, useRef, useCallback, useMemo } from 'react'
import { Textarea } from '../components/ui/textarea'
import { EditorConfig, type EditorSettings } from '../config/EditorConfig'
import { useCommandHistory, UseCommandHistoryReturn } from '../hooks/useCommandHistory'
import { cn } from '../utils/cn'

/**
 * Command対応TextAreaコンポーネントのプロパティ
 */
interface CommandTextAreaProps {
  /** 初期値 */
  initialValue?: string
  /** テキスト変更時のコールバック */
  onChange?: (value: string) => void
  /** プレースホルダーテキスト */
  placeholder?: string
  /** 追加のCSSクラス */
  className?: string
  /** Command履歴の設定 */
  commandConfig?: {
    maxHistorySize?: number
    enableAutoSave?: boolean
  }
}

/**
 * Command Pattern対応のテキストエリアコンポーネント
 * 
 * Features:
 * - Command Patternによるアンドゥ・リドゥ機能
 * - キーボードショートカット（Ctrl+Z, Ctrl+Y）
 * - EditorConfigのSingleton設定を自動反映
 * - パフォーマンス最適化
 * 
 * Design Patterns:
 * - Command Pattern: テキスト操作のオブジェクト化
 * - Observer Pattern: テキスト変更の監視
 * - Singleton Pattern: EditorConfigとの統合
 */
export const CommandTextArea: React.FC<CommandTextAreaProps> = React.memo(({
  initialValue = '',
  onChange,
  placeholder = 'Enter your text here...',
  className,
  commandConfig
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [config, setConfig] = React.useState<EditorSettings>(() => 
    EditorConfig.getInstance().getSettings()
  )

  // Command履歴管理フックの使用
  const commandHistory = useCommandHistory({
    initialText: initialValue,
    config: commandConfig,
    enableAutoSave: commandConfig?.enableAutoSave
  }) as UseCommandHistoryReturn & {
    _internal: {
      registerUpdateCallback: (callback: (text: string) => void) => () => void
      setupEventListeners: () => () => void
      getCurrentCursorPosition: () => number
      getCurrentSelection: () => { start: number; end: number } | null
    }
  }

  // テキスト変更の監視とコールバック実行
  useEffect(() => {
    const unregister = commandHistory._internal.registerUpdateCallback((newText: string) => {
      onChange?.(newText)
      
      // TextAreaの値を更新
      if (textareaRef.current && textareaRef.current.value !== newText) {
        textareaRef.current.value = newText
      }
    })

    return unregister
  }, [onChange, commandHistory])

  // キーボードショートカットの設定
  useEffect(() => {
    const cleanup = commandHistory._internal.setupEventListeners()
    return cleanup
  }, [commandHistory])

  // EditorConfig設定を監視
  useEffect(() => {
    const editorConfig = EditorConfig.getInstance()
    setConfig(editorConfig.getSettings())
  }, [])

  // テキスト変更ハンドラ（通常の入力用）
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const currentValue = commandHistory.text
    
    if (newValue === currentValue) return

    // カーソル位置を取得
    const cursorPosition = e.target.selectionStart || 0
    const selectionEnd = e.target.selectionEnd || cursorPosition

    // 変更の種類を判定してCommandを生成
    if (newValue.length > currentValue.length) {
      // テキスト挿入
      const insertPosition = cursorPosition - (newValue.length - currentValue.length)
      const insertedText = newValue.slice(insertPosition, cursorPosition)
      commandHistory.insertText(insertedText, insertPosition)
    } else if (newValue.length < currentValue.length) {
      // テキスト削除
      const deleteStart = cursorPosition
      const deleteEnd = deleteStart + (currentValue.length - newValue.length)
      commandHistory.deleteText(deleteStart, deleteEnd)
    } else {
      // テキスト置換（同じ長さ）
      // 簡易的な置換検出（実際にはより複雑な差分アルゴリズムが必要）
      const replaceStart = Math.min(cursorPosition, selectionEnd)
      const replaceEnd = Math.max(cursorPosition, selectionEnd)
      const newText = newValue.slice(replaceStart, replaceEnd)
      commandHistory.replaceText(newText, replaceStart, replaceEnd)
    }
  }, [commandHistory])

  // 特殊キーハンドラ（Delete, Backspace等）
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const start = textarea.selectionStart || 0
    const end = textarea.selectionEnd || start

    // Command Patternで処理する特殊キー
    if (e.key === 'Backspace' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      
      if (start === end && start > 0) {
        // 単一文字の削除
        commandHistory.deleteText(start - 1, start)
      } else if (start !== end) {
        // 選択範囲の削除
        commandHistory.deleteText(start, end)
      }
      return
    }

    if (e.key === 'Delete' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      
      if (start === end && start < commandHistory.text.length) {
        // 単一文字の削除
        commandHistory.deleteText(start, start + 1)
      } else if (start !== end) {
        // 選択範囲の削除
        commandHistory.deleteText(start, end)
      }
      return
    }

    // 通常の文字入力
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault()
      
      if (start !== end) {
        // 選択範囲を置換
        commandHistory.replaceText(e.key, start, end)
      } else {
        // カーソル位置に挿入
        commandHistory.insertText(e.key, start)
      }
      return
    }

    // Enter キーの処理
    if (e.key === 'Enter') {
      e.preventDefault()
      
      if (start !== end) {
        commandHistory.replaceText('\n', start, end)
      } else {
        commandHistory.insertText('\n', start)
      }
      return
    }

    // Tab キーの処理
    if (e.key === 'Tab') {
      e.preventDefault()
      
      if (start !== end) {
        commandHistory.replaceText('\t', start, end)
      } else {
        commandHistory.insertText('\t', start)
      }
      return
    }
  }, [commandHistory])

  // フォントサイズクラスを動的に決定（メモ化）
  const fontSizeClass = useMemo(() => {
    switch (config.fontSize) {
      case 12: return 'text-xs'
      case 14: return 'text-sm'
      case 16: return 'text-base'
      case 18: return 'text-lg'
      default: return 'text-sm'
    }
  }, [config.fontSize])

  // テーマクラスを動的に決定（メモ化）
  const themeClasses = useMemo(() => {
    return config.theme === 'dark' 
      ? 'bg-gray-900 text-white' 
      : 'bg-white text-black'
  }, [config.theme])

  // 最終的なCSSクラスを結合（メモ化）
  const textareaClassName = useMemo(() => cn(
    'w-full h-full resize-none border-0 focus-visible:ring-0 p-4',
    fontSizeClass,
    themeClasses
  ), [fontSizeClass, themeClasses])

  return (
    <div className={cn('w-full h-full', className)}>
      <Textarea
        ref={textareaRef}
        defaultValue={initialValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={textareaClassName}
        aria-label="Command-enabled text editor input area"
      />
    </div>
  )
})

// デバッグ用の表示名
CommandTextArea.displayName = 'CommandTextArea'

/**
 * Command対応TextAreaのコンテキスト情報を取得するフック
 */
export const useCommandTextAreaContext = (textAreaRef: React.RefObject<HTMLTextAreaElement>) => {
  const getCursorPosition = useCallback((): number => {
    return textAreaRef.current?.selectionStart || 0
  }, [textAreaRef])

  const getSelection = useCallback((): { start: number; end: number } => {
    const textarea = textAreaRef.current
    if (!textarea) return { start: 0, end: 0 }
    
    return {
      start: textarea.selectionStart || 0,
      end: textarea.selectionEnd || 0
    }
  }, [textAreaRef])

  const setCursorPosition = useCallback((position: number) => {
    const textarea = textAreaRef.current
    if (!textarea) return
    
    textarea.setSelectionRange(position, position)
    textarea.focus()
  }, [textAreaRef])

  const setSelection = useCallback((start: number, end: number) => {
    const textarea = textAreaRef.current
    if (!textarea) return
    
    textarea.setSelectionRange(start, end)
    textarea.focus()
  }, [textAreaRef])

  return {
    getCursorPosition,
    getSelection,
    setCursorPosition,
    setSelection
  }
}