import { useState, useCallback, useMemo, useEffect } from 'react'
import { Editor } from './presentation/components/editor/Editor'
import { StatusBar } from './presentation/components/editor/StatusBar'
import { LineCounter } from './presentation/components/editor/LineCounter'
import { CharCounter } from './presentation/components/editor/CharCounter'
import { FileMenu } from './presentation/components/file/FileMenu'
import { FileExplorer } from './presentation/components/file/FileExplorer'
import { SaveDialog } from './presentation/components/file/SaveDialog'
import { LoadDialog } from './presentation/components/file/LoadDialog'
import { EditorConfig } from './domain/config/entities/EditorConfig'
import { ConfigObserver } from './domain/observer/services/ConfigObserver'
import { TextService } from './application/services/TextService'
import { FileServiceManager, type FileOperationObserver, type FileOperationNotification } from './application/services/FileService'
import type { FileType } from './domain/file/types/FileTypes'
import { Card, CardContent, CardHeader, CardTitle } from './presentation/shared/card'
import { Button } from './presentation/shared/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './presentation/shared/select'
import { Switch } from './presentation/shared/switch'
import './App.css'

/**
 * メインアプリケーションコンポーネント
 * 
 * 実装済みデザインパターン:
 * - Singleton Pattern: EditorConfig による設定管理
 * - Composition Pattern: Editor、TextService、UI コンポーネントの組み合わせ
 * - Observer Pattern: エディタ設定変更の監視とリアルタイム更新
 * - Command Pattern: テキスト操作の履歴管理（CommandEditor使用時）
 * - Factory Pattern: ファイル作成・管理システム（Phase 4）
 * - Repository Pattern: ファイルデータの永続化管理
 * - Facade Pattern: 複雑なファイル操作の統一インターフェース
 */
