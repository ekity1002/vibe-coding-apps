# Phase 2: Command Pattern 実装計画

## 概要

Phase 2では **Command Pattern** を中心とした操作履歴機能（アンドゥ・リドゥ）を実装します。
テキストエディタでの全ての編集操作をCommandオブジェクトとして抽象化し、履歴管理と操作の取り消し機能を提供します。

---

## 学習目標

### デザインパターン学習
- **Command Pattern**: 操作をオブジェクトとして封じ込める
- **Memento Pattern**: 操作前の状態を保存する
- **Strategy Pattern**: 異なる操作タイプを統一的に処理する

### 技術的スキル
- TDD による段階的実装
- TypeScript での抽象クラス・インターフェース設計
- React カスタムフックの作成
- 状態管理パターンの実践

---

## 実装スケジュール

### Task 1: Command パターンの基礎設計 (1日目)
**学習フォーカス**: Command Pattern の理論と設計

#### 1.1 Command インターフェースの設計
- `ICommand` インターフェースの定義
- `execute()` と `undo()` メソッドの抽象化
- コマンドの基本ライフサイクル理解

#### 1.2 具体的なCommandクラスの実装
- `InsertTextCommand`: テキスト挿入操作
- `DeleteTextCommand`: テキスト削除操作
- `ReplaceTextCommand`: テキスト置換操作

**成果物**:
```
src/patterns/command/
├── ICommand.ts           # Commandインターフェース
├── InsertTextCommand.ts  # テキスト挿入Command
├── DeleteTextCommand.ts  # テキスト削除Command
└── ReplaceTextCommand.ts # テキスト置換Command
```

---

### Task 2: CommandManager の実装 (2日目)
**学習フォーカス**: Command の管理と実行制御

#### 2.1 CommandManager クラスの設計
- コマンド履歴の管理（スタック構造）
- `executeCommand()` メソッド実装
- `undo()` / `redo()` 機能実装

#### 2.2 履歴サイズ制限とメモリ管理
- 最大履歴数の制限
- 古い履歴の自動削除
- メモリ効率の最適化

**成果物**:
```
src/patterns/command/
└── CommandManager.ts     # Command実行・履歴管理
src/services/
└── HistoryService.ts     # 履歴操作サービス
```

---

### Task 3: エディタとの統合 (3日目)
**学習フォーカス**: Command Pattern の実際の活用

#### 3.1 エディタコンポーネントの改修
- TextArea での操作をCommandに変換
- キーボードショートカットの実装（Ctrl+Z, Ctrl+Y）
- 操作イベントの Command 化

#### 3.2 Reactフックの作成
- `useCommandHistory` カスタムフック
- 状態管理との統合
- パフォーマンス最適化

**成果物**:
```
src/hooks/
└── useCommandHistory.ts  # 履歴管理フック
src/editor/
├── Editor.tsx           # Command統合済みエディタ
└── TextArea.tsx         # Command対応テキストエリア
```

---

### Task 4: Observer Pattern による設定通知 (4日目)
**学習フォーカス**: Observer Pattern でのリアルタイム更新

#### 4.1 Observer インターフェースの実装
- `IObserver` インターフェース定義
- `ISubject` インターフェース定義
- 通知機能の基本設計

#### 4.2 EditorConfig の Observer 対応
- 設定変更時の通知機能
- 複数コンポーネントへの更新通知
- window.location.reload() の除去

**成果物**:
```
src/patterns/observer/
├── IObserver.ts         # Observerインターフェース
├── ISubject.ts          # Subjectインターフェース
└── ConfigObserver.ts    # 設定変更Observer
src/config/
└── EditorConfig.ts      # Observer対応済み設定
```

---

### Task 5: UI コンポーネントの追加 (5日目)
**学習フォーカス**: Command Pattern の視覚化

#### 5.1 履歴表示コンポーネント
- 操作履歴の一覧表示
- 任意の履歴ポイントへのジャンプ
- 履歴の分岐表示

#### 5.2 操作統計ダッシュボード
- 操作回数の統計
- よく使用される操作の分析
- パフォーマンス指標の表示

**成果物**:
```
src/components/
├── HistoryPanel.tsx     # 履歴表示パネル
├── OperationStats.tsx   # 操作統計
└── UndoRedoButtons.tsx  # アンドゥ・リドゥボタン
```

---

## TDD 実装アプローチ

### Phase 2 での TDD サイクル

#### Red フェーズ
1. Command インターフェースのテスト作成
2. 各種 Command クラスのテスト作成
3. CommandManager のテスト作成
4. 統合テストの作成

#### Green フェーズ
1. 最小限の Command 実装
2. CommandManager の基本機能実装
3. React フックの実装
4. UI コンポーネントとの統合

#### Refactor フェーズ
1. パフォーマンス最適化
2. メモリ使用量の改善
3. TypeScript 型安全性の向上
4. コードの可読性向上

---

## 技術要件

### TypeScript 設計原則
```typescript
// Command インターフェース例
interface ICommand {
  execute(): void
  undo(): void
  getDescription(): string
}

// Command Manager 例
class CommandManager {
  private history: ICommand[] = []
  private currentIndex: number = -1
  
  executeCommand(command: ICommand): void
  undo(): boolean
  redo(): boolean
  canUndo(): boolean
  canRedo(): boolean
}
```

### テスト戦略
- **単体テスト**: 各 Command クラスの動作確認
- **統合テスト**: CommandManager と Editor の連携
- **E2E テスト**: ユーザー操作フローの検証
- **パフォーマンステスト**: 大量操作での応答性確認

---

## 期待される学習効果

### デザインパターン理解
1. **Command Pattern**
   - 操作の抽象化によるコードの柔軟性
   - アンドゥ・リドゥ機能の実装パターン
   - マクロ機能への拡張可能性

2. **Observer Pattern**
   - 設定変更の即座反映
   - 疎結合なコンポーネント間通信
   - リアクティブプログラミングの基礎

3. **Memento Pattern**
   - 状態の保存と復元
   - 軽量な状態管理手法
   - メモリ効率的な履歴管理

### 実践的スキル
- 複雑な状態管理の設計
- パフォーマンスを意識した実装
- 大規模アプリケーションでの設計原則
- テスタブルなコードの作成

---

## Phase 3 への準備

Phase 2 完了後は以下の機能が実装済みとなり、Phase 3 (Factory Pattern) への基盤が整います：

- ✅ テキスト操作の完全な Command 化
- ✅ アンドゥ・リドゥ機能
- ✅ リアルタイム設定更新
- ✅ 操作履歴の可視化
- ✅ キーボードショートカット

これらの機能により、Phase 3 でのファイル操作やより複雑な編集機能の実装が容易になります。

---

## 開発スケジュール

| タスク | 期間 | 主要成果物 | 学習ポイント |
|--------|------|------------|--------------|
| Task 1 | 1日 | Command基礎クラス | Command Pattern理論 |
| Task 2 | 1日 | CommandManager | 履歴管理アルゴリズム |
| Task 3 | 1日 | Editor統合 | React統合パターン |
| Task 4 | 1日 | Observer実装 | リアルタイム更新 |
| Task 5 | 1日 | UI拡張 | ユーザビリティ向上 |

**合計期間**: 5日間
**総テスト数**: 約150テスト（Phase 1の98テストに追加）
**コード行数**: 約2000行追加予定