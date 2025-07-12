interface HistoryStatsData {
  totalCommands: number
  currentPosition: number
  canUndo: boolean
  canRedo: boolean
  memoryUsage: number
}

interface HistoryStatsProps {
  stats: HistoryStatsData
  theme: 'light' | 'dark'
  className?: string
}

/**
 * 履歴統計コンポーネント
 * 
 * CommandServiceから取得した統計情報をリアルタイムで表示。
 * Observer Patternによって設定変更（テーマなど）に対応し、
 * UI表示を自動更新する。
 * 
 * Display Features:
 * - 総コマンド数
 * - 現在位置
 * - Undo/Redo可能状態
 * - メモリ使用量（推定値）
 * - 進捗インジケータ
 */
export const HistoryStats = ({ stats, theme, className }: HistoryStatsProps) => {
  const formatMemoryUsage = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const getProgressPercentage = (): number => {
    if (stats.totalCommands === 0) return 0
    return (stats.currentPosition / stats.totalCommands) * 100
  }

  const textColor = theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
  const progressBgColor = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
  const progressFillColor = theme === 'dark' ? 'bg-blue-500' : 'bg-blue-400'

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 基本統計 */}
      <div className="flex justify-between items-center">
        <div className={`text-xs ${textColor}`}>
          <span className="font-medium">総数:</span> {stats.totalCommands}
        </div>
        <div className={`text-xs ${textColor}`}>
          <span className="font-medium">位置:</span> {stats.currentPosition}/{stats.totalCommands}
        </div>
      </div>

      {/* 進捗バー */}
      <div className="w-full">
        <div className={`w-full h-1.5 ${progressBgColor} rounded-full overflow-hidden`}>
          <div
            className={`h-full ${progressFillColor} transition-all duration-300 ease-out`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* 状態と使用量 */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <span 
            className={`text-xs px-1.5 py-0.5 rounded ${
              stats.canUndo 
                ? theme === 'dark' 
                  ? 'bg-green-800 text-green-200' 
                  : 'bg-green-100 text-green-700'
                : theme === 'dark'
                  ? 'bg-gray-700 text-gray-400'
                  : 'bg-gray-100 text-gray-400'
            }`}
          >
            Undo
          </span>
          <span 
            className={`text-xs px-1.5 py-0.5 rounded ${
              stats.canRedo 
                ? theme === 'dark' 
                  ? 'bg-blue-800 text-blue-200' 
                  : 'bg-blue-100 text-blue-700'
                : theme === 'dark'
                  ? 'bg-gray-700 text-gray-400'
                  : 'bg-gray-100 text-gray-400'
            }`}
          >
            Redo
          </span>
        </div>
        
        <div className={`text-xs ${textColor}`}>
          💾 {formatMemoryUsage(stats.memoryUsage)}
        </div>
      </div>
    </div>
  )
}