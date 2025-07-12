import { useEffect, useState } from 'react'
import { EditorConfig } from '../../../domain/config/entities/EditorConfig'
import { ConfigObserver } from '../../../domain/observer/services/ConfigObserver'
import type { EditorConfigChangeData } from '../../../domain/observer/types/ObserverTypes'

interface LineCounterProps {
  text: string
  currentLine?: number
  className?: string
  onLineClick?: (lineNumber: number) => void
}

/**
 * 行番号カウンターコンポーネント
 * 
 * Observer Patternを使用してエディタ設定変更（行番号表示の有無）に対応し、
 * テキストの行数をリアルタイムで表示・管理する。
 * 
 * Display Features:
 * - リアルタイム行数カウント
 * - 現在行のハイライト
 * - 行番号クリックによるジャンプ機能
 * - 設定による表示/非表示切り替え
 * - テーマに応じた外観
 */
export const LineCounter = ({ 
  text, 
  currentLine = 1, 
  className,
  onLineClick 
}: LineCounterProps) => {
  const [theme, setTheme] = useState(EditorConfig.getInstance().getTheme())
  const [showLineNumbers, setShowLineNumbers] = useState(EditorConfig.getInstance().getShowLineNumbers())

  // Observer Pattern実装: EditorConfigの変更監視
  useEffect(() => {
    const editorConfig = EditorConfig.getInstance()
    
    const lineCounterObserver = new ConfigObserver(
      (data: EditorConfigChangeData) => {
        if (data.key === 'theme') {
          setTheme(data.newValue as 'light' | 'dark')
        } else if (data.key === 'showLineNumbers') {
          setShowLineNumbers(data.newValue as boolean)
        }
      },
      { 
        id: 'line-counter-observer',
        watchedKeys: ['theme', 'showLineNumbers']
      }
    )

    editorConfig.attach(lineCounterObserver)

    // クリーンアップ時にObserverを削除
    return () => {
      editorConfig.detach(lineCounterObserver)
    }
  }, [])

  // テキストから行数を計算
  const lines = text.split('\n')
  const totalLines = lines.length

  // 行番号表示が無効の場合は何も表示しない
  if (!showLineNumbers) {
    return null
  }

  const bgColor = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
  const textColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
  const currentLineColor = theme === 'dark' ? 'text-gray-100 bg-gray-700' : 'text-gray-900 bg-gray-200'
  const hoverColor = theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'

  const handleLineClick = (lineNumber: number) => {
    if (onLineClick) {
      onLineClick(lineNumber)
    }
  }

  return (
    <div className={`
      flex flex-col items-end px-2 py-2 text-xs font-mono
      border-r ${bgColor} ${textColor} ${className}
      min-w-[3rem] max-w-[4rem]
    `}>
      {/* 行番号のリスト */}
      {Array.from({ length: totalLines }, (_, index) => {
        const lineNumber = index + 1
        const isCurrentLine = lineNumber === currentLine
        
        return (
          <div
            key={lineNumber}
            className={`
              w-full text-right px-1 py-0.5 rounded cursor-pointer
              transition-colors duration-150
              ${isCurrentLine ? currentLineColor : `${hoverColor}`}
              ${onLineClick ? 'cursor-pointer' : 'cursor-default'}
            `}
            onClick={() => handleLineClick(lineNumber)}
            title={`行 ${lineNumber} に移動`}
          >
            {lineNumber}
          </div>
        )
      })}

      {/* 行数が多い場合の省略表示 */}
      {totalLines > 1000 && (
        <div className={`w-full text-right px-1 py-0.5 mt-2 border-t ${textColor} border-gray-300`}>
          <span className="text-xs">
            総 {totalLines.toLocaleString()} 行
          </span>
        </div>
      )}
    </div>
  )
}