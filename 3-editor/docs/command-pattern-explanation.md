# Command Pattern 詳細解説 - テキストエディタでの実装

## 1. Command Pattern とは

### 基本概念

Command Pattern（コマンドパターン）は、**行動パターン**の一つで、**操作（コマンド）をオブジェクトとして封じ込める**デザインパターンです。

**核心的なアイデア:**
- 操作を実行可能なオブジェクトとして表現
- 操作の実行、取り消し、再実行を統一的に管理
- 操作の履歴管理とアンドゥ・リドゥ機能の実現

### 構成要素

```typescript
// 今回実装した基本インターフェース
export interface ICommand {
  execute(): boolean     // 操作の実行
  undo(): boolean       // 操作の取り消し
  getDescription(): string  // 操作の説明
  canUndo(): boolean    // アンドゥ可能性の判定
}
```

**役割分担:**
- **Command (ICommand)**: 操作を実行するインターフェース
- **ConcreteCommand (InsertTextCommand等)**: 具体的な操作の実装
- **Invoker (CommandService)**: コマンドを管理・実行する
- **Receiver (CommandContext)**: 実際の処理を行う対象

---

## 2. 今回のアプリでの実装

### 2.1 型システムの設計

```typescript
// src/types/CommandTypes.ts
export interface ICommand {
  execute(): boolean
  undo(): boolean
  getDescription(): string
  canUndo(): boolean
}

export interface ITextCommand extends ICommand {
  readonly position: TextPosition
  readonly type: TextCommandType
}

export interface CommandContext {
  currentText: string
  updateText: (newText: string) => void
  setCursorPosition?: (position: number) => void
  setSelection?: (start: number, end: number) => void
}
```

**設計ポイント:**
- **ICommand**: 全操作の共通インターフェース
- **ITextCommand**: テキスト操作特有の情報を追加
- **CommandContext**: 操作対象への依存注入

### 2.2 具体的なCommandの実装

#### テキスト挿入コマンド

```typescript
// src/services/InsertTextCommand.ts
export class InsertTextCommand implements ITextCommand {
  public readonly type: TextCommandType = TEXT_COMMAND_TYPES.INSERT
  public readonly position: TextPosition

  private readonly textToInsert: string
  private readonly context: CommandContext
  private executed: boolean = false
  private previousText: string = ''

  execute(): boolean {
    try {
      // 実行前の状態を保存（Memento Pattern）
      this.previousText = this.context.currentText

      // テキスト挿入の実行
      const beforeText = this.context.currentText.slice(0, this.position.start)
      const afterText = this.context.currentText.slice(this.position.start)
      const newText = beforeText + this.textToInsert + afterText

      // テキストを更新
      this.context.updateText(newText)

      // カーソル位置の調整
      if (this.context.setCursorPosition) {
        this.context.setCursorPosition(this.position.start + this.textToInsert.length)
      }

      this.executed = true
      return true
    } catch (error) {
      console.error('InsertTextCommand execution failed:', error)
      return false
    }
  }

  undo(): boolean {
    if (!this.executed) return false

    try {
      // 元のテキスト状態に復元
      this.context.updateText(this.previousText)
      
      // カーソル位置を挿入開始位置に戻す
      if (this.context.setCursorPosition) {
        this.context.setCursorPosition(this.position.start)
      }

      return true
    } catch (error) {
      console.error('InsertTextCommand undo failed:', error)
      return false
    }
  }
}
```

**実装の特徴:**
- **Memento Pattern**: `previousText`で状態を保存
- **Immutable Operations**: 元のテキストを変更せず新しい文字列を生成
- **Exception Safety**: 例外が発生しても状態が破損しない
- **Context Injection**: UIレイヤーに依存しない設計

### 2.3 Command管理サービス

