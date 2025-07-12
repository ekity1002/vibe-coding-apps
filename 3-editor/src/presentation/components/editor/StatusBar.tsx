import { useEffect, useState } from 'react'
import { EditorConfig } from '../../../domain/config/entities/EditorConfig'
import { ConfigObserver } from '../../../domain/observer/services/ConfigObserver'
import type { EditorConfigChangeData } from '../../../domain/observer/types/ObserverTypes'

interface StatusBarProps {
  currentLine: number
  currentColumn: number
  totalLines: number
  totalCharacters: number
  selectedText?: string
  className?: string
}

/**
 * エディタステータスバーコンポーネント
 * 
 * Observer Patternを使用してエディタ設定変更に対応し、
 * エディタの現在状態をリアルタイムで表示する。
 * 
 * Display Features:
 * - 現在の行・列位置
 * - 総行数・文字数
 * - 選択中のテキスト情報
 * - エディタ設定状態（読み取り専用等）
 * - テーマに応じた外観
 */
export const StatusBar = ({ 
  currentLine, 
  currentColumn, 
  totalLines, 
  totalCharacters, 
  selectedText,
  className 
}: StatusBarProps) => {
  const [theme, setTheme] = useState(EditorConfig.getInstance().getTheme())
  const [config, setConfig] = useState(EditorConfig.getInstance())

  // Observer Pattern実装: EditorConfigの変更監視
  useEffect(() => {
    const editorConfig = EditorConfig.getInstance()
    
    const statusBarObserver = new ConfigObserver(
      (data: EditorConfigChangeData) => {
        if (data.key === 'theme') {
          setTheme(data.newValue as 'light' | 'dark')
        }
        // 設定全体の更新
        setConfig(EditorConfig.getInstance())
      },
      { 
        id: 'status-bar-observer',
        watchedKeys: ['theme', 'autoSave', 'showLineNumbers']
      }
    )

    editorConfig.attach(statusBarObserver)

    // クリーンアップ時にObserverを削除
    return () => {
      editorConfig.detach(statusBarObserver)
    }
  }, [])

  const bgColor = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
  const textColor = theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
  const separatorColor = theme === 'dark' ? 'border-gray-600' : 'border-gray-300'

  const formatSelection = (): string => {
    if (!selectedText) return ''
    const lines = selectedText.split('\n').length
    const chars = selectedText.length
    return lines > 1 
      ? `選択: ${chars}文字 (${lines}行)`
      : `選択: ${chars}文字`
  }

  return (
    <div className={`
      flex items-center justify-between px-4 py-2 text-xs
      border-t ${bgColor} ${textColor} ${className}
    `}>
      {/* 左側: カーソル位置と文書情報 */}
      <div className="flex items-center space-x-4">
        <span className="font-medium">
          行 {currentLine}, 列 {currentColumn}
        </span>
        
        <div className={`w-px h-4 ${separatorColor} border-r`} />
        
        <span>
          {totalLines}行, {totalCharacters}文字
        </span>

        {selectedText && (
          <>
            <div className={`w-px h-4 ${separatorColor} border-r`} />
            <span className="text-blue-600 dark:text-blue-400">
              {formatSelection()}
            </span>
          </>
        )}
      </div>

      {/* 右側: エディタ設定状態 */}
      <div className="flex items-center space-x-4">
        {config.getAutoSave() && (
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>自動保存</span>
          </span>
        )}
        
        {config.getShowLineNumbers() && (
          <span className="flex items-center space-x-1">
            <span className="text-blue-500">#</span>
            <span>行番号</span>
          </span>
        )}

        <div className={`w-px h-4 ${separatorColor} border-r`} />
        
        <span className="capitalize">
          {theme === 'dark' ? '🌙 ダーク' : '☀️ ライト'}
        </span>
      </div>
    </div>
  )
}