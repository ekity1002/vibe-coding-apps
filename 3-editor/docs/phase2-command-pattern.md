# Phase 2: Command Pattern 実装解説

## 概要

Phase 2では **Command Pattern** を実装し、テキストエディタでの操作履歴機能（アンドゥ・リドゥ）の基盤を構築しました。このドキュメントでは、実装した内容の技術的詳細と学習効果について詳しく解説します。

---

## Command Pattern とは

### 基本概念

Command Pattern は **行動パターン** の一つで、操作（コマンド）をオブジェクトとして封じ込めるデザインパターンです。

**主要な利点:**
- 操作の抽象化と再利用性
- アンドゥ・リドゥ機能の実現
- 操作のキューイングと遅延実行
- マクロ機能への拡張可能性

### 構成要素

```typescript
// Command インターフェース
interface ICommand {
  execute(): boolean    // 操作の実行
  undo(): boolean      // 操作の取り消し
  getDescription(): string  // 操作の説明
  canUndo(): boolean   // アンドゥ可能性の判定
}
```

---

## 実装アーキテクチャ

### ファイル構成

```
src/
├── types/
│   └── CommandTypes.ts          # Command関連の型定義
├── services/
│   ├── CommandService.ts        # Command管理サービス
│   ├── InsertTextCommand.ts     # テキスト挿入Command
│   ├── DeleteTextCommand.ts     # テキスト削除Command
│   └── ReplaceTextCommand.ts    # テキスト置換Command
└── tests/
    └── services/
        └── InsertTextCommand.test.ts  # テストファイル
```

---

## 1. 型システムの設計

### `CommandTypes.ts` の実装ポイント

#### ICommand インターフェース
```typescript
export interface ICommand {
  execute(): boolean
  undo(): boolean
  getDescription(): string
  canUndo(): boolean
}
```

**設計判断:**
- `boolean` 返り値: 操作の成功/失敗を明確に判定
- `canUndo()`: 状態に応じたアンドゥ可能性の動的判定
- `getDescription()`: デバッグとUI表示の両方に対応

#### ITextCommand インターフェース
```typescript
export interface ITextCommand extends ICommand {
  readonly position: TextPosition
  readonly type: TextCommandType
}
```

**拡張ポイント:**
- `position`: テキスト操作の位置情報を保持
- `type`: 操作種別の識別（フィルタリングや統計に使用）

#### CommandContext の設計
```typescript
export interface CommandContext {
  currentText: string
  updateText: (newText: string) => void
  setCursorPosition?: (position: number) => void
  setSelection?: (start: number, end: number) => void
}
```

**Dependency Injection パターン:**
- CommandクラスはUIレイヤーに直接依存しない
- テスト時のモック化が容易
- 異なるエディタ実装への移植性

---

## 2. InsertTextCommand の実装

### クラス設計

```typescript
export class InsertTextCommand implements ITextCommand {
  public readonly type: TextCommandType = TEXT_COMMAND_TYPES.INSERT
  public readonly position: TextPosition
  
  private readonly textToInsert: string
  private readonly context: CommandContext
  private executed: boolean = false
  private previousText: string = ''
}
```

### 実装のポイント

#### 1. State Management
```typescript
execute(): boolean {
  // 実行前の状態を保存（Memento Pattern）
  this.previousText = this.context.currentText
  
  // テキスト挿入の実行
  const beforeText = this.context.currentText.slice(0, this.position.start)
  const afterText = this.context.currentText.slice(this.position.start)
  const newText = beforeText + this.textToInsert + afterText
  
  this.context.updateText(newText)
  this.executed = true
  return true
}
```

**学習ポイント:**
- **Memento Pattern**: `previousText` で状態を保存
- **Immutable Operations**: 元のテキストを変更せず新しい文字列を生成
- **Atomic Operations**: 全て成功するか全て失敗するかの二択

