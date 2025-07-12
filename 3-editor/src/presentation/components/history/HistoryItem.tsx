import { Button } from '../../shared/button'

interface HistoryItemData {
  index: number
  description: string
  executed: boolean
  canUndo: boolean
}

interface HistoryItemProps {
  item: HistoryItemData
  isActive: boolean
  isCurrent: boolean
  theme: 'light' | 'dark'
  onClick: () => void
}

/**
 * 履歴項目コンポーネント
 * 
 * 個別の操作履歴を表示し、クリックで特定の履歴ポイントに移動可能。
 * Command Patternの実装において、各コマンドの状態と説明を視覚化する。
 * 
 * Features:
 * - 実行済み/未実行の状態表示
 * - 現在位置のハイライト
 * - テーマに対応した色調整
 * - クリックによる履歴ジャンプ
 */
export const HistoryItem = ({ 
  item, 
  isActive, 
  isCurrent, 
  theme, 
  onClick 
}: HistoryItemProps) => {
  const getStatusIcon = () => {
    if (isCurrent) return '👉'
    if (isActive) return '✅'
    return '⚪'
  }

  const getItemStyle = () => {
    const baseStyle = 'w-full text-left text-xs p-2 rounded transition-colors'
    
    if (theme === 'dark') {
      if (isCurrent) {
        return `${baseStyle} bg-blue-600 text-white border border-blue-500`
      }
      if (isActive) {
        return `${baseStyle} bg-gray-700 text-gray-200 hover:bg-gray-600`
      }
      return `${baseStyle} bg-gray-800 text-gray-400 hover:bg-gray-700`
    } else {
      if (isCurrent) {
        return `${baseStyle} bg-blue-100 text-blue-800 border border-blue-300`
      }
      if (isActive) {
        return `${baseStyle} bg-gray-100 text-gray-800 hover:bg-gray-200`
      }
      return `${baseStyle} bg-gray-50 text-gray-500 hover:bg-gray-100`
    }
  }

  const formatDescription = (description: string) => {
    // 説明文が長い場合は省略
    if (description.length > 30) {
      return `${description.substring(0, 27)}...`
    }
    return description
  }

  return (
    <Button
      onClick={onClick}
      variant="ghost"
      className={getItemStyle()}
    >
      <div className="flex items-center w-full">
        <span className="mr-2 text-sm">{getStatusIcon()}</span>
        <div className="flex-1 text-left">
          <div className="font-medium">
            {formatDescription(item.description)}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs opacity-75">
              #{item.index + 1}
            </span>
            {!item.canUndo && (
              <span className="text-xs opacity-60">
                🔒 固定
              </span>
            )}
          </div>
        </div>
      </div>
    </Button>
  )
}