```typescript
// src/services/CommandService.ts
export class CommandService {
  private history: ICommand[] = []
  private currentIndex: number = -1
  private readonly config: CommandHistoryConfig

  executeCommand(command: ICommand): boolean {
    try {
      const success = command.execute()

      if (success) {
        // 現在位置以降の履歴を削除（分岐の解決）
        if (this.currentIndex < this.history.length - 1) {
          this.history = this.history.slice(0, this.currentIndex + 1)
        }

        // 新しいコマンドを履歴に追加
        this.history.push(command)
        this.currentIndex++

        // 履歴サイズの制限
        this.enforceHistoryLimit()
        return true
      }

      return false
    } catch (error) {
      console.error('Command execution failed:', error)
      return false
    }
  }

  undo(): boolean {
    if (!this.canUndo()) return false

    try {
      const command = this.history[this.currentIndex]
      const success = command.undo()

      if (success) {
        this.currentIndex--
        return true
      }

      return false
    } catch (error) {
      console.error('Undo failed:', error)
      return false
    }
  }

  redo(): boolean {
    if (!this.canRedo()) return false

    try {
      this.currentIndex++
      const command = this.history[this.currentIndex]
      const success = command.execute()

      if (!success) {
        this.currentIndex-- // 失敗時は元に戻す
        return false
      }

      return true
    } catch (error) {
      console.error('Redo failed:', error)
      this.currentIndex-- // 失敗時は元に戻す
      return false
    }
  }
}
```

**アルゴリズムの特徴:**
- **Linear History**: 分岐を許可しない線形履歴管理
- **Memory Management**: 最大履歴数の制限
- **Consistency**: インデックスと履歴の整合性保証
- **Error Recovery**: 失敗時の状態復旧

### 2.4 React統合

```typescript
// src/hooks/useCommandHistory.ts（抜粋）
export function useCommandHistory(options: UseCommandHistoryOptions = {}): UseCommandHistoryReturn {
  const commandService = commandServiceRef.current
  const [text, setTextState] = useState(initialText)
  const [updateCounter, setUpdateCounter] = useState(0)

  // テキスト挿入関数
  const insertText = useCallback((text: string, position: number): boolean => {
    const command = new InsertTextCommand(text, position, commandContext)
    return commandService.executeCommand(command)
  }, [commandService, commandContext])

  // アンドゥ関数
  const undo = useCallback((): boolean => {
    const result = commandService.undo()
    setUpdateCounter(prev => prev + 1)  // UI更新をトリガー
    return result
  }, [commandService])

  // リドゥ関数
  const redo = useCallback((): boolean => {
    const result = commandService.redo()
    setUpdateCounter(prev => prev + 1)  // UI更新をトリガー
    return result
  }, [commandService])

  return {
    text,
    insertText,
    deleteText,
    replaceText,
    undo,
    redo,
    canUndo: useMemo(() => commandService.canUndo(), [commandService, updateCounter]),
    canRedo: useMemo(() => commandService.canRedo(), [commandService, updateCounter]),
    // ...
  }
}
```

**React統合の特徴:**
- **useState + useRef併用**: リアクティブ性と即座のアクセスを両立
- **updateCounter**: useMemoの依存関係管理
- **カスタムフック**: 再利用可能なCommand機能

---

## 3. Command Pattern を使用しない場合との比較

### 3.1 従来のアプローチ（Command Pattern なし）

```typescript
// ❌ Command Pattern を使用しない実装例
class SimpleTextEditor {
  private text: string = ''
  private history: string[] = []
  private historyIndex: number = -1

  insertText(newText: string, position: number) {
    // 履歴保存
    this.saveToHistory()
    
    // テキスト挿入
    const before = this.text.slice(0, position)
    const after = this.text.slice(position)
    this.text = before + newText + after
  }

  deleteText(start: number, end: number) {
    // 履歴保存
    this.saveToHistory()
    
    // テキスト削除
    const before = this.text.slice(0, start)
    const after = this.text.slice(end)
    this.text = before + after
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--
      this.text = this.history[this.historyIndex]
    }
  }

  private saveToHistory() {
    this.history = this.history.slice(0, this.historyIndex + 1)
    this.history.push(this.text)
    this.historyIndex++
  }
}
```

