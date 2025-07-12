import { useState, useCallback, useMemo, useEffect } from 'react'
import { Editor } from './presentation/components/editor/Editor'
import { StatusBar } from './presentation/components/editor/StatusBar'
import { LineCounter } from './presentation/components/editor/LineCounter'
import { CharCounter } from './presentation/components/editor/CharCounter'
import { EditorConfig } from './domain/config/entities/EditorConfig'
import { ConfigObserver } from './domain/observer/services/ConfigObserver'
import { TextService } from './application/services/TextService'
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
 */
function App() {
  const [text, setText] = useState('')
  const [currentLine, setCurrentLine] = useState(1)
  const [currentColumn, setCurrentColumn] = useState(1)
  const [selectedText] = useState<string | undefined>()
  
  // 設定値を個別に管理してReactの再レンダリングを確実にする
  const [fontSize, setFontSize] = useState(() => EditorConfig.getInstance().getFontSize())
  const [theme, setTheme] = useState(() => EditorConfig.getInstance().getTheme())
  const [showLineNumbers, setShowLineNumbers] = useState(() => EditorConfig.getInstance().getShowLineNumbers())
  const [autoSave, setAutoSave] = useState(() => EditorConfig.getInstance().getAutoSave())

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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ヘッダー */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              テキストエディタ - デザインパターン学習プロジェクト
            </CardTitle>
            <p className="text-gray-600">
              Phase 3: Observer Pattern による UI更新システム完了 - リアルタイム設定変更監視
            </p>
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

        {/* メインエディタエリア */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* エディタ */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">エディタ</CardTitle>
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
                </div>
                <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                  Phase 3: UI更新 + Observer Pattern 完了
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App