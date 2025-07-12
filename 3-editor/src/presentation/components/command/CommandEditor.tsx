import React, { useState, useCallback, useMemo } from 'react'
import { Card } from '../../shared/card'
import { Button } from '../../shared/button'
import { CommandTextArea } from './CommandTextArea'
import { EditorConfig, type EditorSettings } from '../../../domain/config/entities/EditorConfig'
import { useCommandHistory } from '../../hooks/useCommandHistory'
import { cn } from '../../../shared/utils/cn'

/**
 * Command対応Editorコンポーネントのプロパティ
 */
interface CommandEditorProps {
  /** エディタの初期値 */
  initialValue?: string
  /** テキスト変更時のコールバック */
  onTextChange?: (text: string) => void
  /** 追加のCSSクラス */
  className?: string
  /** Command履歴の設定 */
  commandConfig?: {
    maxHistorySize?: number
    enableAutoSave?: boolean
  }
  /** アンドゥ・リドゥボタンの表示 */
  showUndoRedoButtons?: boolean
  /** 履歴パネルの表示 */
  showHistoryPanel?: boolean
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
 * 履歴パネルコンポーネント
 */
interface HistoryPanelProps {
  historyList: Array<{
    index: number
    description: string
    executed: boolean
    canUndo: boolean
  }>
  currentPosition: number
  onJumpToHistory: (index: number) => void
}

const HistoryPanel: React.FC<HistoryPanelProps> = React.memo(({ 
  historyList, 
  currentPosition, 
  onJumpToHistory 
}) => {
  if (historyList.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">
        履歴がありません
      </div>
    )
  }

  return (
    <div className="p-2 max-h-40 overflow-y-auto">
      {historyList.map((item) => (
        <div
          key={item.index}
          className={cn(
            'p-2 text-xs cursor-pointer rounded hover:bg-gray-100',
            item.executed ? 'font-medium' : 'text-gray-500',
            item.index === currentPosition - 1 ? 'bg-blue-100' : ''
          )}
          onClick={() => onJumpToHistory(item.index)}
        >
          <span className="mr-2">
            {item.index === currentPosition - 1 ? '→' : '  '}
          </span>
          {item.description}
        </div>
      ))}
    </div>
  )
})

HistoryPanel.displayName = 'HistoryPanel'

/**
 * Command Pattern対応のテキストエディタコンポーネント
 * 
 * Phase 2でのデザインパターン実装:
 * - Command Pattern: テキスト操作のオブジェクト化とアンドゥ・リドゥ
 * - Observer Pattern: テキスト変更の監視とUI更新
 * - Singleton Pattern: EditorConfigでの設定管理
 * - Composition Pattern: 複数コンポーネントの組み合わせ
 */
export const CommandEditor: React.FC<CommandEditorProps> = React.memo(({
  initialValue = '',
  onTextChange,
  className,
  commandConfig,
  showUndoRedoButtons = true,
  showHistoryPanel = false
}) => {
  const [config] = useState(() => EditorConfig.getInstance().getSettings())
  
  // Command履歴管理
  const commandHistory = useCommandHistory({
    initialText: initialValue,
    config: commandConfig,
    enableAutoSave: commandConfig?.enableAutoSave
  })

  // テキスト変更ハンドラ
  const handleTextChange = useCallback((newText: string) => {
    onTextChange?.(newText)
  }, [onTextChange])

  // 行の分割（メモ化）
  const lines = useMemo(() => commandHistory.text.split('\n'), [commandHistory.text])

  // テーマに基づくコンテナスタイル（メモ化）
  const containerClassName = useMemo(() => cn(
    'w-full h-96 overflow-hidden flex flex-col',
    config.theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white',
    className
  ), [config.theme, className])

  // アンドゥ・リドゥボタンコンポーネント
  const UndoRedoButtons = useMemo(() => {
    if (!showUndoRedoButtons) return null

    return (
      <div className="flex gap-2 p-2 border-b bg-gray-50">
        <Button
          size="sm"
          variant="outline"
          onClick={commandHistory.undo}
          disabled={!commandHistory.canUndo}
          className="flex items-center gap-1"
        >
          <span>↶</span>
          <span>元に戻す</span>
          <kbd className="text-xs bg-gray-200 px-1 rounded">Ctrl+Z</kbd>
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={commandHistory.redo}
          disabled={!commandHistory.canRedo}
          className="flex items-center gap-1"
        >
          <span>↷</span>
          <span>やり直し</span>
          <kbd className="text-xs bg-gray-200 px-1 rounded">Ctrl+Y</kbd>
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={commandHistory.clearHistory}
          className="ml-auto text-red-600"
        >
          履歴クリア
        </Button>
        
        <div className="flex items-center text-xs text-gray-500 px-2">
          履歴: {commandHistory.historyStats.currentPosition}/{commandHistory.historyStats.totalCommands}
        </div>
      </div>
    )
  }, [
    showUndoRedoButtons,
    commandHistory.undo,
    commandHistory.redo,
    commandHistory.canUndo,
    commandHistory.canRedo,
    commandHistory.clearHistory,
    commandHistory.historyStats
  ])

  return (
    <Card className={containerClassName}>
      {UndoRedoButtons}
      
      <div className="flex flex-1 overflow-hidden">
        {/* メインエディタエリア */}
        <div className="flex flex-1">
          <LineNumbers lines={lines} config={config} />
          <div className="flex-1">
            <CommandTextArea
              initialValue={initialValue}
              onChange={handleTextChange}
              className="h-full"
              commandConfig={commandConfig}
            />
          </div>
        </div>

        {/* 履歴パネル */}
        {showHistoryPanel && (
          <div className="w-64 border-l bg-gray-50">
            <div className="p-2 border-b bg-white">
              <h3 className="text-sm font-medium">操作履歴</h3>
            </div>
            <HistoryPanel
              historyList={commandHistory.historyList}
              currentPosition={commandHistory.historyStats.currentPosition}
              onJumpToHistory={commandHistory.jumpToHistoryPoint}
            />
          </div>
        )}
      </div>

      {/* ステータスバー */}
      <div className="flex items-center justify-between p-2 border-t bg-gray-50 text-xs text-gray-600">
        <div className="flex gap-4">
          <span>文字数: {commandHistory.text.length}</span>
          <span>行数: {lines.length}</span>
          <span>履歴: {commandHistory.historyStats.totalCommands}</span>
        </div>
        
        <div className="flex gap-4">
          {commandHistory.canUndo && <span className="text-green-600">↶ 元に戻せます</span>}
          {commandHistory.canRedo && <span className="text-blue-600">↷ やり直せます</span>}
          <span>メモリ使用量: {Math.round(commandHistory.historyStats.memoryUsage / 1024)}KB</span>
        </div>
      </div>
    </Card>
  )
})

// デバッグ用の表示名
CommandEditor.displayName = 'CommandEditor'

/**
 * CommandEditorの使用例
 */
export const CommandEditorExample: React.FC = () => {
  const [text, setText] = useState('')

  return (
    <div className="space-y-4">
      <CommandEditor
        initialValue="# Welcome to Command Editor\n\nThis editor supports undo/redo functionality!\n\nTry typing, then press Ctrl+Z to undo."
        onTextChange={setText}
        showUndoRedoButtons={true}
        showHistoryPanel={true}
        commandConfig={{
          maxHistorySize: 50,
          enableAutoSave: false
        }}
      />
      
      <div className="p-4 bg-gray-100 rounded">
        <h3 className="font-medium mb-2">現在のテキスト内容:</h3>
        <pre className="text-sm whitespace-pre-wrap">{text}</pre>
      </div>
    </div>
  )
}