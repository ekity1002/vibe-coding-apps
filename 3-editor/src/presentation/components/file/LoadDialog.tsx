/**
 * 読み込みダイアログコンポーネント
 * 
 * ファイル読み込み時の選択・プレビュー機能を提供するダイアログ
 * Repository PatternとObserver Patternを活用したファイル選択インターフェース
 * 
 * Design Patterns:
 * - Strategy Pattern: 表示モード（リスト・カード）とソート方法の切り替え
 * - Command Pattern: 読み込み操作のコマンド化
 * - Observer Pattern: ファイル操作の通知
 * - Template Method Pattern: ファイルプレビューの統一処理
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { FileServiceManager, type FileOperationObserver, type FileOperationNotification } from '../../../application/services/FileService'
import type { FileType, FileMetadata, FilePreview, FileSearchCriteria } from '../../../domain/file/types/FileTypes'
import { Button } from '../../shared/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/card'
import { cn } from '../../../shared/utils/cn'

/**
 * 読み込みダイアログのプロパティ
 */
interface LoadDialogProps {
  /** ダイアログの表示状態 */
  isOpen: boolean
  /** ダイアログを閉じる際のコールバック */
  onClose: () => void
  /** ファイル選択時のコールバック */
  onFileSelect?: (fileId: string, fileName: string, content: string, fileType: FileType) => void
  /** 表示モード */
  defaultDisplayMode?: 'list' | 'card'
  /** フィルタ可能なファイル形式 */
  allowedTypes?: FileType[]
  /** 最大表示ファイル数 */
  maxFiles?: number
}

/**
 * 表示モードの設定
 */
interface DisplayModeConfig {
  icon: string
  label: string
  className: string
}

/**
 * ソート設定
 */
