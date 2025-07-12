/**
 * ファイルメニューコンポーネント
 * 
 * Factory Patternとの統合により、ファイル作成・操作のUIを提供
 * Dropdown形式のメニューで直感的なファイル操作を実現
 * 
 * Design Patterns:
 * - Observer Pattern: ファイル操作の通知を受信
 * - Command Pattern: ファイル操作をコマンドとして抽象化（将来拡張用）
 */

import React, { useState, useCallback, useEffect } from 'react'
import { FileServiceManager, type FileOperationObserver, type FileOperationNotification } from '../../../application/services/FileService'
import type { FileType } from '../../../domain/file/types/FileTypes'
import { Button } from '../../shared/button'
import { Card, CardContent } from '../../shared/card'
import { cn } from '../../../shared/utils/cn'

/**
 * ファイルメニューのプロパティ
 */
interface FileMenuProps {
  /** 現在のファイル内容 */
  currentContent?: string
  /** 現在のファイル名 */
  currentFileName?: string
  /** ファイル作成時のコールバック */
  onFileCreated?: (fileId: string, fileName: string, content: string) => void
  /** ファイル読み込み時のコールバック */
  onFileLoaded?: (fileId: string, fileName: string, content: string) => void
  /** ファイル保存時のコールバック */
  onFileSaved?: (fileId: string, fileName: string) => void
  /** 追加のCSSクラス */
  className?: string
}

/**
 * ファイル操作のステータス
 */
interface OperationStatus {
  isLoading: boolean
  message: string
  type: 'success' | 'error' | 'info' | null
}

/**
 * ファイルメニューコンポーネント
 * 
 * Factory Patternで生成されたファイルサービスを使用し、
 * ユーザーフレンドリーなファイル操作インターフェースを提供
 */
