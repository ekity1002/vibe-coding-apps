import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/card'
import { Button } from '../../shared/button'
import { CommandService } from '../../../application/services/CommandService'
import { EditorConfig } from '../../../domain/config/entities/EditorConfig'
import { ConfigObserver } from '../../../domain/observer/services/ConfigObserver'
import type { EditorConfigChangeData } from '../../../domain/observer/types/ObserverTypes'
import { HistoryItem } from './HistoryItem'
import { HistoryStats } from './HistoryStats'

interface HistoryPanelProps {
  commandService: CommandService
  className?: string
}

/**
 * 履歴パネルコンポーネント
 * 
 * Command Pattern + Observer Pattern の統合実装
 * - CommandServiceから操作履歴を取得・表示
 * - EditorConfigの設定変更を監視してUI更新
 * - undo/redo操作のインターフェース提供
 * - リアルタイムな履歴統計の表示
 */
export const HistoryPanel = ({ commandService, className }: HistoryPanelProps) => {
  const [historyList, setHistoryList] = useState(commandService.getHistoryList())
  const [stats, setStats] = useState(commandService.getHistoryStats())
  const [theme, setTheme] = useState(EditorConfig.getInstance().getTheme())
  const [isVisible, setIsVisible] = useState(true)

  // Observer Pattern実装: EditorConfigの変更監視
  useEffect(() => {
    const editorConfig = EditorConfig.getInstance()
    
    // テーマ変更とパネル表示設定の監視用Observer
    const panelObserver = new ConfigObserver(
      (data: EditorConfigChangeData) => {
        if (data.key === 'theme') {
          setTheme(data.newValue as 'light' | 'dark')
        }
      },
      { 
        id: 'history-panel-observer',
        watchedKeys: ['theme']
      }
    )

    editorConfig.attach(panelObserver)

    // クリーンアップ時にObserverを削除
    return () => {
      editorConfig.detach(panelObserver)
    }
  }, [])

  // CommandServiceの状態変更を監視
  useEffect(() => {
    const updateHistoryData = () => {
      setHistoryList(commandService.getHistoryList())
      setStats(commandService.getHistoryStats())
    }

    // 初期データ設定
    updateHistoryData()

    // 定期的な更新（実際のアプリでは、CommandServiceからのイベント通知を使用）
    const interval = setInterval(updateHistoryData, 1000)

    return () => clearInterval(interval)
  }, [commandService])

  const handleUndo = () => {
    const success = commandService.undo()
    if (success) {
      setHistoryList(commandService.getHistoryList())
      setStats(commandService.getHistoryStats())
    }
  }

  const handleRedo = () => {
    const success = commandService.redo()
    if (success) {
      setHistoryList(commandService.getHistoryList())
      setStats(commandService.getHistoryStats())
    }
  }

  const handleJumpTo = (index: number) => {
    const success = commandService.jumpToHistoryPoint(index)
    if (success) {
      setHistoryList(commandService.getHistoryList())
      setStats(commandService.getHistoryStats())
    }
  }

  const handleClearHistory = () => {
    commandService.clearHistory()
    setHistoryList(commandService.getHistoryList())
    setStats(commandService.getHistoryStats())
  }

  const toggleVisibility = () => {
    setIsVisible(!isVisible)
  }

  if (!isVisible) {
    return (
      <div className={`fixed top-4 right-4 ${className}`}>
        <Button
          onClick={toggleVisibility}
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
        >
          📋
        </Button>
      </div>
    )
  }

  return (
    <Card 
      className={`
        w-80 max-h-96 overflow-hidden
        ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        ${className}
      `}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-sm font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            操作履歴
          </CardTitle>
          <div className="flex gap-1">
            <Button
              onClick={toggleVisibility}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              ➖
            </Button>
          </div>
        </div>
        
        {/* 統計情報の表示 */}
        <HistoryStats 
          stats={stats} 
          theme={theme}
          className="mt-2"
        />
      </CardHeader>

      <CardContent className="pt-0">
        {/* Undo/Redo コントロール */}
        <div className="flex gap-2 mb-3">
          <Button
            onClick={handleUndo}
            disabled={!stats.canUndo}
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
          >
            ↶ Undo
          </Button>
          <Button
            onClick={handleRedo}
            disabled={!stats.canRedo}
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
          >
            ↷ Redo
          </Button>
          <Button
            onClick={handleClearHistory}
            disabled={stats.totalCommands === 0}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            🗑️
          </Button>
        </div>

        {/* 履歴リストの表示 */}
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {historyList.length === 0 ? (
            <div className={`text-xs text-center py-4 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              操作履歴がありません
            </div>
          ) : (
            historyList.map((item, index) => (
              <HistoryItem
                key={index}
                item={item}
                isActive={item.executed}
                isCurrent={index === stats.currentPosition - 1}
                theme={theme}
                onClick={() => handleJumpTo(index)}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}