#### 2. Error Handling
```typescript
execute(): boolean {
  try {
    // 操作の実行
    return true
  } catch (error) {
    console.error('InsertTextCommand execution failed:', error)
    return false
  }
}
```

**例外安全性の保証:**
- 例外が発生しても状態が破損しない
- エラー情報の適切なログ出力
- 呼び出し元への明確な結果通知

#### 3. Cursor Management
```typescript
// カーソル位置を挿入終了位置に設定
if (this.context.setCursorPosition) {
  this.context.setCursorPosition(this.position.start + this.textToInsert.length)
}
```

**UX配慮:**
- ユーザーの期待する位置にカーソルを移動
- オプショナルなインターフェース（段階的な機能向上）

---

## 3. CommandService の実装

### 履歴管理のアルゴリズム

```typescript
export class CommandService {
  private history: ICommand[] = []
  private currentIndex: number = -1
}
```

#### Stack-based History Management
```typescript
executeCommand(command: ICommand): boolean {
  const success = command.execute()
  
  if (success) {
    // 分岐履歴の削除
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1)
    }
    
    // 新しいコマンドを追加
    this.history.push(command)
    this.currentIndex++
    
    this.enforceHistoryLimit()
    return true
  }
  
  return false
}
```

**アルゴリズムの特徴:**
- **Linear History**: 分岐を許可しない線形履歴
- **Memory Management**: 最大履歴数の制限
- **Consistency**: インデックスと履歴の整合性保証

#### Undo/Redo Implementation
```typescript
undo(): boolean {
  if (!this.canUndo()) return false
  
  const command = this.history[this.currentIndex]
  const success = command.undo()
  
  if (success) {
    this.currentIndex--
    return true
  }
  
  return false
}
```

**学習ポイント:**
- **Guard Clause**: 事前条件のチェック
- **State Consistency**: 失敗時の状態巻き戻し
- **Error Propagation**: エラー情報の適切な伝播

---

## 4. TDD実装アプローチ

### テスト設計の戦略

#### Mock Context の作成
```typescript
let mockContext: CommandContext

beforeEach(() => {
  updateTextSpy = vi.fn()
  setCursorPositionSpy = vi.fn()
  
  mockContext = {
    currentText: 'Hello World',
    updateText: updateTextSpy,
    setCursorPosition: setCursorPositionSpy,
    setSelection: vi.fn()
  }
})
```

**テスト設計原則:**
- **Isolation**: 各テストは独立して実行可能
- **Mocking**: 外部依存性の排除
- **Behavior Verification**: 状態ではなく振る舞いをテスト

#### 包括的なテストケース
```typescript
describe('InsertTextCommand', () => {
  describe('Constructor and Basic Properties', () => {
    // 初期化テスト
  })
  
  describe('Execute Method', () => {
    // 正常系・異常系のテスト
  })
  
  describe('Undo Method', () => {
    // アンドゥ機能のテスト
  })
  
  describe('Execute-Undo Cycle', () => {
    // 複数回の実行・アンドゥテスト
  })
})
```

**テスト分類:**
- **Unit Tests**: 個別メソッドの動作確認
- **Integration Tests**: 複数メソッドの連携確認
- **Edge Case Tests**: 境界値・異常値のテスト

---

## 5. 設計判断とトレードオフ

### 1. enum vs String Literal Union

**決定**: String Literal Union を採用
```typescript
// ❌ enum の使用を避けた
export enum TextCommandType {
  INSERT = 'insert',
  DELETE = 'delete'
}

// ✅ 採用した形式
export type TextCommandType = 'insert' | 'delete' | 'replace' | 'format' | 'move'

export const TEXT_COMMAND_TYPES = {
  INSERT: 'insert' as const,
  DELETE: 'delete' as const,
  // ...
} as const
```

**理由:**
- **Tree Shaking**: 未使用コードの除去が効率的
- **Type Safety**: コンパイル時の型チェック
- **Bundle Size**: 実行時オーバーヘッドの削減

### 2. Mutable vs Immutable State