export const FileMenu: React.FC<FileMenuProps> = ({
  currentContent = '',
  currentFileName,
  onFileCreated,
  onFileLoaded,
  onFileSaved,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [operationStatus, setOperationStatus] = useState<OperationStatus>({
    isLoading: false,
    message: '',
    type: null
  })
  const [fileService] = useState(() => FileServiceManager.getInstance())

  // Observer Patternでファイル操作を監視
  useEffect(() => {
    const observer: FileOperationObserver = {
      onFileOperation: (notification: FileOperationNotification) => {
        setOperationStatus({
          isLoading: false,
          message: notification.success 
            ? `${getOperationMessage(notification.operation)}が完了しました`
            : `${getOperationMessage(notification.operation)}に失敗しました: ${notification.details || ''}`,
          type: notification.success ? 'success' : 'error'
        })

        // 3秒後にメッセージをクリア
        setTimeout(() => {
          setOperationStatus(prev => ({ ...prev, message: '', type: null }))
        }, 3000)
      }
    }

    fileService.addObserver(observer)

    return () => {
      fileService.removeObserver(observer)
    }
  }, [fileService])

  /**
   * 操作名を日本語メッセージに変換
   */
  const getOperationMessage = (operation: string): string => {
    const messages = {
      create: 'ファイル作成',
      save: 'ファイル保存',
      load: 'ファイル読み込み',
      delete: 'ファイル削除',
      update: 'ファイル更新'
    }
    return messages[operation as keyof typeof messages] || operation
  }

  /**
   * 新しいファイルを作成
   */
  const handleCreateFile = useCallback(async (fileType: FileType) => {
    setOperationStatus({ isLoading: true, message: 'ファイルを作成中...', type: 'info' })
    setIsOpen(false)

    try {
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(2, 8)
      const defaultName = `new_${fileType}_${timestamp}_${randomSuffix}`
      
      const result = await fileService.createFile(fileType, {
        name: `${defaultName}.${fileType}`,
        content: getDefaultContent(fileType)
      })

      if (result.success && result.fileEntity && result.file) {
        onFileCreated?.(
          result.file.id,
          result.file.name,
          result.fileEntity.getContent()
        )
      }

    } catch (error) {
      setOperationStatus({
        isLoading: false,
        message: `ファイル作成中にエラーが発生しました: ${error}`,
        type: 'error'
      })
    }
  }, [fileService, onFileCreated])

  /**
   * ファイル形式別のデフォルト内容を取得
   */
  const getDefaultContent = (fileType: FileType): string => {
    switch (fileType) {
      case 'txt':
        return 'ここにテキストを入力してください。'
      case 'md':
        return '# 新しいドキュメント\n\nここにMarkdownコンテンツを入力してください。'
      case 'json':
        return '{\n  "name": "新しいファイル",\n  "description": "ここに説明を入力"\n}'
      default:
        return ''
    }
  }

  /**
   * 現在の内容を保存
   */
  const handleSaveFile = useCallback(async () => {
    if (!currentFileName) {
      setOperationStatus({
        isLoading: false,
        message: '保存するファイルが選択されていません',
        type: 'error'
      })
      return
    }

    setOperationStatus({ isLoading: true, message: 'ファイルを保存中...', type: 'info' })
    setIsOpen(false)

    try {
      // ファイル名から既存ファイルを検索
      const loadResult = await fileService.loadFileByName(currentFileName)
      
      if (loadResult.success && loadResult.fileEntity) {
        // 既存ファイルの内容を更新
        const updateResult = await fileService.updateFileContent(
          loadResult.fileEntity.getId(),
          currentContent
        )

        if (updateResult.success && updateResult.file) {
          onFileSaved?.(updateResult.file.id, updateResult.file.name)
        }
      } else {
        // 新規ファイルとして保存（ファイル形式を推定）
        const fileType = guessFileType(currentFileName)
        const createResult = await fileService.createFile(fileType, {
          name: currentFileName,
          content: currentContent
        })

        if (createResult.success && createResult.file) {
          onFileSaved?.(createResult.file.id, createResult.file.name)
        }
      }

    } catch (error) {
      setOperationStatus({
        isLoading: false,
        message: `ファイル保存中にエラーが発生しました: ${error}`,
        type: 'error'
      })
    }
  }, [fileService, currentFileName, currentContent, onFileSaved])

  /**
   * ファイル名から形式を推定
   */
  const guessFileType = (fileName: string): FileType => {
    const extension = fileName.toLowerCase().split('.').pop()
    switch (extension) {
      case 'md': case 'markdown': return 'md'
      case 'json': return 'json'
      default: return 'txt'
    }
  }

  /**
   * ファイル名でクイック保存
   */
  const handleQuickSave = useCallback(async () => {
    const fileName = prompt('ファイル名を入力してください:', currentFileName || 'untitled.txt')
    if (!fileName) return

    setOperationStatus({ isLoading: true, message: 'ファイルを保存中...', type: 'info' })

    try {
      const fileType = guessFileType(fileName)
      const result = await fileService.createFile(fileType, {
        name: fileName,
        content: currentContent
      })

      if (result.success && result.file) {
        onFileSaved?.(result.file.id, result.file.name)
      }

    } catch (error) {
      setOperationStatus({
        isLoading: false,
        message: `ファイル保存中にエラーが発生しました: ${error}`,
        type: 'error'
      })
    }
  }, [fileService, currentFileName, currentContent, onFileSaved])

  /**
   * キーボードショートカットの処理
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault()
            if (currentFileName) {
              handleSaveFile()
            } else {
              handleQuickSave()
            }
            break
          case 'n':
            event.preventDefault()
            setIsOpen(true)
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleSaveFile, handleQuickSave, currentFileName])

  /**
   * 外側クリックでメニューを閉じる処理
   */
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-file-menu]')) {
        setIsOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isOpen])

  return (
    <div className={cn('relative', className)} data-file-menu>
      {/* メインメニューボタン */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="relative"
        disabled={operationStatus.isLoading}
        aria-label="ファイルメニューを開く"
        aria-expanded={isOpen}
      >
        📁 ファイル
        {operationStatus.isLoading && (
          <span className="ml-2 animate-spin">⏳</span>
        )}
      </Button>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <Card className="absolute top-full left-0 z-50 mt-2 w-64 shadow-lg" data-file-menu>
          <CardContent className="p-2">
            {/* 新規作成セクション */}
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-700 mb-2">新規作成</div>
              <div className="space-y-1">
                <Button
                  onClick={() => handleCreateFile('txt')}
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  disabled={operationStatus.isLoading}
                >
                  📄 テキストファイル (.txt)
                </Button>
                <Button
                  onClick={() => handleCreateFile('md')}
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  disabled={operationStatus.isLoading}
                >
                  📝 Markdownファイル (.md)
                </Button>
                <Button
                  onClick={() => handleCreateFile('json')}
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  disabled={operationStatus.isLoading}
                >
                  🔧 JSONファイル (.json)
                </Button>
              </div>
            </div>

            <hr className="my-2" />

            {/* ファイル操作セクション */}
            <div className="space-y-1">
              <Button
                onClick={handleSaveFile}
                variant="ghost"
                className="w-full justify-start text-sm"
                disabled={operationStatus.isLoading || !currentContent}
              >
                💾 保存 <span className="ml-auto text-xs text-gray-500">Ctrl+S</span>
              </Button>
              <Button
                onClick={handleQuickSave}
                variant="ghost"
                className="w-full justify-start text-sm"
                disabled={operationStatus.isLoading || !currentContent}
              >
                💾 名前を付けて保存
              </Button>
              <Button
                onClick={() => {
                  setIsOpen(false)
                  // FileExplorerを開く処理（今後実装）
                }}
                variant="ghost"
                className="w-full justify-start text-sm"
                disabled={operationStatus.isLoading}
              >
                📂 ファイルを開く <span className="ml-auto text-xs text-gray-500">Ctrl+O</span>
              </Button>
            </div>

            <hr className="my-2" />

            {/* キーボードショートカット情報 */}
            <div className="text-xs text-gray-500 p-2">
              <div>Ctrl+N: 新規作成メニューを開く</div>
              <div>Ctrl+S: 保存</div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* ステータスメッセージ */}
      {operationStatus.message && (
        <div className={cn(
          'absolute top-full left-0 mt-2 px-3 py-2 rounded-md text-sm z-50',
          operationStatus.type === 'success' && 'bg-green-100 text-green-800 border border-green-200',
          operationStatus.type === 'error' && 'bg-red-100 text-red-800 border border-red-200',
          operationStatus.type === 'info' && 'bg-blue-100 text-blue-800 border border-blue-200'
        )}>
          {operationStatus.message}
        </div>
      )}
    </div>
  )
}

/**
 * ファイルメニューの便利フック
 * 
 * ファイル操作の状態管理を簡素化
 */
export const useFileMenu = () => {
  const [currentFile, setCurrentFile] = useState<{
    id: string
    name: string
    content: string
  } | null>(null)

  const handleFileCreated = useCallback((fileId: string, fileName: string, content: string) => {
    setCurrentFile({ id: fileId, name: fileName, content })
  }, [])

  const handleFileLoaded = useCallback((fileId: string, fileName: string, content: string) => {
    setCurrentFile({ id: fileId, name: fileName, content })
  }, [])

  const handleFileSaved = useCallback((fileId: string, fileName: string) => {
    setCurrentFile(prev => prev ? { ...prev, id: fileId, name: fileName } : null)
  }, [])

  const updateContent = useCallback((newContent: string) => {
    setCurrentFile(prev => prev ? { ...prev, content: newContent } : null)
  }, [])

  return {
    currentFile,
    setCurrentFile,
    handleFileCreated,
    handleFileLoaded,
    handleFileSaved,
    updateContent
  }
}