### 3.2 問題点の分析

#### 問題1: 責任の集中
```typescript
// ❌ 問題のあるコード
class TextEditor {
  // 1つのクラスに複数の責任が集中
  insertText() { /* 挿入ロジック */ }
  deleteText() { /* 削除ロジック */ }
  replaceText() { /* 置換ロジック */ }
  formatText() { /* フォーマットロジック */ }
  undo() { /* アンドゥロジック */ }
  redo() { /* リドゥロジック */ }
  saveHistory() { /* 履歴管理ロジック */ }
}
```

#### 問題2: 拡張性の欠如
```typescript
// ❌ 新しい操作を追加するたびにメインクラスを修正
class TextEditor {
  performOperation(type: string, ...args: any[]) {
    switch (type) {
      case 'insert':
        this.insertText(args[0], args[1])
        break
      case 'delete':
        this.deleteText(args[0], args[1])
        break
      case 'replace':
        this.replaceText(args[0], args[1], args[2])
        break
      // 新しい操作を追加するたびにここを修正...
      default:
        throw new Error('Unknown operation')
    }
  }
}
```

#### 問題3: テストの困難さ
```typescript
// ❌ 操作のテストが複雑
test('text insertion', () => {
  const editor = new TextEditor()
  editor.text = 'Hello World'
  editor.insertText('Beautiful ', 6)
  
  // 副作用の確認が必要
  expect(editor.text).toBe('Hello Beautiful World')
  expect(editor.canUndo()).toBe(true)
  expect(editor.history.length).toBe(2)
})
```

### 3.3 Command Pattern による解決

#### 解決1: 責任の分散
```typescript
// ✅ Command Pattern による責任分散
class InsertTextCommand implements ICommand {
  // 挿入操作のみに責任を集中
}

class DeleteTextCommand implements ICommand {
  // 削除操作のみに責任を集中
}

class CommandService {
  // 履歴管理のみに責任を集中
}
```

#### 解決2: 拡張性の向上
```typescript
// ✅ 新しい操作の追加が容易
class FormatTextCommand implements ICommand {
  execute(): boolean { /* フォーマット実装 */ }
  undo(): boolean { /* フォーマット取り消し */ }
  // ...
}

// メインコードを変更せずに新機能を追加
const formatCommand = new FormatTextCommand(...)
commandService.executeCommand(formatCommand)
```

#### 解決3: テストの簡易化
```typescript
// ✅ 操作の単体テストが容易
test('InsertTextCommand execution', () => {
  const mockContext = {
    currentText: 'Hello World',
    updateText: vi.fn()
  }
  
  const command = new InsertTextCommand('Beautiful ', 6, mockContext)
  const result = command.execute()
  
  expect(result).toBe(true)
  expect(mockContext.updateText).toHaveBeenCalledWith('Hello Beautiful World')
})
```

---

## 4. 今回のアプリで実現した機能

### 4.1 アンドゥ・リドゥ機能

```typescript
// キーボードショートカット実装
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
```

**実現した機能:**
- ✅ 標準的なキーボードショートカット（Ctrl+Z/Ctrl+Y）
- ✅ 複数回のアンドゥ・リドゥ
- ✅ 履歴の分岐処理（新しい操作で未来の履歴を削除）
- ✅ 安全な状態管理（例外時の状態保護）

### 4.2 操作履歴の管理

```typescript
// 履歴統計情報の提供
getHistoryStats(): {
  totalCommands: number
  currentPosition: number
  canUndo: boolean
  canRedo: boolean
  memoryUsage: number
} {
  return {
    totalCommands: this.history.length,
    currentPosition: this.currentIndex + 1,
    canUndo: this.canUndo(),
    canRedo: this.canRedo(),
    memoryUsage: this.calculateMemoryUsage()
  }
}

// 履歴一覧の提供
getHistoryList(): Array<{
  index: number
  description: string
  executed: boolean
  canUndo: boolean
}> {
  return this.history.map((command, index) => ({
    index,
    description: command.getDescription(),
    executed: index <= this.currentIndex,
    canUndo: command.canUndo()
  }))
}
```