function App() {
  const [text, setText] = useState('')
  const [currentLine, setCurrentLine] = useState(1)
  const [currentColumn, setCurrentColumn] = useState(1)
  const [selectedText] = useState<string | undefined>()
  
  // ファイル管理状態（Phase 4 Factory Pattern）
  const [currentFile, setCurrentFile] = useState<{
    id: string
    name: string
    type: FileType
  } | null>(null)
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(false)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false)
  const [fileOperationStatus, setFileOperationStatus] = useState<string>('')
  
  // 設定値を個別に管理してReactの再レンダリングを確実にする
  const [fontSize, setFontSize] = useState(() => EditorConfig.getInstance().getFontSize())
  const [theme, setTheme] = useState(() => EditorConfig.getInstance().getTheme())
  const [showLineNumbers, setShowLineNumbers] = useState(() => EditorConfig.getInstance().getShowLineNumbers())
  const [autoSave, setAutoSave] = useState(() => EditorConfig.getInstance().getAutoSave())
  
  // Factory Pattern: FileServiceManager のインスタンス取得
  const [fileService] = useState(() => FileServiceManager.getInstance())

  // Observer Pattern実装: EditorConfigの変更監視
  useEffect(() => {
    const editorConfig = EditorConfig.getInstance()
    
    const appObserver = new ConfigObserver(
      (data) => {
        // 設定変更時に対応するstate値を更新（リロード不要）
        switch (data.key) {
          case 'fontSize':
            setFontSize(data.newValue)
            break
          case 'theme':
            setTheme(data.newValue)
            break
          case 'showLineNumbers':
            setShowLineNumbers(data.newValue)
            break
          case 'autoSave':
            setAutoSave(data.newValue)
            break
        }
      },
      { 
        id: 'app-observer',
        watchedKeys: ['theme', 'fontSize', 'showLineNumbers', 'autoSave']
      }
    )

    editorConfig.attach(appObserver)

    // クリーンアップ時にObserverを削除
    return () => {
      editorConfig.detach(appObserver)
    }
  }, [])

  // Observer Pattern実装: FileService操作の監視（Phase 4）
  useEffect(() => {
    const fileObserver: FileOperationObserver = {
      onFileOperation: (notification: FileOperationNotification) => {
        setFileOperationStatus(
          notification.success 
            ? `${notification.operation} が完了しました: ${notification.file.name}`
            : `${notification.operation} に失敗しました: ${notification.details || ''}`
        )
        
        // 3秒後にステータスメッセージをクリア
        setTimeout(() => setFileOperationStatus(''), 3000)
      }
    }
    
    fileService.addObserver(fileObserver)
    
    return () => {
      fileService.removeObserver(fileObserver)
    }
  }, [fileService])

  // テキスト変更ハンドラ
  const handleTextChange = useCallback((newText: string) => {
    setText(newText)
    // カーソル位置の更新（簡易版）
    const lines = newText.split('\n')
    setCurrentLine(lines.length)
    setCurrentColumn(lines[lines.length - 1]?.length + 1 || 1)
  }, [])

  // テキスト統計の計算（メモ化）
  const textStats = useMemo(() => {
    return TextService.getTextStatistics(text)
  }, [text])

  // エディタ設定変更ハンドラ（Observer Patternで自動更新）
  const handleFontSizeChange = useCallback((value: string) => {
    console.log('Setting font size to:', value)
    const editorConfig = EditorConfig.getInstance()
    editorConfig.setFontSize(parseInt(value) as 12 | 14 | 16 | 18)
    // Observer Patternにより自動更新されるため、リロード不要
  }, [])

  const handleThemeChange = useCallback((value: string) => {
    console.log('Setting theme to:', value)
    const editorConfig = EditorConfig.getInstance()
    editorConfig.setTheme(value as 'light' | 'dark')
    // Observer Patternにより自動更新されるため、リロード不要
  }, [])

  const handleLineNumbersChange = useCallback((checked: boolean) => {
    console.log('Setting line numbers to:', checked)
    const editorConfig = EditorConfig.getInstance()
    editorConfig.setShowLineNumbers(checked)
    // Observer Patternにより自動更新されるため、リロード不要
  }, [])

  const handleAutoSaveChange = useCallback((checked: boolean) => {
    console.log('Setting auto save to:', checked)
    const editorConfig = EditorConfig.getInstance()
    editorConfig.setAutoSave(checked)
    // Observer Patternにより自動更新されるため、リロード不要
  }, [])

  // 行番号クリック時のジャンプ機能
  const handleLineClick = useCallback((lineNumber: number) => {
    setCurrentLine(lineNumber)
    // 実際のエディタでは、ここでテキストエリアの対応する行にフォーカスを移動
    console.log(`行 ${lineNumber} にジャンプ`)
  }, [])

  // ===== Phase 4: Factory Pattern ファイル操作ハンドラ =====

  // ファイル作成時のハンドラ
  const handleFileCreated = useCallback((fileId: string, fileName: string, content: string) => {
    setCurrentFile({ id: fileId, name: fileName, type: getFileTypeFromName(fileName) })
    setText(content)
    setFileOperationStatus(`新しいファイル「${fileName}」が作成されました`)
  }, [])

  // ファイル読み込み時のハンドラ
  const handleFileLoaded = useCallback((fileId: string, fileName: string, content: string, fileType: FileType) => {
    setCurrentFile({ id: fileId, name: fileName, type: fileType })
    setText(content)
    setFileOperationStatus(`ファイル「${fileName}」を読み込みました`)
  }, [])

  // ファイル保存時のハンドラ
  const handleFileSaved = useCallback((fileId: string, fileName: string) => {
    setCurrentFile(prev => prev ? { ...prev, id: fileId, name: fileName } : null)
    setFileOperationStatus(`ファイル「${fileName}」を保存しました`)
  }, [])

  // ファイル削除時のハンドラ
  const handleFileDeleted = useCallback((fileId: string, fileName: string) => {
    // 削除されたファイルが現在開いているファイルの場合はクリア
    if (currentFile && currentFile.id === fileId) {
      setCurrentFile(null)
      setText('')
    }
    setFileOperationStatus(`ファイル「${fileName}」を削除しました`)
  }, [currentFile])

  // ファイル名から形式を推定するユーティリティ
  const getFileTypeFromName = useCallback((fileName: string): FileType => {
    const extension = fileName.toLowerCase().split('.').pop()
    switch (extension) {
      case 'md': case 'markdown': return 'md'
      case 'json': return 'json'
      default: return 'txt'
    }
  }, [])

  // ダイアログ制御ハンドラ
  const handleOpenSaveDialog = useCallback(() => {
    if (text.trim().length === 0) {
      setFileOperationStatus('保存する内容がありません')
      return
    }
    setIsSaveDialogOpen(true)
  }, [text])

  const handleOpenLoadDialog = useCallback(() => {
    setIsLoadDialogOpen(true)
  }, [])

  const handleToggleFileExplorer = useCallback(() => {
    setIsFileExplorerOpen(prev => !prev)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ヘッダー */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">
                  テキストエディタ - デザインパターン学習プロジェクト
                </CardTitle>
                <p className="text-gray-600">
                  Phase 4: Factory Pattern によるファイル管理システム完了 + 全パターン統合
                </p>
                {currentFile && (
                  <p className="text-sm text-blue-600 mt-2">
                    現在編集中: {currentFile.name} ({currentFile.type.toUpperCase()})
                  </p>
                )}
                {fileOperationStatus && (
                  <p className="text-sm text-green-600 mt-1">
                    {fileOperationStatus}
                  </p>
                )}
              </div>
              
              {/* ファイル操作ツールバー */}
              <div className="flex items-center space-x-2">
                <FileMenu
                  currentContent={text}
                  currentFileName={currentFile?.name}
                  onFileCreated={handleFileCreated}
                  onFileLoaded={handleFileLoaded}
                  onFileSaved={handleFileSaved}
                />
                <Button
                  onClick={handleOpenLoadDialog}
                  variant="outline"
                  size="sm"
                >
                  📂 開く
                </Button>
                <Button
                  onClick={handleOpenSaveDialog}
                  variant="outline"
                  size="sm"
                  disabled={text.trim().length === 0}
                >
                  💾 名前を付けて保存
                </Button>
                <Button
                  onClick={handleToggleFileExplorer}
                  variant="outline"
                  size="sm"
                >
                  📁 ファイル一覧
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* エディタ設定パネル */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">エディタ設定</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* フォントサイズ設定 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">フォントサイズ</label>
                <Select 
                  value={fontSize.toString()} 
                  onValueChange={handleFontSizeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="フォントサイズを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12px</SelectItem>
                    <SelectItem value="14">14px</SelectItem>
                    <SelectItem value="16">16px</SelectItem>
                    <SelectItem value="18">18px</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* テーマ設定 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">テーマ</label>
                <Select 
                  value={theme} 
                  onValueChange={handleThemeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="テーマを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">ライト</SelectItem>
                    <SelectItem value="dark">ダーク</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 行番号表示設定 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">行番号表示</label>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={showLineNumbers}
                    onCheckedChange={handleLineNumbersChange}
                  />
                  <span className="text-sm">
                    {showLineNumbers ? '有効' : '無効'}
                  </span>
                </div>
              </div>

              {/* 自動保存設定 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">自動保存</label>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={autoSave}
                    onCheckedChange={handleAutoSaveChange}
                  />
                  <span className="text-sm">
                    {autoSave ? '有効' : '無効'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ファイルエクスプローラー（条件表示） */}
        {isFileExplorerOpen && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">ファイルエクスプローラー</CardTitle>
                <Button
                  onClick={() => setIsFileExplorerOpen(false)}
                  variant="ghost"
                  size="sm"
                >
                  ✕ 閉じる
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <FileExplorer
                onFileSelect={handleFileLoaded}
                onFileDelete={handleFileDeleted}
                displayMode="list"
                maxFiles={20}
              />
            </CardContent>
          </Card>
        )}

        {/* メインエディタエリア */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* エディタ */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    エディタ
                    {currentFile && (
                      <span className="ml-2 text-sm text-gray-500">
                        - {currentFile.name}
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{textStats.lines} 行</span>
                    <span>•</span>
                    <span>{textStats.characters} 文字</span>
                    {currentFile && (
                      <>
                        <span>•</span>
                        <span className="text-blue-600">{currentFile.type.toUpperCase()}</span>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* エディタとライン番号の統合表示 */}
                <div className="flex">
                  {/* 行番号カウンター */}
                  <LineCounter 
                    text={text}
                    currentLine={currentLine}
                    onLineClick={handleLineClick}
                  />
                  
                  {/* メインエディタ */}
                  <div className="flex-1">
                    <Editor 
                      initialValue={text}
                      onTextChange={handleTextChange}
                      className="min-h-[400px] rounded-l-none"
                    />
                  </div>
                </div>
                
                {/* ステータスバー */}
                <StatusBar 
                  currentLine={currentLine}
                  currentColumn={currentColumn}
                  totalLines={textStats.lines}
                  totalCharacters={textStats.characters}
                  selectedText={selectedText}
                />
              </CardContent>
            </Card>
          </div>

          {/* サイドパネル */}
          <div className="space-y-6">
            {/* 文字数カウンター */}
            <CharCounter 
              text={text}
              showDetailedStats={true}
              maxCharacters={5000}
            />

            {/* ファイル操作ツール */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ファイル操作</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    onClick={handleOpenLoadDialog}
                    variant="outline"
                    className="w-full"
                  >
                    📂 ファイルを開く
                  </Button>
                  <Button 
                    onClick={handleOpenSaveDialog}
                    variant="outline"
                    className="w-full"
                    disabled={text.trim().length === 0}
                  >
                    💾 名前を付けて保存
                  </Button>
                  <Button 
                    onClick={handleToggleFileExplorer}
                    variant="outline"
                    className="w-full"
                  >
                    📁 ファイル一覧表示
                  </Button>
                  {currentFile && (
                    <Button 
                      onClick={() => {
                        setCurrentFile(null)
                        setText('')
                        setFileOperationStatus('ファイルを閉じました')
                      }}
                      variant="outline"
                      className="w-full text-red-600 hover:text-red-700"
                    >
                      ✕ ファイルを閉じる
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* テキストツール */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">テキストツール</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    onClick={() => setText('')}
                    variant="outline"
                    className="w-full"
                  >
                    テキストをクリア
                  </Button>
                  <Button 
                    onClick={() => setText(TextService.sanitizeText(text))}
                    variant="outline"
                    className="w-full"
                  >
                    テキストをサニタイズ
                  </Button>
                  <Button 
                    onClick={() => setText(TextService.truncateText(text, 100))}
                    variant="outline"
                    className="w-full"
                  >
                    テキストを切り詰め (100文字)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* デザインパターン情報 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">実装済みパターン</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Singleton Pattern ✓</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Observer Pattern ✓</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span>Command Pattern ✓</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span>Static Factory Pattern ✓</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <span>Composition Pattern ✓</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>Factory Pattern ✓</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                    <span>Repository Pattern ✓</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                    <span>Facade Pattern ✓</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                    <span>Strategy Pattern ✓</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                    <span>Template Method Pattern ✓</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                  Phase 4: Factory Pattern完了 - 全デザインパターン統合アプリケーション
                </div>
                {currentFile && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                    <div className="font-medium text-blue-800">現在のファイル情報</div>
                    <div className="text-blue-600">ID: {currentFile.id.substring(0, 8)}...</div>
                    <div className="text-blue-600">形式: {currentFile.type.toUpperCase()}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ダイアログコンポーネント */}
        <SaveDialog
          isOpen={isSaveDialogOpen}
          onClose={() => setIsSaveDialogOpen(false)}
          content={text}
          currentFile={currentFile ? {
            id: currentFile.id,
            name: currentFile.name,
            type: currentFile.type
          } : undefined}
          onSaveComplete={handleFileSaved}
        />

        <LoadDialog
          isOpen={isLoadDialogOpen}
          onClose={() => setIsLoadDialogOpen(false)}
          onFileSelect={handleFileLoaded}
          defaultDisplayMode="list"
          allowedTypes={['txt', 'md', 'json']}
          maxFiles={50}
        />
      </div>
    </div>
  )
}

export default App