interface SortConfig {
  field: 'name' | 'date' | 'size' | 'type'
  order: 'asc' | 'desc'
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
 * 読み込みダイアログコンポーネント
 * 
 * Strategy Patternで表示モードを管理し、
 * Repository Patternでファイル一覧を取得
 */
export const LoadDialog: React.FC<LoadDialogProps> = ({
  isOpen,
  onClose,
  onFileSelect,
  defaultDisplayMode = 'list',
  allowedTypes = ['txt', 'md', 'json'],
  maxFiles = 50
}) => {
  const [files, setFiles] = useState<FilePreview[]>([])
  const [filteredFiles, setFilteredFiles] = useState<FilePreview[]>([])
  const [selectedFile, setSelectedFile] = useState<FilePreview | null>(null)
  const [displayMode, setDisplayMode] = useState<'list' | 'card'>(defaultDisplayMode)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<FileType[]>(allowedTypes)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'date', order: 'desc' })
  const [operationStatus, setOperationStatus] = useState<OperationStatus>({
    isLoading: false,
    message: '',
    type: null
  })
  const [fileService] = useState(() => FileServiceManager.getInstance())

  // 表示モード設定
  const displayModeConfigs: Record<'list' | 'card', DisplayModeConfig> = {
    list: { 
      icon: '📋', 
      label: 'リスト表示', 
      className: 'space-y-2' 
    },
    card: { 
      icon: '🔲', 
      label: 'カード表示', 
      className: 'grid grid-cols-1 md:grid-cols-2 gap-3' 
    }
  }

  // ファイル形式別の情報
  const fileTypeInfo = {
    txt: { icon: '📄', label: 'テキスト', color: 'text-blue-600' },
    md: { icon: '📝', label: 'Markdown', color: 'text-green-600' },
    json: { icon: '🔧', label: 'JSON', color: 'text-purple-600' }
  }

  // ファイル一覧の読み込み
  const loadFiles = useCallback(async () => {
    setOperationStatus({ isLoading: true, message: 'ファイル一覧を読み込み中...', type: 'info' })

    try {
      const fileList = await fileService.getFilePreviewList(maxFiles)
      setFiles(fileList)
      setOperationStatus({ isLoading: false, message: '', type: null })
    } catch (error) {
      setOperationStatus({
        isLoading: false,
        message: `ファイル一覧の読み込みに失敗しました: ${error}`,
        type: 'error'
      })
    }
  }, [fileService, maxFiles])

  // ダイアログ初期化
  useEffect(() => {
    if (isOpen) {
      loadFiles()
      setSelectedFile(null)
      setSearchQuery('')
      setOperationStatus({ isLoading: false, message: '', type: null })
    }
  }, [isOpen, loadFiles])

  // Observer Patternでファイル操作を監視
  useEffect(() => {
    if (!isOpen) return

    const observer: FileOperationObserver = {
      onFileOperation: (notification: FileOperationNotification) => {
        // ファイル一覧に影響する操作の場合は再読み込み
        if (notification.success && (
          notification.operation === 'create' ||
          notification.operation === 'delete' ||
          notification.operation === 'update'
        )) {
          loadFiles()
        }

        // ステータスメッセージの表示
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
    return () => fileService.removeObserver(observer)
  }, [isOpen, fileService, loadFiles])

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

  // ファイルのフィルタリングとソート
  const filteredAndSortedFiles = useMemo(() => {
    let result = files.filter(file => {
      // 許可されたファイル形式フィルタ
      if (!allowedTypes.includes(file.metadata.type)) {
        return false
      }

      // ユーザー選択のファイル形式フィルタ
      if (!typeFilter.includes(file.metadata.type)) {
        return false
      }

      // 検索クエリフィルタ
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const nameMatch = file.metadata.name.toLowerCase().includes(query)
        const previewMatch = file.preview.toLowerCase().includes(query)
        if (!nameMatch && !previewMatch) {
          return false
        }
      }

      return true
    })

    // ソート
    result.sort((a, b) => {
      let compareValue = 0

      switch (sortConfig.field) {
        case 'name':
          compareValue = a.metadata.name.localeCompare(b.metadata.name)
          break
        case 'date':
          compareValue = new Date(a.metadata.updatedAt).getTime() - new Date(b.metadata.updatedAt).getTime()
          break
        case 'size':
          compareValue = a.metadata.size - b.metadata.size
          break
        case 'type':
          compareValue = a.metadata.type.localeCompare(b.metadata.type)
          break
      }

      return sortConfig.order === 'asc' ? compareValue : -compareValue
    })

    return result
  }, [files, allowedTypes, typeFilter, searchQuery, sortConfig])

  // ファイル選択の処理
  const handleFileSelect = useCallback((file: FilePreview) => {
    setSelectedFile(file)
  }, [])

  // ファイル読み込みの実行
  const handleLoadFile = useCallback(async (file: FilePreview) => {
    setOperationStatus({ isLoading: true, message: 'ファイルを読み込み中...', type: 'info' })

    try {
      const result = await fileService.loadFile(file.metadata.id)
      
      if (result.success && result.fileEntity) {
        onFileSelect?.(
          file.metadata.id,
          file.metadata.name,
          result.fileEntity.getContent(),
          file.metadata.type
        )
        
        setOperationStatus({
          isLoading: false,
          message: 'ファイルの読み込みが完了しました',
          type: 'success'
        })

        // 1秒後にダイアログを閉じる
        setTimeout(() => {
          onClose()
        }, 1000)
      } else {
        setOperationStatus({
          isLoading: false,
          message: `ファイルの読み込みに失敗しました: ${result.error}`,
          type: 'error'
        })
      }
    } catch (error) {
      setOperationStatus({
        isLoading: false,
        message: `ファイルの読み込み中にエラーが発生しました: ${error}`,
        type: 'error'
      })
    }
  }, [fileService, onFileSelect, onClose])

  // ファイル形式フィルターの切り替え
  const handleTypeFilterToggle = useCallback((type: FileType) => {
    setTypeFilter(prev => 
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }, [])

  // ソート設定の変更
  const handleSortChange = useCallback((field: SortConfig['field']) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  // ファイルアイテムの描画
  const renderFileItem = useCallback((file: FilePreview, index: number) => {
    const isSelected = selectedFile?.metadata.id === file.metadata.id
    const isListMode = displayMode === 'list'
    
    return (
      <Card 
        key={file.metadata.id}
        className={cn(
          'transition-all duration-200 cursor-pointer',
          isSelected 
            ? 'ring-2 ring-blue-500 bg-blue-50' 
            : 'hover:shadow-md hover:bg-gray-50',
          isListMode ? 'p-3' : 'p-4'
        )}
        onClick={() => handleFileSelect(file)}
      >
        <CardContent className={cn(
          'p-0',
          isListMode ? 'flex items-center space-x-3' : 'space-y-3'
        )}>
          {/* ファイルアイコンと基本情報 */}
          <div className={cn(
            'flex items-center',
            isListMode ? 'space-x-3 flex-1 min-w-0' : 'space-x-2'
          )}>
            <div className={cn(
              'flex-shrink-0',
              isListMode ? 'text-2xl' : 'text-3xl'
            )}>
              {fileTypeInfo[file.metadata.type].icon}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className={cn(
                'font-medium truncate',
                isListMode ? 'text-sm' : 'text-base'
              )}>
                {file.metadata.name}
              </div>
              
              <div className={cn(
                'text-gray-500 flex items-center space-x-2',
                isListMode ? 'text-xs' : 'text-sm'
              )}>
                <span className={fileTypeInfo[file.metadata.type].color}>
                  {fileTypeInfo[file.metadata.type].label}
                </span>
                <span>•</span>
                <span>{file.metadata.size}文字</span>
                <span>•</span>
                <span>{new Date(file.metadata.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* プレビュー */}
          {!isListMode && (
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border-l-4 border-gray-300">
              <div className="line-clamp-3">
                {file.preview || '（プレビューなし）'}
              </div>
            </div>
          )}

          {/* 読み込みボタン */}
          <div className={cn(
            'flex-shrink-0',
            isListMode ? 'ml-auto' : 'flex justify-end'
          )}>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                handleLoadFile(file)
              }}
              size="sm"
              disabled={operationStatus.isLoading}
              className="min-w-[80px]"
            >
              {operationStatus.isLoading && selectedFile?.metadata.id === file.metadata.id ? (
                <span className="flex items-center space-x-1">
                  <span className="animate-spin">⏳</span>
                  <span>読込中</span>
                </span>
              ) : (
                '📂 開く'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }, [selectedFile, displayMode, operationStatus, handleFileSelect, handleLoadFile])

  // ダイアログが閉じている場合は何も表示しない
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">📂 ファイルを開く</CardTitle>
            <div className="flex items-center space-x-2">
              {/* 表示モード切り替え */}
              <Button
                onClick={() => setDisplayMode(displayMode === 'list' ? 'card' : 'list')}
                variant="outline"
                size="sm"
                disabled={operationStatus.isLoading}
              >
                {displayModeConfigs[displayMode === 'list' ? 'card' : 'list'].icon}
                {displayModeConfigs[displayMode === 'list' ? 'card' : 'list'].label}
              </Button>
              
              {/* 更新ボタン */}
              <Button
                onClick={loadFiles}
                variant="outline"
                size="sm"
                disabled={operationStatus.isLoading}
              >
                {operationStatus.isLoading ? '⏳' : '🔄'} 更新
              </Button>

              {/* 閉じるボタン */}
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                disabled={operationStatus.isLoading}
              >
                ✕
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* フィルター・検索バー */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {/* 検索ボックス */}
              <div>
                <input
                  type="text"
                  placeholder="ファイル名や内容で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={operationStatus.isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                {/* ファイル形式フィルター */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">形式:</span>
                  {allowedTypes.map(type => (
                    <label key={type} className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={typeFilter.includes(type)}
                        onChange={() => handleTypeFilterToggle(type)}
                        disabled={operationStatus.isLoading}
                        className="rounded"
                      />
                      <span className={cn('text-sm', fileTypeInfo[type].color)}>
                        {fileTypeInfo[type].icon} {fileTypeInfo[type].label}
                      </span>
                    </label>
                  ))}
                </div>

                {/* ソート設定 */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">並び順:</span>
                  {(['name', 'date', 'size', 'type'] as const).map(field => (
                    <button
                      key={field}
                      onClick={() => handleSortChange(field)}
                      disabled={operationStatus.isLoading}
                      className={cn(
                        'px-2 py-1 text-sm rounded border transition-colors',
                        sortConfig.field === field
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      {field === 'name' && 'ファイル名'}
                      {field === 'date' && '更新日時'}
                      {field === 'size' && 'サイズ'}
                      {field === 'type' && '形式'}
                      {sortConfig.field === field && (
                        <span className="ml-1">
                          {sortConfig.order === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ファイル一覧 */}
          <Card className="flex-1 overflow-hidden">
            <CardContent className="p-4 h-full overflow-y-auto">
              {operationStatus.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <span className="text-gray-500">読み込み中...</span>
                </div>
              ) : filteredAndSortedFiles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {files.length === 0 ? 'ファイルがありません' : '条件に一致するファイルがありません'}
                </div>
              ) : (
                <div className={displayModeConfigs[displayMode].className}>
                  {filteredAndSortedFiles.map((file, index) => renderFileItem(file, index))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ステータス・統計情報 */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>表示中: {filteredAndSortedFiles.length}件</span>
            <span>総ファイル数: {files.length}件</span>
          </div>
        </CardContent>

        {/* ステータスメッセージ */}
        {operationStatus.message && (
          <div className={cn(
            'mx-4 mb-4 p-3 rounded-md text-sm',
            operationStatus.type === 'success' && 'bg-green-100 text-green-800',
            operationStatus.type === 'error' && 'bg-red-100 text-red-800',
            operationStatus.type === 'info' && 'bg-blue-100 text-blue-800'
          )}>
            {operationStatus.message}
          </div>
        )}
      </Card>
    </div>
  )
}

/**
 * 読み込みダイアログの便利フック
 * 
 * ダイアログの状態管理を簡素化
 */
export const useLoadDialog = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [loadContext, setLoadContext] = useState<{
    allowedTypes?: FileType[]
    defaultDisplayMode?: 'list' | 'card'
    maxFiles?: number
  }>({})

  const openLoadDialog = useCallback((options?: {
    allowedTypes?: FileType[]
    defaultDisplayMode?: 'list' | 'card'
    maxFiles?: number
  }) => {
    setLoadContext(options || {})
    setIsOpen(true)
  }, [])

  const closeLoadDialog = useCallback(() => {
    setIsOpen(false)
  }, [])

  return {
    isOpen,
    loadContext,
    openLoadDialog,
    closeLoadDialog
  }
}