**実現した機能:**
- ✅ 操作履歴の可視化
- ✅ 履歴ポイントへのジャンプ
- ✅ メモリ使用量の監視
- ✅ 操作統計の提供

### 4.3 高度なテキスト操作

```typescript
// Unicode対応の安全な文字操作
execute(): boolean {
  try {
    this.previousText = this.context.currentText

    // Array.from()でUnicodeサロゲートペアを正しく処理
    const textArray = Array.from(this.context.currentText)
    
    if (this.position.start < 0 || this.position.start > textArray.length) {
      console.warn('Invalid position, adjusting to valid range')
      this.position.start = Math.max(0, Math.min(textArray.length, this.position.start))
    }

    const beforeText = this.context.currentText.slice(0, this.position.start)
    const afterText = this.context.currentText.slice(this.position.start)
    const newText = beforeText + this.textToInsert + afterText

    this.context.updateText(newText)
    this.executed = true
    return true
  } catch (error) {
    console.error('InsertTextCommand execution failed:', error)
    return false
  }
}
```

**実現した機能:**
- ✅ Unicode文字の正確な処理
- ✅ 境界値の安全な処理
- ✅ エラー時の状態保護
- ✅ 詳細なログ出力

---

## 5. Command Pattern の利点

### 5.1 拡張性

**新しい操作の追加が容易:**
```typescript
// 新しいコマンドクラスを追加するだけ
class IndentTextCommand implements ITextCommand {
  execute(): boolean {
    // インデント処理
    const lines = this.context.currentText.split('\n')
    const indentedLines = lines.map(line => '  ' + line)
    this.context.updateText(indentedLines.join('\n'))
    return true
  }

  undo(): boolean {
    // インデント取り消し処理
    this.context.updateText(this.previousText)
    return true
  }
}

// 既存コードを変更せずに利用可能
const indentCommand = new IndentTextCommand(...)
commandService.executeCommand(indentCommand)
```

### 5.2 マクロ機能

**複数操作の組み合わせ:**
```typescript
class CompositeCommand implements ICommand {
  private commands: ICommand[] = []

  addCommand(command: ICommand): void {
    this.commands.push(command)
  }

  execute(): boolean {
    for (const command of this.commands) {
      if (!command.execute()) {
        // 失敗時は実行済みコマンドを逆順でアンドゥ
        this.rollback()
        return false
      }
    }
    return true
  }

  undo(): boolean {
    // 逆順でアンドゥ実行
    for (let i = this.commands.length - 1; i >= 0; i--) {
      if (!this.commands[i].undo()) {
        return false
      }
    }
    return true
  }
}
```

### 5.3 ログ・監査機能

**操作の追跡:**
```typescript
class LoggingCommandDecorator implements ICommand {
  constructor(private command: ICommand, private logger: Logger) {}

  execute(): boolean {
    this.logger.log(`Executing: ${this.command.getDescription()}`)
    const result = this.command.execute()
    this.logger.log(`Result: ${result ? 'success' : 'failure'}`)
    return result
  }

  undo(): boolean {
    this.logger.log(`Undoing: ${this.command.getDescription()}`)
    const result = this.command.undo()
    this.logger.log(`Undo result: ${result ? 'success' : 'failure'}`)
    return result
  }
}
```

---

## 6. 実世界での活用例

### 6.1 GUI アプリケーション

**Adobe Photoshop**
- レイヤー操作、フィルター適用、描画操作すべてがCommandとして実装
- 複雑な操作履歴とアンドゥ・リドゥシステム
- アクション機能（マクロ）でCommand Patternを活用

**Microsoft Office**
- Word, Excel, PowerPointでの編集操作
- 書式設定、挿入、削除などすべてがCommandとして管理
- VBAマクロもCommand Patternの概念を使用

### 6.2 IDE・エディタ