**決定**: 部分的な Immutable アプローチ
```typescript
// オブジェクト自体は mutable だが、操作は immutable
private readonly textToInsert: string
private readonly context: CommandContext
private executed: boolean = false  // 状態は mutable
```

**理由:**
- **Performance**: 大きなテキストのコピーを避ける
- **Memory**: 不要なオブジェクト生成を抑制
- **Simplicity**: 状態管理の複雑さを軽減

### 3. Error Handling Strategy

**決定**: Exception Safe + Return Value パターン
```typescript
execute(): boolean {
  try {
    // 操作の実行
    return true
  } catch (error) {
    console.error('Error message', error)
    return false
  }
}
```

**理由:**
- **Predictability**: 呼び出し元が簡単にエラーを判定
- **Debugging**: エラー情報の保持
- **Robustness**: 例外による状態破損の防止

---

## 6. パフォーマンス考慮

### 1. Memory Management
```typescript
private enforceHistoryLimit(): void {
  if (this.history.length > this.config.maxHistorySize) {
    const removeCount = this.history.length - this.config.maxHistorySize
    this.history = this.history.slice(removeCount)
    this.currentIndex -= removeCount
  }
}
```

**最適化ポイント:**
- **Memory Leak Prevention**: 古い履歴の自動削除
- **Sliding Window**: 効率的な履歴管理
- **Configurable Limits**: ユーザーの調整可能性

### 2. String Operations
```typescript
// 効率的な文字列結合
const beforeText = this.context.currentText.slice(0, this.position.start)
const afterText = this.context.currentText.slice(this.position.start)
const newText = beforeText + this.textToInsert + afterText
```

**最適化技術:**
- **Slice Operations**: 必要な部分のみを操作
- **String Concatenation**: 一度の結合で新文字列生成
- **Avoid Regex**: 単純操作でのRegEx使用を回避

---

## 7. 拡張性の設計

### 1. Factory Pattern への対応
```typescript
export interface ICommandFactory {
  createInsertCommand(text: string, position: number, context: CommandContext): ITextCommand
  createDeleteCommand(start: number, end: number, context: CommandContext): ITextCommand
  createReplaceCommand(newText: string, start: number, end: number, context: CommandContext): ITextCommand
}
```

**将来の拡張:**
- 複雑なコマンド生成ロジック
- コマンドのバリデーション
- コマンドの最適化

### 2. Composite Command Pattern
```typescript
export interface ICompositeCommand extends ICommand {
  readonly commands: ICommand[]
  addCommand(command: ICommand): void
  removeCommand(command: ICommand): void
}
```

**マクロ機能への対応:**
- 複数操作の一括実行
- ネストした操作の管理
- 部分的なアンドゥ・リドゥ

---

## 8. 学習効果と技術的成果

### デザインパターンの実践的理解

#### 1. Command Pattern
- **抽象化の価値**: 操作をオブジェクトとして扱う利点を体験
- **責務の分離**: UI層とビジネスロジック層の分離
- **拡張性**: 新しい操作タイプの追加が容易

#### 2. Memento Pattern
- **状態保存**: 効率的な履歴管理の実現
- **カプセル化**: 内部状態の適切な隠蔽
- **メモリ効率**: 必要最小限の情報保存

#### 3. Dependency Injection
- **テスタビリティ**: モック化による単体テスト
- **柔軟性**: 異なる実装への切り替え
- **疎結合**: コンポーネント間の依存関係削減

### TypeScript活用技術

#### 1. 高度な型システム
```typescript
// Type Guards の活用
export interface CommandContext {
  setCursorPosition?: (position: number) => void
}

// Optional chaining での安全な呼び出し
if (this.context.setCursorPosition) {
  this.context.setCursorPosition(position)
}
```

#### 2. Readonly と Immutability
```typescript
public readonly type: TextCommandType = TEXT_COMMAND_TYPES.INSERT
public readonly position: TextPosition
```

