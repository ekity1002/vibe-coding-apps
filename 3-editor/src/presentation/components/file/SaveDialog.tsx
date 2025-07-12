/**
 * 保存ダイアログコンポーネント
 * 
 * ファイル保存時の詳細設定を行うダイアログ
 * Factory Patternと統合したファイル作成・保存機能
 * 
 * Design Patterns:
 * - Strategy Pattern: 保存モード（新規作成・上書き・名前を付けて保存）の切り替え
 * - Command Pattern: 保存操作のコマンド化
 * - Observer Pattern: 保存操作の通知
 * - Facade Pattern: 複雑な保存ロジックの統一インターフェース
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { FileServiceManager, type FileOperationObserver, type FileOperationNotification } from '../../../application/services/FileService'
import type { FileType, FileCreationOptions, FileMetadata } from '../../../domain/file/types/FileTypes'
import { Button } from '../../shared/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/card'
import { cn } from '../../../shared/utils/cn'

/**
 * 保存ダイアログのプロパティ
 */
interface SaveDialogProps {
  /** ダイアログの表示状態 */
  isOpen: boolean
  /** ダイアログを閉じる際のコールバック */
  onClose: () => void
  /** 保存する内容 */
  content: string
  /** 現在のファイル情報（編集中の場合） */
  currentFile?: {
    id: string
    name: string
    type: FileType
  }
  /** 保存完了時のコールバック */
  onSaveComplete?: (fileId: string, fileName: string, fileType: FileType) => void
  /** 初期ファイル名 */
  defaultFileName?: string
  /** 初期ファイル形式 */
  defaultFileType?: FileType
}

/**
 * 保存モードの種類
 */
type SaveMode = 'create' | 'overwrite' | 'saveAs'

/**
 * 保存モードの設定
 */
interface SaveModeConfig {
  label: string
  description: string
  icon: string
  buttonText: string
  buttonVariant: 'default' | 'destructive' | 'outline'
}

/**
 * ファイル名バリデーション結果
 */
interface FileNameValidation {
  isValid: boolean
  error?: string
  warning?: string
}

/**
 * 操作ステータス
 */
interface OperationStatus {
  isLoading: boolean
  message: string
  type: 'success' | 'error' | 'info' | null
}

/**
 * 保存ダイアログコンポーネント
 * 
 * Strategy Patternで保存モードを管理し、
 * Factory Patternでファイル作成を実行
 */