**Visual Studio Code**
```typescript
// VSCodeのコマンドシステム（簡略化）
interface Command {
  id: string
  execute(context: ExecutionContext): void
  undo?(): void
}

// コマンドパレットでの操作実行
commands.registerCommand('editor.action.insertLineAfter', {
  execute: (context) => {
    const editor = context.activeEditor
    const command = new InsertLineCommand(editor)
    commandService.executeCommand(command)
  }
})
```

**JetBrains IntelliJ IDEA**
- コードリファクタリング操作
- 検索・置換操作
- ファイル操作すべてがCommandとして実装

### 6.3 ゲーム開発

**ターン制ゲーム**
```typescript
interface GameCommand {
  execute(gameState: GameState): boolean
  undo(gameState: GameState): boolean
  getDisplayName(): string
}

class MoveCommand implements GameCommand {
  constructor(
    private unit: Unit,
    private fromPosition: Position,
    private toPosition: Position
  ) {}

  execute(gameState: GameState): boolean {
    if (gameState.canMove(this.unit, this.toPosition)) {
      gameState.moveUnit(this.unit, this.toPosition)
      return true
    }
    return false
  }

  undo(gameState: GameState): boolean {
    gameState.moveUnit(this.unit, this.fromPosition)
    return true
  }
}
```

### 6.4 データベース・トランザクション

**ORM フレームワーク**
```typescript
// Sequelize、TypeORM等でのトランザクション管理
class DatabaseCommand {
  async execute(transaction: Transaction): Promise<boolean> {
    try {
      await this.performDatabaseOperation(transaction)
      return true
    } catch (error) {
      await transaction.rollback()
      return false
    }
  }
}
```

---

## 7. デザインパターンの組み合わせ

### 7.1 Command + Memento Pattern

```typescript
// 状態保存にMementoパターンを活用
class TextMemento {
  constructor(
    public readonly text: string,
    public readonly cursorPosition: number,
    public readonly selection: {start: number, end: number} | null
  ) {}
}

class MementoTextCommand implements ICommand {
  private memento: TextMemento | null = null

  execute(): boolean {
    // 実行前の状態をMementoとして保存
    this.memento = new TextMemento(
      this.context.currentText,
      this.getCurrentCursorPosition(),
      this.getCurrentSelection()
    )
    
    // 操作実行
    return this.performOperation()
  }

  undo(): boolean {
    if (this.memento) {
      // Mementoから状態を復元
      this.context.updateText(this.memento.text)
      this.context.setCursorPosition?.(this.memento.cursorPosition)
      if (this.memento.selection) {
        this.context.setSelection?.(this.memento.selection.start, this.memento.selection.end)
      }
      return true
    }
    return false
  }
}
```

### 7.2 Command + Factory Pattern

```typescript
// コマンド生成にFactoryパターンを活用
class TextCommandFactory implements ICommandFactory {
  createInsertCommand(text: string, position: number, context: CommandContext): ITextCommand {
    return new InsertTextCommand(text, position, context)
  }

  createDeleteCommand(start: number, end: number, context: CommandContext): ITextCommand {
    return new DeleteTextCommand(start, end, context)
  }

  createReplaceCommand(newText: string, start: number, end: number, context: CommandContext): ITextCommand {
    return new ReplaceTextCommand(newText, start, end, context)
  }

  // 将来的な拡張
  createMacroCommand(commands: ICommand[]): ICommand {
    return new CompositeCommand(commands)
  }
}
```

### 7.3 Command + Observer Pattern

```typescript
// コマンド実行時の通知にObserverパターンを活用
class ObservableCommandService extends CommandService {
  private observers: CommandObserver[] = []

  executeCommand(command: ICommand): boolean {
    const result = super.executeCommand(command)
    
    if (result) {
      // 実行成功をObserverに通知
      this.notifyObservers({
        type: 'COMMAND_EXECUTED',
        command: command,
        timestamp: Date.now()
      })
    }
    
    return result
  }

  undo(): boolean {
    const result = super.undo()
    
    if (result) {
      this.notifyObservers({
        type: 'COMMAND_UNDONE',
        timestamp: Date.now()
      })
    }
    
    return result
  }
}
```

