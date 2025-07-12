import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Textarea } from '../../shared/textarea'
import { EditorConfig, type EditorSettings } from '../../../domain/config/entities/EditorConfig'
import { ConfigObserver } from '../../../domain/observer/services/ConfigObserver'
import type { EditorConfigChangeData } from '../../../domain/observer/types/ObserverTypes'
import { cn } from '../../../shared/utils/cn'

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
 * - リアルタイム設定変更対応（Observer Pattern）
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

  // Observer Pattern実装: EditorConfigの変更監視
  useEffect(() => {
    const editorConfig = EditorConfig.getInstance()
    
    // 設定変更監視用Observer
    const textAreaObserver = new ConfigObserver(
      (data: EditorConfigChangeData) => {
        // 設定変更時にconfigを更新
        setConfig(editorConfig.getSettings())
      },
      { 
        id: 'textarea-config-observer',
        watchedKeys: ['theme', 'fontSize']
      }
    )

    editorConfig.attach(textAreaObserver)

    // 初期設定も取得
    setConfig(editorConfig.getSettings())

    // クリーンアップ時にObserverを削除
    return () => {
      editorConfig.detach(textAreaObserver)
    }
  }, [])

  // テキスト変更ハンドラ（最適化）
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setText(newValue)
    onChange?.(newValue)
  }, [onChange])

  // フォントサイズスタイルを動的に決定（メモ化）
  const fontSizeStyle = useMemo(() => {
    return {
      fontSize: `${config.fontSize}px`
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
    themeClasses
  ), [themeClasses])

  return (
    <div className={cn('w-full h-full', className)}>
      <Textarea
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
        className={textareaClassName}
        style={fontSizeStyle}
        aria-label="Text editor input area"
      />
    </div>
  )
})

// デバッグ用の表示名
TextArea.displayName = 'TextArea'