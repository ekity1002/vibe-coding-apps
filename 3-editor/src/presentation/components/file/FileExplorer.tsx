/**
 * ファイルエクスプローラーコンポーネント
 * 
 * ファイル一覧表示・管理のためのUIコンポーネント
 * Factory PatternとObserver Patternを活用したファイル操作インターフェース
 * 
 * Design Patterns:
 * - Observer Pattern: ファイル操作の通知を受信
 * - Command Pattern: ファイル操作をコマンドとして抽象化
 * - Strategy Pattern: 表示モード（リスト・グリッド）の切り替え
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { FileServiceManager, type FileOperationObserver, type FileOperationNotification } from '../../../application/services/FileService'
import type { FileType, FileMetadata, FileSearchCriteria, FilePreview } from '../../../domain/file/types/FileTypes'
import { Button } from '../../shared/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/card'
import { cn } from '../../../shared/utils/cn'

/**
 * ファイルエクスプローラーのプロパティ
 */
interface FileExplorerProps {
  /** ファイル選択時のコールバック */
  onFileSelect?: (fileId: string, fileName: string, content: string) => void
  /** ファイル削除時のコールバック */
  onFileDelete?: (fileId: string, fileName: string) => void
  /** 表示モード */
  displayMode?: 'list' | 'grid'
  /** 最大表示ファイル数 */
  maxFiles?: number
  /** 追加のCSSクラス */
  className?: string
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
 * ファイルフィルター設定
 */
interface FileFilter {
  types: FileType[]
  namePattern: string
  sortBy: 'name' | 'date' | 'size' | 'type'
  sortOrder: 'asc' | 'desc'
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
 * ファイルエクスプローラーコンポーネント
 * 
 * Repository Pattern経由でファイル一覧を取得し、
 * Observer Patternでリアルタイム更新を実現
 */
export const FileExplorer: React.FC<FileExplorerProps> = ({
  onFileSelect,
  onFileDelete,
  displayMode = 'list',
  maxFiles = 50,
  className
}) => {
  const [files, setFiles] = useState<FilePreview[]>([])
  const [filteredFiles, setFilteredFiles] = useState<FilePreview[]>([])
  const [currentDisplayMode, setCurrentDisplayMode] = useState<'list' | 'grid'>(displayMode)
  const [operationStatus, setOperationStatus] = useState<OperationStatus>({
    isLoading: false,
    message: '',
    type: null
  })
  const [filter, setFilter] = useState<FileFilter>({
    types: ['txt', 'md', 'json'],
    namePattern: '',
    sortBy: 'date',
    sortOrder: 'desc'
  })
  const [fileService] = useState(() => FileServiceManager.getInstance())

  // 表示モード設定
  const displayModeConfigs: Record<'list' | 'grid', DisplayModeConfig> = {
    list: { icon: '📋', label: 'リスト表示', className: 'space-y-2' },
    grid: { icon: '🔲', label: 'グリッド表示', className: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3' }
  }

  // ファイル形式別のアイコン
  const getFileIcon = useCallback((fileType: FileType): string => {
    const icons = {
      txt: '📄',
      md: '📝',
      json: '🔧'
    }
    return icons[fileType]
  }, [])

  // ファイル一覧の初期読み込み
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

  // Observer Patternでファイル操作を監視
  useEffect(() => {
    const observer: FileOperationObserver = {
      onFileOperation: (notification: FileOperationNotification) => {
        // ファイル操作に応じてリストを更新
        if (notification.success && (
          notification.operation === 'create' ||
          notification.operation === 'save' ||
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
    loadFiles() // 初期読み込み

    return () => {
      fileService.removeObserver(observer)
    }
  }, [fileService, loadFiles])

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
      // ファイル形式フィルタ
      if (!filter.types.includes(file.metadata.type)) {
        return false
      }

      // ファイル名パターンフィルタ
      if (filter.namePattern && !file.metadata.name.toLowerCase().includes(filter.namePattern.toLowerCase())) {
        return false
      }

      return true
    })

    // ソート
    result.sort((a, b) => {
      let compareValue = 0

      switch (filter.sortBy) {
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

      return filter.sortOrder === 'asc' ? compareValue : -compareValue
    })

    return result
  }, [files, filter])

  // ファイルを開く
  const handleFileOpen = useCallback(async (file: FilePreview) => {
    setOperationStatus({ isLoading: true, message: 'ファイルを読み込み中...', type: 'info' })

    try {
      const result = await fileService.loadFile(file.metadata.id)
      
      if (result.success && result.fileEntity) {
        onFileSelect?.(
          file.metadata.id,
          file.metadata.name,
          result.fileEntity.getContent()
        )
        setOperationStatus({ isLoading: false, message: '', type: null })
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
  }, [fileService, onFileSelect])

  // ファイルを削除
  const handleFileDelete = useCallback(async (file: FilePreview) => {
    if (!confirm(`「${file.metadata.name}」を削除しますか？この操作は取り消せません。`)) {
      return
    }

    setOperationStatus({ isLoading: true, message: 'ファイルを削除中...', type: 'info' })

    try {
      const result = await fileService.deleteFile(file.metadata.id)
      
      if (result.success) {
        onFileDelete?.(file.metadata.id, file.metadata.name)
        setOperationStatus({ isLoading: false, message: '', type: null })
      } else {
        setOperationStatus({
          isLoading: false,
          message: `ファイルの削除に失敗しました: ${result.error}`,
          type: 'error'
        })
      }
    } catch (error) {
      setOperationStatus({
        isLoading: false,
        message: `ファイルの削除中にエラーが発生しました: ${error}`,
        type: 'error'
      })
    }
  }, [fileService, onFileDelete])

  // ファイル形式の切り替え
  const handleTypeFilter = useCallback((type: FileType) => {
    setFilter(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }))
  }, [])

  // ファイルカードの描画
  const renderFileCard = useCallback((file: FilePreview, index: number) => {
    const isListMode = currentDisplayMode === 'list'
    
    return (
      <Card 
        key={file.metadata.id}
        className={cn(
          'transition-all duration-200 hover:shadow-md cursor-pointer',
          isListMode ? 'p-3' : 'p-2'
        )}
        onClick={() => handleFileOpen(file)}
      >
        <CardContent className={cn('p-0', isListMode ? 'flex items-center space-x-3' : 'text-center')}>
          {/* ファイルアイコン */}
          <div className={cn(
            'flex-shrink-0',
            isListMode ? 'text-2xl' : 'text-3xl mb-2'
          )}>
            {getFileIcon(file.metadata.type)}
          </div>

          {/* ファイル情報 */}
          <div className={cn('min-w-0 flex-1', isListMode ? '' : 'space-y-1')}>
            <div className={cn(
              'font-medium truncate',
              isListMode ? 'text-sm' : 'text-xs'
            )}>
              {file.metadata.name}
            </div>
            
            {isListMode && (
              <div className="text-xs text-gray-500 truncate">
                {file.preview}
              </div>
            )}
            
            <div className={cn(
              'text-gray-400 flex',
              isListMode ? 'text-xs space-x-2' : 'text-xs justify-center space-x-1'
            )}>
              <span>{file.metadata.type.toUpperCase()}</span>
              <span>•</span>
              <span>{file.metadata.size}文字</span>
              <span>•</span>
              <span>{new Date(file.metadata.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* 削除ボタン */}
          <Button
            onClick={(e) => {
              e.stopPropagation()
              handleFileDelete(file)
            }}
            variant="ghost"
            size="sm"
            className={cn(
              'text-red-500 hover:text-red-700 hover:bg-red-50',
              isListMode ? 'flex-shrink-0' : 'absolute top-1 right-1 w-6 h-6 p-0'
            )}
            disabled={operationStatus.isLoading}
          >
            🗑️
          </Button>
        </CardContent>
      </Card>
    )
  }, [currentDisplayMode, getFileIcon, handleFileOpen, handleFileDelete, operationStatus.isLoading])

  return (
    <div className={cn('space-y-4', className)}>
      {/* ヘッダー */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">📂 ファイル一覧</CardTitle>
          <div className="flex items-center space-x-2">
            {/* 表示モード切り替え */}
            <Button
              onClick={() => setCurrentDisplayMode(currentDisplayMode === 'list' ? 'grid' : 'list')}
              variant="outline"
              size="sm"
              disabled={operationStatus.isLoading}
            >
              {displayModeConfigs[currentDisplayMode === 'list' ? 'grid' : 'list'].icon}
              {displayModeConfigs[currentDisplayMode === 'list' ? 'grid' : 'list'].label}
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
          </div>
        </div>
      </CardHeader>

      {/* フィルター・検索バー */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {/* 検索ボックス */}
          <div>
            <input
              type="text"
              placeholder="ファイル名で検索..."
              value={filter.namePattern}
              onChange={(e) => setFilter(prev => ({ ...prev, namePattern: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={operationStatus.isLoading}
            />
          </div>

          {/* ファイル形式フィルター */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">形式:</span>
            {(['txt', 'md', 'json'] as FileType[]).map(type => (
              <label key={type} className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filter.types.includes(type)}
                  onChange={() => handleTypeFilter(type)}
                  disabled={operationStatus.isLoading}
                  className="rounded"
                />
                <span className="text-sm">{getFileIcon(type)} {type.toUpperCase()}</span>
              </label>
            ))}
          </div>

          {/* ソート設定 */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">並び順:</span>
            <select
              value={filter.sortBy}
              onChange={(e) => setFilter(prev => ({ ...prev, sortBy: e.target.value as any }))}
              disabled={operationStatus.isLoading}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="date">更新日時</option>
              <option value="name">ファイル名</option>
              <option value="size">サイズ</option>
              <option value="type">形式</option>
            </select>
            <button
              onClick={() => setFilter(prev => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))}
              disabled={operationStatus.isLoading}
              className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              {filter.sortOrder === 'asc' ? '↑ 昇順' : '↓ 降順'}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ファイル一覧 */}
      <Card>
        <CardContent className="p-4">
          {operationStatus.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-gray-500">読み込み中...</span>
            </div>
          ) : filteredAndSortedFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {files.length === 0 ? 'ファイルがありません' : '条件に一致するファイルがありません'}
            </div>
          ) : (
            <div className={displayModeConfigs[currentDisplayMode].className}>
              {filteredAndSortedFiles.map((file, index) => renderFileCard(file, index))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ステータスメッセージ */}
      {operationStatus.message && (
        <div className={cn(
          'fixed bottom-4 right-4 px-4 py-2 rounded-md text-sm z-50 shadow-lg',
          operationStatus.type === 'success' && 'bg-green-100 text-green-800 border border-green-200',
          operationStatus.type === 'error' && 'bg-red-100 text-red-800 border border-red-200',
          operationStatus.type === 'info' && 'bg-blue-100 text-blue-800 border border-blue-200'
        )}>
          {operationStatus.message}
        </div>
      )}

      {/* ファイル統計情報 */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>表示中: {filteredAndSortedFiles.length}件</span>
            <span>総ファイル数: {files.length}件</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * ファイルエクスプローラーの便利フック
 * 
 * ファイル選択状態とエクスプローラーの統合管理
 */
export const useFileExplorer = () => {
  const [selectedFile, setSelectedFile] = useState<{
    id: string
    name: string
    content: string
  } | null>(null)

  const handleFileSelect = useCallback((fileId: string, fileName: string, content: string) => {
    setSelectedFile({ id: fileId, name: fileName, content })
  }, [])

  const handleFileDelete = useCallback((fileId: string, fileName: string) => {
    // 削除されたファイルが選択中の場合はクリア
    setSelectedFile(prev => 
      prev && prev.id === fileId ? null : prev
    )
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedFile(null)
  }, [])

  return {
    selectedFile,
    setSelectedFile,
    handleFileSelect,
    handleFileDelete,
    clearSelection
  }
}