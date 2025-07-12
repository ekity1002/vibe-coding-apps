import { useCallback, useMemo, useRef, useState } from 'react'
import { CommandService } from '../../application/services/CommandService'
import { DeleteTextCommand } from '../../domain/command/commands/DeleteTextCommand'
import { InsertTextCommand } from '../../domain/command/commands/InsertTextCommand'
import { ReplaceTextCommand } from '../../domain/command/commands/ReplaceTextCommand'
import type { CommandContext, CommandHistoryConfig } from '../../domain/command/types/Command'

/**
 * Command履歴管理のためのReactフック
 *
 * Command Patternの実装において、Reactコンポーネントとの統合を担当する。
 * テキストエディタでのアンドゥ・リドゥ機能をuseCommandHistoryフックとして提供。
 *
 * Design Patterns:
 * - Command Pattern: 操作のオブジェクト化
 * - Observer Pattern: テキスト変更の監視
 * - Factory Pattern: Commandの生成
 */

export interface UseCommandHistoryOptions {
  /** 初期のテキスト内容 */
  initialText?: string
  /** Command履歴の設定 */
  config?: Partial<CommandHistoryConfig>
  /** 自動保存の有効化 */
  enableAutoSave?: boolean
}

export interface UseCommandHistoryReturn {
  /** 現在のテキスト内容 */
  text: string
  /** テキストを設定する関数 */
  setText: (newText: string) => void
  /** テキストを挿入する関数 */
  insertText: (text: string, position: number) => boolean
  /** テキストを削除する関数 */
  deleteText: (start: number, end: number) => boolean
  /** テキストを置換する関数 */
  replaceText: (newText: string, start: number, end: number) => boolean
  /** アンドゥを実行する関数 */
  undo: () => boolean
  /** リドゥを実行する関数 */
  redo: () => boolean
  /** アンドゥ可能かどうか */
  canUndo: boolean
  /** リドゥ可能かどうか */
  canRedo: boolean
  /** 履歴をクリアする関数 */
  clearHistory: () => void
  /** 履歴統計情報 */
  historyStats: {
    totalCommands: number
    currentPosition: number
    canUndo: boolean
    canRedo: boolean
    memoryUsage: number
  }
  /** 履歴一覧 */
  historyList: Array<{
    index: number
    description: string
    executed: boolean
    canUndo: boolean
  }>
  /** 指定した履歴ポイントにジャンプ */
  jumpToHistoryPoint: (index: number) => boolean
}