#### 3. Union Types と String Literals
```typescript
export type TextCommandType = 'insert' | 'delete' | 'replace' | 'format' | 'move'
```

### TDD実践スキル

#### 1. テスト駆動設計
- **仕様の明確化**: テストファーストによる要件定義
- **品質保証**: 実装前の品質基準設定
- **リファクタリング安全性**: テストによる変更保護

#### 2. モックとスパイの活用
```typescript
const updateTextSpy = vi.fn()
expect(updateTextSpy).toHaveBeenCalledWith('HelloXYZ World')
```

#### 3. Edge Case の考慮
- エラーハンドリングのテスト
- 境界値でのテスト
- 状態遷移のテスト

---

## 9. Phase 3 への準備

### 今回実装した基盤

✅ **Command インターフェース**: 操作の標準化
✅ **具体的なCommand実装**: Insert/Delete/Replace操作
✅ **CommandService**: 履歴管理とアンドゥ・リドゥ
✅ **包括的なテストスイート**: 品質保証基盤

### 次のステップで活用される機能

1. **Observer Pattern**: CommandServiceとUIコンポーネントの連携
2. **React統合**: useCommandHistoryフックの実装
3. **UI拡張**: 履歴表示パネルと操作統計
4. **キーボードショートカット**: Ctrl+Z/Ctrl+Y の実装

---

## 10. 実装時の課題と解決策

### 課題1: Circular Dependency の回避
**問題**: CommandとCommandServiceの相互参照
**解決**: インターフェースによる抽象化とDependency Injection

### 課題2: メモリリークの防止
**問題**: 履歴の無制限増加
**解決**: 設定可能な履歴サイズ制限とスライディングウィンドウ

### 課題3: 型安全性の確保
**問題**: 動的なコマンド生成での型チェック
**解決**: Factory Patternとジェネリクスの活用

---

## まとめ

Phase 2 では Command Pattern の実装を通じて、以下の技術的成果を達成しました：

### 技術的成果
- ✅ 22テストが成功する堅牢なCommand実装
- ✅ 型安全なTypeScript設計
- ✅ TDD による品質保証
- ✅ 拡張可能なアーキテクチャ

### 学習効果
- **デザインパターンの実践的理解**
- **TypeScript高度機能の活用**
- **TDD開発プロセスの習得**
- **アーキテクチャ設計スキルの向上**

この基盤により、Phase 3 でのより複雑な機能実装が可能になり、実用的なテキストエディタの完成に向けた重要なマイルストーンを達成しました。

---

## 11. React統合での追加課題と解決策

### 課題: useCommandHistoryフックでのテキスト同期問題

#### 問題の発生
Phase 2のReact統合において、useCommandHistoryフックで以下の問題が発生しました：

```typescript
// ❌ 問題のあった実装
const textRef = useRef(initialText)
const canUndo = useMemo(() => commandService.canUndo(), [commandService])

return {
  text: textRef.current,  // この値が更新されない
  canUndo,                // この値も更新されない
  // ...
}
```

**症状:**
- 35のテストのうち26が失敗
- `text`プロパティがCommand実行後も初期値のまま
- `canUndo`、`canRedo`の状態が正しく更新されない
- 複数のCommandを連続実行すると最後の結果のみ反映

#### 根本原因の分析

**1. リアクティブ性の欠如**
```typescript
// useRefは値が変更されてもReactの再レンダリングをトリガーしない
const textRef = useRef(initialText)
return { text: textRef.current }  // 初期値が固定化される
```

**2. useMemoの依存関係不備**
```typescript
// commandServiceの状態変化がuseMemoに反映されない
const canUndo = useMemo(() => commandService.canUndo(), [commandService])
```

**3. CommandContext内での状態不整合**
```typescript
// get currentText()が古い値を返す
const commandContext = useMemo(() => ({
  get currentText() {
    return textRef.current  // 実行時点の値ではなく、フック初期化時の値
  }
}), [])  // 依存関係が空なので更新されない
```

