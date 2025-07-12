import { useEffect, useState, useMemo } from 'react'
import { EditorConfig } from '../../../domain/config/entities/EditorConfig'
import { ConfigObserver } from '../../../domain/observer/services/ConfigObserver'
import type { EditorConfigChangeData } from '../../../domain/observer/types/ObserverTypes'
import { TextService } from '../../../application/services/TextService'

interface CharCounterProps {
  text: string
  className?: string
  showDetailedStats?: boolean
  maxCharacters?: number
}

/**
 * 文字数カウンターコンポーネント
 * 
 * Observer Patternを使用してエディタ設定変更に対応し、
 * テキストの文字数・行数・単語数をリアルタイムで表示・管理する。
 * 
 * Display Features:
 * - リアルタイム文字数カウント
 * - 詳細統計（行数、単語数、空白除く文字数）
 * - 最大文字数制限の表示
 * - 進捗バー表示
 * - テーマに応じた外観
 */
export const CharCounter = ({ 
  text, 
  className,
  showDetailedStats = true,
  maxCharacters
}: CharCounterProps) => {
  const [theme, setTheme] = useState(EditorConfig.getInstance().getTheme())

  // Observer Pattern実装: EditorConfigの変更監視
  useEffect(() => {
    const editorConfig = EditorConfig.getInstance()
    
    const charCounterObserver = new ConfigObserver(
      (data: EditorConfigChangeData) => {
        if (data.key === 'theme') {
          setTheme(data.newValue as 'light' | 'dark')
        }
      },
      { 
        id: 'char-counter-observer',
        watchedKeys: ['theme']
      }
    )

    editorConfig.attach(charCounterObserver)

    // クリーンアップ時にObserverを削除
    return () => {
      editorConfig.detach(charCounterObserver)
    }
  }, [])

  // テキスト統計の計算（メモ化）
  const textStats = useMemo(() => {
    return TextService.getTextStatistics(text)
  }, [text])

  // 進捗の計算
  const progress = maxCharacters ? (textStats.characters / maxCharacters) * 100 : 0
  const isNearLimit = maxCharacters && progress > 80
  const isOverLimit = maxCharacters && progress > 100

  const bgColor = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const textColor = theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
  const labelColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
  const progressBgColor = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
  
  // 進捗バーの色を動的に決定
  const getProgressColor = () => {
    if (isOverLimit) return 'bg-red-500'
    if (isNearLimit) return 'bg-yellow-500'
    return theme === 'dark' ? 'bg-blue-500' : 'bg-blue-400'
  }

  const formatNumber = (num: number): string => {
    return num.toLocaleString()
  }

  return (
    <div className={`
      p-4 rounded-lg border ${bgColor} ${className}
    `}>
      {/* タイトル */}
      <h3 className={`text-sm font-semibold mb-3 ${textColor}`}>
        テキスト統計
      </h3>

      {/* 基本統計 */}
      <div className="space-y-3">
        {/* 文字数（メイン表示） */}
        <div className="flex justify-between items-center">
          <span className={`text-sm font-medium ${labelColor}`}>文字数:</span>
          <span className={`text-lg font-bold ${
            isOverLimit ? 'text-red-500' : 
            isNearLimit ? 'text-yellow-500' : textColor
          }`}>
            {formatNumber(textStats.characters)}
            {maxCharacters && (
              <span className={`text-sm font-normal ${labelColor} ml-1`}>
                / {formatNumber(maxCharacters)}
              </span>
            )}
          </span>
        </div>

        {/* 進捗バー（最大文字数が設定されている場合） */}
        {maxCharacters && (
          <div className="w-full">
            <div className={`w-full h-2 ${progressBgColor} rounded-full overflow-hidden`}>
              <div
                className={`h-full ${getProgressColor()} transition-all duration-300 ease-out`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            {isOverLimit && (
              <p className="text-xs text-red-500 mt-1">
                文字数制限を {formatNumber(textStats.characters - maxCharacters)} 文字オーバーしています
              </p>
            )}
          </div>
        )}

        {/* 詳細統計 */}
        {showDetailedStats && (
          <>
            <div className="flex justify-between">
              <span className={`text-sm ${labelColor}`}>行数:</span>
              <span className={`text-sm ${textColor}`}>{formatNumber(textStats.lines)}</span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${labelColor}`}>単語数:</span>
              <span className={`text-sm ${textColor}`}>{formatNumber(textStats.words)}</span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${labelColor}`}>空白を除く文字数:</span>
              <span className={`text-sm ${textColor}`}>{formatNumber(textStats.charactersNoSpaces)}</span>
            </div>
            
            {/* 読書時間の推定 */}
            <div className="flex justify-between">
              <span className={`text-sm ${labelColor}`}>推定読書時間:</span>
              <span className={`text-sm ${textColor}`}>
                {Math.ceil(textStats.words / 200)} 分
              </span>
            </div>
          </>
        )}
      </div>

      {/* 追加情報 */}
      {text.length > 0 && (
        <div className={`mt-3 pt-3 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-between text-xs">
            <span className={labelColor}>最終更新:</span>
            <span className={labelColor}>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  )
}