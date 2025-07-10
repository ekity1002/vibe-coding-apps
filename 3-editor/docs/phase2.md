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

### Task 2.1: Command パターンの基礎設計 ✅完了
**学習フォーカス**: Command Pattern の理論と設計

#### 完了内容
- `ICommand` インターフェースの定義
- `execute()` と `undo()` メソッドの抽象化
- 具体的なCommandクラスの実装
  - `InsertTextCommand`: テキスト挿入操作
  - `DeleteTextCommand`: テキスト削除操作  
  - `ReplaceTextCommand`: テキスト置換操作

**実装成果物**:
```
src/types/
└── CommandTypes.ts         # Command関連型定義

src/services/
├── InsertTextCommand.ts    # テキスト挿入Command
├── DeleteTextCommand.ts    # テキスト削除Command
└── ReplaceTextCommand.ts   # テキスト置換Command
```

---

### Task 2.2: CommandService の実装 ✅完了
**学習フォーカス**: Command の管理と実行制御

#### 完了内容
- CommandService クラスの設計
- コマンド履歴の管理（スタック構造）
- `executeCommand()` メソッド実装
- `undo()` / `redo()` 機能実装
- 履歴サイズ制限とメモリ管理

**実装成果物**:
```
src/services/
└── CommandService.ts       # Command実行・履歴管理
```

---

### Task 2.3: React統合とテキスト同期 ✅完了
**学習フォーカス**: Command Pattern の React 統合

#### 完了内容
- `useCommandHistory` カスタムフック実装
- テキスト同期問題の解決（useState + useRef併用）
- キーボードショートカットの実装（Ctrl+Z, Ctrl+Y）
- CommandTextArea と CommandEditor の実装
- 35テスト全成功

**実装成果物**:
```
src/hooks/
└── useCommandHistory.ts    # 履歴管理フック

src/editor/
├── CommandEditor.tsx       # Command統合エディタ
└── CommandTextArea.tsx     # Command対応テキストエリア
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

Phase 2 完了後は以下の機能が実装済みとなり、Phase 3 (Observer Pattern) への基盤が整います：

- ✅ テキスト操作の完全な Command 化
- ✅ アンドゥ・リドゥ機能
- ✅ React統合でのテキスト同期
- ✅ キーボードショートカット（Ctrl+Z, Ctrl+Y）
- ✅ CommandEditor と CommandTextArea の実装

**Phase 3で実装予定の機能**:
- Observer Pattern による設定変更通知
- 履歴パネルと操作統計の表示
- 複数コンポーネント間のリアルタイム同期

---

## 開発スケジュール（実績）

| タスク | 期間 | 主要成果物 | 学習ポイント | 状況 |
|--------|------|------------|--------------|------|
| Task 2.1 | 1日 | Command基礎クラス | Command Pattern理論 | ✅完了 |
| Task 2.2 | 1日 | CommandService | 履歴管理アルゴリズム | ✅完了 |
| Task 2.3 | 1日 | React統合 | テキスト同期問題解決 | ✅完了 |

**実績**:
- **期間**: 3日間（予定5日間から短縮）
- **総テスト数**: 35テスト（全て成功）
- **実装行数**: 約1500行
- **主要成果**: useState + useRef併用パターンの確立