export const SaveDialog: React.FC<SaveDialogProps> = ({
  isOpen,
  onClose,
  content,
  currentFile,
  onSaveComplete,
  defaultFileName = '',
  defaultFileType = 'txt'
}) => {
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState<FileType>(defaultFileType)
  const [saveMode, setSaveMode] = useState<SaveMode>('create')
  const [operationStatus, setOperationStatus] = useState<OperationStatus>({
    isLoading: false,
    message: '',
    type: null
  })
  const [existingFiles, setExistingFiles] = useState<FileMetadata[]>([])
  const [fileService] = useState(() => FileServiceManager.getInstance())

  // 保存モード設定
  const saveModeConfigs: Record<SaveMode, SaveModeConfig> = {
    create: {
      label: '新規作成',
      description: '新しいファイルとして保存',
      icon: '📄',
      buttonText: '新規保存',
      buttonVariant: 'default'
    },
    overwrite: {
      label: '上書き保存',
      description: '既存のファイルを上書き',
      icon: '💾',
      buttonText: '上書き保存',
      buttonVariant: 'default'
    },
    saveAs: {
      label: '名前を付けて保存',
      description: '新しい名前で保存',
      icon: '📝',
      buttonText: '別名保存',
      buttonVariant: 'outline'
    }
  }

  // ファイル形式別のアイコンと説明
  const fileTypeInfo = {
    txt: { icon: '📄', label: 'テキストファイル', extension: '.txt', description: 'プレーンテキスト形式' },
    md: { icon: '📝', label: 'Markdownファイル', extension: '.md', description: 'Markdown記法対応' },
    json: { icon: '🔧', label: 'JSONファイル', extension: '.json', description: 'JSON構造化データ' }
  }

  // ダイアログ初期化
  useEffect(() => {
    if (isOpen) {
      // 初期値の設定
      if (currentFile) {
        setFileName(currentFile.name)
        setFileType(currentFile.type)
        setSaveMode('overwrite')
      } else {
        setFileName(defaultFileName || generateDefaultFileName(defaultFileType))
        setFileType(defaultFileType)
        setSaveMode('create')
      }

      // 既存ファイル一覧の取得
      loadExistingFiles()

      // 操作ステータスのリセット
      setOperationStatus({ isLoading: false, message: '', type: null })
    }
  }, [isOpen, currentFile, defaultFileName, defaultFileType])

  // デフォルトファイル名の生成
  const generateDefaultFileName = useCallback((type: FileType) => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '_')
    return `untitled_${timestamp}.${type}`
  }, [])

  // 既存ファイル一覧の読み込み
  const loadExistingFiles = useCallback(async () => {
    try {
      const files = await fileService.listAllFiles()
      setExistingFiles(files)
    } catch (error) {
      console.error('Failed to load existing files:', error)
    }
  }, [fileService])

  // Observer Patternでファイル操作を監視
  useEffect(() => {
    if (!isOpen) return

    const observer: FileOperationObserver = {
      onFileOperation: (notification: FileOperationNotification) => {
        setOperationStatus({
          isLoading: false,
          message: notification.success 
            ? `${getOperationMessage(notification.operation)}が完了しました`
            : `${getOperationMessage(notification.operation)}に失敗しました: ${notification.details || ''}`,
          type: notification.success ? 'success' : 'error'
        })

        if (notification.success && (notification.operation === 'create' || notification.operation === 'save')) {
          // 保存成功時はダイアログを閉じて結果を通知
          setTimeout(() => {
            onSaveComplete?.(
              notification.file.id,
              notification.file.name,
              notification.file.type
            )
            onClose()
          }, 1000)
        }
      }
    }

    fileService.addObserver(observer)
    return () => fileService.removeObserver(observer)
  }, [isOpen, fileService, onSaveComplete, onClose])

  /**
   * 操作名を日本語メッセージに変換
   */
  const getOperationMessage = (operation: string): string => {
    const messages = {
      create: 'ファイル作成',
      save: 'ファイル保存',
      update: 'ファイル更新'
    }
    return messages[operation as keyof typeof messages] || operation
  }

  // ファイル名のバリデーション
  const fileNameValidation = useMemo((): FileNameValidation => {
    if (!fileName.trim()) {
      return { isValid: false, error: 'ファイル名は必須です' }
    }

    // 不正文字チェック
    const invalidChars = /[<>:"/\\|?*]/
    if (invalidChars.test(fileName)) {
      return { isValid: false, error: 'ファイル名に使用できない文字が含まれています' }
    }

    // 長さチェック
    if (fileName.length > 255) {
      return { isValid: false, error: 'ファイル名が長すぎます（255文字以内）' }
    }

    // 拡張子チェック
    const expectedExtension = fileTypeInfo[fileType].extension
    if (!fileName.endsWith(expectedExtension)) {
      return { 
        isValid: true, 
        warning: `拡張子 ${expectedExtension} が推奨されます` 
      }
    }

    // 重複チェック
    const isDuplicate = existingFiles.some(file => 
      file.name === fileName && 
      (saveMode === 'create' || (currentFile && file.id !== currentFile.id))
    )

    if (isDuplicate && saveMode === 'create') {
      return { 
        isValid: true, 
        warning: '同名のファイルが存在します。上書きされます。' 
      }
    }

    return { isValid: true }
  }, [fileName, fileType, existingFiles, saveMode, currentFile])

  // 保存可能かどうかの判定
  const canSave = useMemo(() => {
    return fileNameValidation.isValid && 
           fileName.trim().length > 0 && 
           content.trim().length > 0 &&
           !operationStatus.isLoading
  }, [fileNameValidation, fileName, content, operationStatus])

  // 保存モードの自動判定
  useEffect(() => {
    if (!fileName.trim()) return

    const existingFile = existingFiles.find(file => file.name === fileName)
    
    if (currentFile && existingFile && existingFile.id === currentFile.id) {
      setSaveMode('overwrite')
    } else if (existingFile) {
      setSaveMode('saveAs')
    } else {
      setSaveMode('create')
    }
  }, [fileName, existingFiles, currentFile])

  // 保存実行
  const handleSave = useCallback(async () => {
    if (!canSave) return

    setOperationStatus({ isLoading: true, message: '保存中...', type: 'info' })

    try {
      // ファイル名の正規化（拡張子の自動追加）
      let finalFileName = fileName
      const expectedExtension = fileTypeInfo[fileType].extension
      if (!finalFileName.endsWith(expectedExtension)) {
        finalFileName += expectedExtension
      }

      const options: FileCreationOptions = {
        name: finalFileName,
        content: content.trim()
      }

      let result

      switch (saveMode) {
        case 'create':
        case 'saveAs':
          // 新規作成
          result = await fileService.createFile(fileType, options)
          break

        case 'overwrite':
          // 上書き保存
          if (currentFile) {
            result = await fileService.updateFileContent(currentFile.id, content.trim())
            
            // ファイル名が変更された場合はリネーム
            if (finalFileName !== currentFile.name) {
              const renameResult = await fileService.renameFile(currentFile.id, finalFileName)
              if (!renameResult.success) {
                setOperationStatus({
                  isLoading: false,
                  message: `ファイル名の変更に失敗しました: ${renameResult.error}`,
                  type: 'error'
                })
                return
              }
            }
          } else {
            // currentFileが無い場合は新規作成
            result = await fileService.createFile(fileType, options)
          }
          break
      }

      if (!result?.success) {
        setOperationStatus({
          isLoading: false,
          message: `保存に失敗しました: ${result?.error || 'Unknown error'}`,
          type: 'error'
        })
      }

    } catch (error) {
      setOperationStatus({
        isLoading: false,
        message: `保存中にエラーが発生しました: ${error}`,
        type: 'error'
      })
    }
  }, [canSave, fileName, fileType, content, saveMode, currentFile, fileService])

  // ダイアログが閉じている場合は何も表示しない
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">💾 ファイルを保存</CardTitle>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              disabled={operationStatus.isLoading}
            >
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* ファイル名入力 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">ファイル名</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="ファイル名を入力..."
              disabled={operationStatus.isLoading}
              className={cn(
                "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2",
                fileNameValidation.isValid 
                  ? "border-gray-300 focus:ring-blue-500"
                  : "border-red-300 focus:ring-red-500"
              )}
            />
            {!fileNameValidation.isValid && (
              <p className="text-sm text-red-600">{fileNameValidation.error}</p>
            )}
            {fileNameValidation.isValid && fileNameValidation.warning && (
              <p className="text-sm text-yellow-600">{fileNameValidation.warning}</p>
            )}
          </div>

          {/* ファイル形式選択 */}
          <div className="space-y-3">
            <label className="text-sm font-medium">ファイル形式</label>
            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(fileTypeInfo) as FileType[]).map(type => (
                <label
                  key={type}
                  className={cn(
                    "flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors",
                    fileType === type 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <input
                    type="radio"
                    value={type}
                    checked={fileType === type}
                    onChange={(e) => setFileType(e.target.value as FileType)}
                    disabled={operationStatus.isLoading}
                    className="sr-only"
                  />
                  <span className="text-2xl">{fileTypeInfo[type].icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{fileTypeInfo[type].label}</div>
                    <div className="text-sm text-gray-500">{fileTypeInfo[type].description}</div>
                  </div>
                  <span className="text-sm text-gray-400">{fileTypeInfo[type].extension}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 保存モード表示 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">保存モード</label>
            <div className={cn(
              "flex items-center space-x-3 p-3 border rounded-lg",
              saveMode === 'overwrite' ? "border-orange-200 bg-orange-50" :
              saveMode === 'saveAs' ? "border-yellow-200 bg-yellow-50" :
              "border-green-200 bg-green-50"
            )}>
              <span className="text-2xl">{saveModeConfigs[saveMode].icon}</span>
              <div className="flex-1">
                <div className="font-medium">{saveModeConfigs[saveMode].label}</div>
                <div className="text-sm text-gray-600">{saveModeConfigs[saveMode].description}</div>
              </div>
            </div>
          </div>

          {/* 内容プレビュー */}
          <div className="space-y-2">
            <label className="text-sm font-medium">内容プレビュー</label>
            <div className="p-3 border rounded-lg bg-gray-50 max-h-32 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {content.trim().substring(0, 200)}{content.trim().length > 200 ? '...' : ''}
              </pre>
            </div>
            <div className="text-xs text-gray-500">
              {content.trim().length} 文字
            </div>
          </div>

          {/* ステータスメッセージ */}
          {operationStatus.message && (
            <div className={cn(
              'p-3 rounded-md text-sm',
              operationStatus.type === 'success' && 'bg-green-100 text-green-800',
              operationStatus.type === 'error' && 'bg-red-100 text-red-800',
              operationStatus.type === 'info' && 'bg-blue-100 text-blue-800'
            )}>
              {operationStatus.message}
            </div>
          )}

          {/* 操作ボタン */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={operationStatus.isLoading}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSave}
              variant={saveModeConfigs[saveMode].buttonVariant}
              disabled={!canSave}
              className="min-w-[120px]"
            >
              {operationStatus.isLoading ? (
                <span className="flex items-center space-x-2">
                  <span className="animate-spin">⏳</span>
                  <span>保存中...</span>
                </span>
              ) : (
                saveModeConfigs[saveMode].buttonText
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * 保存ダイアログの便利フック
 * 
 * ダイアログの状態管理を簡素化
 */
export const useSaveDialog = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [saveContext, setSaveContext] = useState<{
    content: string
    currentFile?: {
      id: string
      name: string
      type: FileType
    }
    defaultFileName?: string
    defaultFileType?: FileType
  }>({
    content: ''
  })

  const openSaveDialog = useCallback((
    content: string,
    options?: {
      currentFile?: { id: string; name: string; type: FileType }
      defaultFileName?: string
      defaultFileType?: FileType
    }
  ) => {
    setSaveContext({
      content,
      currentFile: options?.currentFile,
      defaultFileName: options?.defaultFileName,
      defaultFileType: options?.defaultFileType || 'txt'
    })
    setIsOpen(true)
  }, [])

  const closeSaveDialog = useCallback(() => {
    setIsOpen(false)
  }, [])

  return {
    isOpen,
    saveContext,
    openSaveDialog,
    closeSaveDialog
  }
}