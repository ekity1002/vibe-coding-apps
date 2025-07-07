import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Textarea } from '../components/ui/textarea'
import { EditorConfig, type EditorSettings } from '../config/EditorConfig'
import { cn } from '../utils/cn'

/**
 * TextAreaコンポーネントのプロパティ
 */
interface TextAreaProps {
  /** テキストの値 */
  value?: string
  /** テキスト変更時のコールバック */
  onChange?: (value: string) => void
  /** プレースホルダーテキスト */
  placeholder?: string
  /** 追加のCSSクラス */
  className?: string
}

/**
 * エディタ設定を考慮したテキストエリアコンポーネント
 * 
 * Features:
 * - EditorConfigのSingleton設定を自動反映
 * - フォントサイズとテーマの動的変更対応
 * - パフォーマンス最適化（React.memo、useCallback）
 */
export const TextArea: React.FC<TextAreaProps> = React.memo(({
  value = '',
  onChange,
  placeholder = 'Enter your text here...',
  className,
}) => {
  const [text, setText] = useState(value)
  const [config, setConfig] = useState<EditorSettings>(
    () => EditorConfig.getInstance().getSettings()
  )

  // Controlled componentの値を同期
  useEffect(() => {
    setText(value)
  }, [value])

  // EditorConfig設定を監視（将来的にObserverパターンで実装）
  useEffect(() => {
    const editorConfig = EditorConfig.getInstance()
    setConfig(editorConfig.getSettings())
  }, [])

  // テキスト変更ハンドラ（最適化）
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setText(newValue)
    onChange?.(newValue)
  }, [onChange])

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
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
        className={textareaClassName}
        aria-label="Text editor input area"
      />
    </div>
  )
})

// デバッグ用の表示名
TextArea.displayName = 'TextArea'