---

## 8. パフォーマンスとメモリ管理

### 8.1 メモリ効率化

```typescript
// 大きなテキストのメモリ効率的な管理
class OptimizedTextCommand implements ITextCommand {
  private textSnapshot: string | null = null
  private useSnapshot: boolean = false

  execute(): boolean {
    // テキストサイズによって保存方法を変更
    const textSize = this.context.currentText.length
    
    if (textSize > LARGE_TEXT_THRESHOLD) {
      // 大きなテキストの場合、差分のみ保存
      this.useSnapshot = false
      this.saveDiffOnly()
    } else {
      // 小さなテキストの場合、全体を保存
      this.useSnapshot = true
      this.textSnapshot = this.context.currentText
    }
    
    return this.performOperation()
  }

  undo(): boolean {
    if (this.useSnapshot && this.textSnapshot) {
      this.context.updateText(this.textSnapshot)
      return true
    } else {
      return this.restoreFromDiff()
    }
  }
}
```

### 8.2 履歴サイズ管理

```typescript
// 履歴サイズの動的管理
class MemoryOptimizedCommandService extends CommandService {
  private enforceHistoryLimit(): void {
    const currentMemoryUsage = this.calculateMemoryUsage()
    
    if (currentMemoryUsage > this.config.maxMemoryUsage) {
      // メモリ使用量が上限を超えた場合、古い履歴を削除
      this.removeOldestCommands()
    } else if (this.history.length > this.config.maxHistorySize) {
      // 履歴数が上限を超えた場合も削除
      const removeCount = this.history.length - this.config.maxHistorySize
      this.history = this.history.slice(removeCount)
      this.currentIndex -= removeCount
    }
  }

  private calculateMemoryUsage(): number {
    return this.history.reduce((total, command) => {
      return total + this.estimateCommandMemoryUsage(command)
    }, 0)
  }
}
```

---

## 9. まとめ

### 9.1 Command Pattern の価値

**今回のテキストエディタ実装で実証された価値:**

1. **責任の明確化**
   - 各操作が独立したCommandクラスとして実装
   - 単一責任原則の遵守
   - テストの容易性

2. **拡張性の確保**
   - 新しい操作の追加がメインコードを変更せずに可能
   - マクロ機能への発展が容易
   - プラグインシステムへの対応

3. **堅牢性の向上**
   - 例外安全性の確保
   - 状態の一貫性保証
   - エラー時の適切な復旧

4. **ユーザビリティの向上**
   - 直感的なアンドゥ・リドゥ操作
   - 操作履歴の可視化
   - キーボードショートカット対応

### 9.2 学習効果

**技術的成果:**
- ✅ 35テスト全成功の堅牢な実装
- ✅ React統合でのテキスト同期問題の解決
- ✅ TypeScriptによる型安全な設計
- ✅ TDDによる品質保証

**設計原則の実践:**
- **SOLID原則**: 単一責任、開放閉鎖、依存注入
- **DRY原則**: 共通インターフェースによる重複排除
- **YAGNI原則**: 必要最小限の機能実装

### 9.3 今後の発展可能性

**Phase 3以降での活用:**
- Observer Patternとの組み合わせ（コマンド実行通知）
- Factory Patternとの組み合わせ（コマンド生成）
- Strategy Patternとの組み合わせ（操作アルゴリズムの切り替え）

**実用アプリケーションへの応用:**
- リッチテキストエディタの実装
- 画像編集アプリケーションの操作履歴
- CADソフトウェアの図形操作
- ゲーム開発でのアクションシステム

Command Patternは、単なる「アンドゥ・リドゥ機能」を超えて、
**アプリケーションの操作を体系的に管理し、保守性と拡張性を両立させる**
強力な設計パターンであることが、今回の実装を通じて実証されました。