import { useState, useCallback, useMemo } from 'react'
import { Editor } from './presentation/components/editor/Editor'
import { EditorConfig } from './domain/config/entities/EditorConfig'
import { TextService } from './application/services/TextService'
import { Card, CardContent, CardHeader, CardTitle } from './presentation/shared/card'
import { Button } from './presentation/shared/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './presentation/shared/select'
import { Switch } from './presentation/shared/switch'
import './App.css'

/**
 * メインアプリケーションコンポーネント
 * 
 * Phase 1でのデザインパターン実装:
 * - Singleton Pattern: EditorConfig による設定管理
 * - Composition Pattern: Editor、TextService、UI コンポーネントの組み合わせ
 * - Observer Pattern: テキスト変更の監視（今後実装予定）
 */
function App() {
  const [text, setText] = useState('')
  const [config] = useState(() => EditorConfig.getInstance())

  // テキスト変更ハンドラ
  const handleTextChange = useCallback((newText: string) => {
    setText(newText)
  }, [])

  // テキスト統計の計算（メモ化）
  const textStats = useMemo(() => {
    return TextService.getTextStatistics(text)
  }, [text])

  // エディタ設定変更ハンドラ
  const handleFontSizeChange = useCallback((value: string) => {
    config.setFontSize(parseInt(value) as 12 | 14 | 16 | 18)
    // 強制的な再レンダリング（Observer パターンで改善予定）
    window.location.reload()
  }, [config])

  const handleThemeChange = useCallback((value: string) => {
    config.setTheme(value as 'light' | 'dark')
    // 強制的な再レンダリング（Observer パターンで改善予定）
    window.location.reload()
  }, [config])

  const handleLineNumbersChange = useCallback((checked: boolean) => {
    config.setShowLineNumbers(checked)
    // 強制的な再レンダリング（Observer パターンで改善予定）
    window.location.reload()
  }, [config])

  const handleAutoSaveChange = useCallback((checked: boolean) => {
    config.setAutoSave(checked)
  }, [config])

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
              Phase 1: Singleton Pattern を使用した設定管理システム
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
                  value={config.getFontSize().toString()} 
                  onValueChange={handleFontSizeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
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
                  value={config.getTheme()} 
                  onValueChange={handleThemeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
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
                    checked={config.getShowLineNumbers()}
                    onCheckedChange={handleLineNumbersChange}
                  />
                  <span className="text-sm">
                    {config.getShowLineNumbers() ? '有効' : '無効'}
                  </span>
                </div>
              </div>

              {/* 自動保存設定 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">自動保存</label>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={config.getAutoSave()}
                    onCheckedChange={handleAutoSaveChange}
                  />
                  <span className="text-sm">
                    {config.getAutoSave() ? '有効' : '無効'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* メインエディタエリア */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* エディタ */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">エディタ</CardTitle>
              </CardHeader>
              <CardContent>
                <Editor 
                  initialValue={text}
                  onTextChange={handleTextChange}
                  className="min-h-[400px]"
                />
              </CardContent>
            </Card>
          </div>

          {/* テキスト統計とツール */}
          <div className="space-y-6">
            {/* テキスト統計 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">テキスト統計</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">文字数:</span>
                    <span className="text-sm">{textStats.characters}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">行数:</span>
                    <span className="text-sm">{textStats.lines}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">単語数:</span>
                    <span className="text-sm">{textStats.words}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">空白を除く文字数:</span>
                    <span className="text-sm">{textStats.charactersNoSpaces}</span>
                  </div>
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
                <CardTitle className="text-lg">実装パターン</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Singleton Pattern</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Composition Pattern</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span>Static Factory Pattern</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    <span>Observer Pattern (予定)</span>
                  </div>
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