#### 解決策の実装

**1. useState + useRefの併用パターン**
```typescript
// ✅ 修正後の実装
const [text, setTextState] = useState(initialText)
const textRef = useRef(text)

// textRefとReactの状態を同期
textRef.current = text

const commandContext = useMemo<CommandContext>(() => ({
  get currentText() {
    return textRef.current  // 常に最新の値を返す
  },
  updateText: (newText: string) => {
    textRef.current = newText      // 即座に更新
    setTextState(newText)          // Reactの再レンダリングをトリガー
    updateTextCallbacks.current.forEach(callback => callback(newText))
  }
}), [])  // 関数の定義は不変だが、内部で参照する値は動的
```

**2. 状態更新カウンターの導入**
```typescript
// ✅ useMemoの依存関係を明確化
const [updateCounter, setUpdateCounter] = useState(0)

// 全ての操作で状態更新をトリガー
const undo = useCallback((): boolean => {
  const result = commandService.undo()
  setUpdateCounter(prev => prev + 1)  // 強制的にuseMemoを再計算
  return result
}, [commandService])

// updateCounterに依存させることで確実に再計算
const canUndo = useMemo(() => commandService.canUndo(), [commandService, updateCounter])
const canRedo = useMemo(() => commandService.canRedo(), [commandService, updateCounter])
```

**3. 統合的な状態管理**
```typescript
// ✅ 全ての状態変更操作を統一
const operations = {
  insertText: (text: string, position: number) => {
    const result = commandService.executeCommand(new InsertTextCommand(text, position, commandContext))
    // updateTextでsetTextStateとsetUpdateCounterが自動的に呼ばれる
    return result
  },
  undo: () => {
    const result = commandService.undo()
    setUpdateCounter(prev => prev + 1)  // 統計情報の更新をトリガー
    return result
  },
  clearHistory: () => {
    commandService.clearHistory()
    setUpdateCounter(prev => prev + 1)  // 統計情報のリセットをトリガー
  }
}
```

#### 学習ポイント

**1. Reactフックでの状態管理パターン**
- **useState**: UIに反映する必要があるリアクティブな状態
- **useRef**: パフォーマンス重視で即座に値が必要な状態
- **useState + useRef**: 両方の利点を活用する併用パターン

**2. useMemoの依存関係設計**
- 依存する値がオブジェクト内部にある場合の検出方法
- 状態変化を強制的に検出するカウンターパターン
- パフォーマンスと正確性のバランス

**3. CommandPatternとReactの統合設計**
- UIフレームワークに依存しないCommand設計
- Reactの状態管理との適切な橋渡し
- テスタビリティを維持した統合アーキテクチャ

#### TDDでの問題解決プロセス

**Red → Green → Refactor のサイクル実践**

1. **Red フェーズ**: 35テスト中26失敗
   - 失敗テストから問題の本質を特定
   - 期待する振る舞いを明確化

2. **Green フェーズ**: 段階的な修正
   - useState導入 → 8失敗に減少
   - updateCounter導入 → 3失敗に減少
   - 統合的修正 → 全35テスト成功

3. **Refactor フェーズ**: 品質向上
   - コードの可読性向上
   - パフォーマンス最適化
   - 将来の拡張性確保

#### 成果と効果

**技術的成果:**
- ✅ 35テスト全成功 (26失敗 → 0失敗)
- ✅ リアルタイムなテキスト同期
- ✅ 正確な履歴状態管理
- ✅ 複数Command連続実行の対応

**学習効果:**
- **Reactフック設計**: useState/useRef/useMemoの使い分け
- **状態管理パターン**: 複雑な状態の一貫性保証
- **TDD実践**: 失敗テストからの段階的問題解決
- **デザインパターン統合**: フレームワーク特有の課題への対応

この経験により、デザインパターンをReactエコシステムに統合する際の考慮点と解決策について実践的な知識を獲得しました。