export function useCommandHistory(options: UseCommandHistoryOptions = {}): UseCommandHistoryReturn {
  const {
    initialText = '',
    config,
    enableAutoSave = false
  } = options

  // CommandServiceのインスタンスを保持
  const commandServiceRef = useRef<CommandService>()
  if (!commandServiceRef.current) {
    commandServiceRef.current = new CommandService(config)
  }
  const commandService = commandServiceRef.current

  // 現在のテキスト状態を保持（リアクティブ）
  const [text, setTextState] = useState(initialText)
  const [updateCounter, setUpdateCounter] = useState(0)
  const textRef = useRef(text)
  const cursorPositionRef = useRef(0)
  const selectionRef = useRef<{ start: number; end: number } | null>(null)

  // テキスト更新のコールバック関数群
  const updateTextCallbacks = useRef<Set<(text: string) => void>>(new Set())

  // textRefとReactの状態を同期
  textRef.current = text

  // CommandContextの作成
  const commandContext = useMemo<CommandContext>(() => ({
    get currentText() {
      return textRef.current
    },
    updateText: (newText: string) => {
      textRef.current = newText
      setTextState(newText)
      setUpdateCounter(prev => prev + 1)
      // 登録されたコールバックを全て実行
      updateTextCallbacks.current.forEach(callback => callback(newText))
    },
    setCursorPosition: (position: number) => {
      cursorPositionRef.current = position
    },
    setSelection: (start: number, end: number) => {
      selectionRef.current = { start, end }
    }
  }), [])

  // テキスト設定関数
  const setText = useCallback((newText: string) => {
    textRef.current = newText
    setTextState(newText)
    updateTextCallbacks.current.forEach(callback => callback(newText))
  }, [])

  // テキスト挿入関数
  const insertText = useCallback((text: string, position: number): boolean => {
    const command = new InsertTextCommand(text, position, commandContext)
    return commandService.executeCommand(command)
  }, [commandService, commandContext])

  // テキスト削除関数
  const deleteText = useCallback((start: number, end: number): boolean => {
    const command = new DeleteTextCommand(start, end, commandContext)
    return commandService.executeCommand(command)
  }, [commandService, commandContext])

  // テキスト置換関数
  const replaceText = useCallback((newText: string, start: number, end: number): boolean => {
    const command = new ReplaceTextCommand(newText, start, end, commandContext)
    return commandService.executeCommand(command)
  }, [commandService, commandContext])

  // アンドゥ関数
  const undo = useCallback((): boolean => {
    const result = commandService.undo()
    setUpdateCounter(prev => prev + 1)
    return result
  }, [commandService])

  // リドゥ関数
  const redo = useCallback((): boolean => {
    const result = commandService.redo()
    setUpdateCounter(prev => prev + 1)
    return result
  }, [commandService])

  // 履歴クリア関数
  const clearHistory = useCallback(() => {
    commandService.clearHistory()
    setUpdateCounter(prev => prev + 1)
  }, [commandService])

  // 履歴ジャンプ関数
  const jumpToHistoryPoint = useCallback((index: number): boolean => {
    const result = commandService.jumpToHistoryPoint(index)
    setUpdateCounter(prev => prev + 1)
    return result
  }, [commandService])

  // アンドゥ・リドゥ可能性の取得（updateCounterで更新）
  const canUndo = useMemo(() => commandService.canUndo(), [commandService, updateCounter])
  const canRedo = useMemo(() => commandService.canRedo(), [commandService, updateCounter])

  // 履歴統計情報の取得（updateCounterで更新）
  const historyStats = useMemo(() => commandService.getHistoryStats(), [commandService, updateCounter])

  // 履歴一覧の取得（updateCounterで更新）
  const historyList = useMemo(() => commandService.getHistoryList(), [commandService, updateCounter])

  // コールバック登録関数（内部使用）
  const registerUpdateCallback = useCallback((callback: (text: string) => void) => {
    updateTextCallbacks.current.add(callback)
    return () => {
      updateTextCallbacks.current.delete(callback)
    }
  }, [])

  // キーボードショートカットのハンドラ
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ctrl+Z (Windows/Linux) または Cmd+Z (Mac)
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      event.preventDefault()
      undo()
      return
    }

    // Ctrl+Y (Windows/Linux) または Cmd+Shift+Z (Mac)
    if (
      ((event.ctrlKey || event.metaKey) && event.key === 'y') ||
      ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z')
    ) {
      event.preventDefault()
      redo()
      return
    }
  }, [undo, redo])

  // 自動保存機能（将来の拡張用）
  const enableAutoSaveFeature = useCallback(() => {
    if (!enableAutoSave) return

    const interval = setInterval(() => {
      // LocalStorageへの保存やAPIへの送信など
      console.log('Auto-saving...', textRef.current)
    }, config?.autoSaveInterval || 30000)

    return () => clearInterval(interval)
  }, [enableAutoSave, config?.autoSaveInterval])

  // キーボードイベントの登録/解除とauto-save setup
  const setupEventListeners = useCallback(() => {
    document.addEventListener('keydown', handleKeyDown)
    const cleanupAutoSave = enableAutoSaveFeature()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (cleanupAutoSave) cleanupAutoSave()
    }
  }, [handleKeyDown, enableAutoSaveFeature])

  return {
    text,
    setText,
    insertText,
    deleteText,
    replaceText,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    historyStats,
    historyList,
    jumpToHistoryPoint,
    // 内部使用のための追加プロパティ
    _internal: {
      commandContext,
      registerUpdateCallback,
      setupEventListeners,
      getCurrentCursorPosition: () => cursorPositionRef.current,
      getCurrentSelection: () => selectionRef.current
    }
  } as UseCommandHistoryReturn & {
    _internal: {
      commandContext: CommandContext
      registerUpdateCallback: (callback: (text: string) => void) => () => void
      setupEventListeners: () => () => void
      getCurrentCursorPosition: () => number
      getCurrentSelection: () => { start: number; end: number } | null
    }
  }
}
