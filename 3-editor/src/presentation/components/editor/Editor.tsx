import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card } from '../../shared/card'
import { TextArea } from './TextArea'
import { EditorConfig, type EditorSettings } from '../../../domain/config/entities/EditorConfig'
import { ConfigObserver } from '../../../domain/observer/services/ConfigObserver'
import type { EditorConfigChangeData } from '../../../domain/observer/types/ObserverTypes'
import { cn } from '../../../shared/utils/cn'

/**
 * Editorコンポーネントのプロパティ
 */
interface EditorProps {
  /** エディタの初期値 */
  initialValue?: string
  /** テキスト変更時のコールバック */
  onTextChange?: (text: string) => void
  /** 追加のCSSクラス */
  className?: string
}

/**
 * 行番号表示コンポーネント
 */
interface LineNumbersProps {
  lines: string[]
  config: EditorSettings
}

const LineNumbers: React.FC<LineNumbersProps> = React.memo(({ lines, config }) => {
  if (!config.showLineNumbers) return null

  return (
    <div className="flex flex-col min-w-12 px-2 py-4 border-r">
      {lines.map((_, index) => (
        <div key={index + 1} className="leading-6 text-gray-500 text-sm">
          {index + 1}
        </div>
      ))}
    </div>
  )
})

LineNumbers.displayName = 'LineNumbers'

/**
 * テキストエディタコンポーネント
 * 
 * Features:
 * - EditorConfigのSingleton設定を統合
 * - 行番号表示機能
 * - テーマ対応（ライト/ダーク）
 * - TextAreaコンポーネントとの統合
 * - リアルタイム設定変更対応（Observer Pattern）
 * 
 * Design Patterns:
 * - Singleton Pattern: EditorConfigでの設定管理
 * - Observer Pattern: 設定変更の監視とリアルタイム更新
 * - Composition Pattern: TextAreaコンポーネントの組み合わせ
 */
export const Editor: React.FC<EditorProps> = React.memo(({
  initialValue = '',
  onTextChange,
  className,
}) => {
  const [text, setText] = useState(initialValue)
  const [config, setConfig] = useState<EditorSettings>(
    () => EditorConfig.getInstance().getSettings()
  )

  // 初期値の同期
  useEffect(() => {
    setText(initialValue)
  }, [initialValue])

  // Observer Pattern実装: EditorConfigの変更監視
  useEffect(() => {
    const editorConfig = EditorConfig.getInstance()
    
    // 設定変更監視用Observer
    const editorObserver = new ConfigObserver(
      (data: EditorConfigChangeData) => {
        // 設定変更時にconfigを更新（リロード不要）
        setConfig(editorConfig.getSettings())
      },
      { 
        id: 'editor-config-observer',
        watchedKeys: ['theme', 'fontSize', 'showLineNumbers', 'tabSize', 'wordWrap']
      }
    )

    editorConfig.attach(editorObserver)

    // 初期設定も取得
    setConfig(editorConfig.getSettings())

    // クリーンアップ時にObserverを削除
    return () => {
      editorConfig.detach(editorObserver)
    }
  }, [])

  // テキスト変更ハンドラ（最適化）
  const handleTextChange = useCallback((newText: string) => {
    setText(newText)
    onTextChange?.(newText)
  }, [onTextChange])

  // 行の分割（メモ化）
  const lines = useMemo(() => text.split('\n'), [text])

  // テーマに基づくコンテナスタイル（メモ化）
  const containerClassName = useMemo(() => cn(
    'w-full h-96 overflow-hidden flex',
    config.theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white',
    className
  ), [config.theme, className])

  return (
    <Card className={containerClassName}>
      <LineNumbers lines={lines} config={config} />
      <div className="flex-1">
        <TextArea
          value={text}
          onChange={handleTextChange}
          className="h-full"
        />
      </div>
    </Card>
  )
})

// デバッグ用の表示名
Editor.displayName = 'Editor'