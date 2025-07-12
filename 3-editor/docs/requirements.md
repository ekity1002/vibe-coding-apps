# テキストエディタ実装で学ぶデザインパターン学習カリキュラム

## 概要
テキストエディタアプリを0から実装しながら、実践的にデザインパターンを学習する段階的カリキュラム

---

## Phase 1: 基本エディタ + Singleton Pattern
**目標**: 基本的なテキスト編集機能を実装し、Singletonパターンを学ぶ

**実装内容**:
- テキスト入力・表示
- エディタ設定管理クラス（Singleton）

**学習内容**:
- Singletonパターンの概念と実装
- グローバル状態管理の重要性

**成果物**: 基本的なテキスト入力ができるエディタ

---

## Phase 2: 操作履歴 + Command Pattern
**目標**: アンドゥ・リドゥ機能を実装し、Commandパターンを学ぶ

**実装内容**:
- テキスト操作をCommandオブジェクトで管理
- 操作履歴スタックの実装
- アンドゥ・リドゥ機能

**学習内容**:
- Commandパターンの概念
- 操作の抽象化とカプセル化
- 履歴管理の設計

**成果物**: アンドゥ・リドゥ機能付きエディタ

---

## Phase 3: UI更新 + Observer Pattern
**目標**: リアルタイム更新機能を実装し、Observerパターンを学ぶ

**実装内容**:
- エディタ設定変更の通知システム
- 行番号・文字数カウンターの自動更新
- 複数コンポーネント間の状態同期
- 履歴パネルと操作統計の実装

**学習内容**:
- Observerパターンの概念
- イベント駆動設計
- 疎結合な設計
- リアクティブプログラミング

**成果物**: リアルタイム更新機能付きエディタ

---

## Phase 4: ファイル操作 + Factory Pattern
**目標**: ファイル作成・保存機能を実装し、Factoryパターンを学ぶ

**実装内容**:
- 異なるファイル形式（.txt, .md, .json）の作成
- ファイル作成をFactoryで管理
- ファイル保存・読み込み機能

**学習内容**:
- Factory Methodパターンの概念
- オブジェクト生成の抽象化
- 拡張性のある設計

**成果物**: ファイル操作機能付きエディタ

---

## Phase 5: 装飾機能 + Decorator Pattern
**目標**: テキスト装飾機能を実装し、Decoratorパターンを学ぶ

**実装内容**:
- テキスト装飾（太字、イタリック、色）
- 装飾の組み合わせ
- 装飾の追加・削除

**学習内容**:
- Decoratorパターンの概念
- 機能の動的な追加
- 継承の代替手段

**成果物**: テキスト装飾機能付きエディタ

---

## Phase 6: エディタ状態管理 + State Pattern
**目標**: エディタモードを実装し、Stateパターンを学ぶ

**実装内容**:
- 編集モード・読み取り専用モード
- 選択モード・挿入モード
- モード切り替え機能

**学習内容**:
- Stateパターンの概念
- 状態遷移の管理
- 条件分岐の整理

**成果物**: 複数モード対応エディタ

---

## Phase 7: 検索機能 + Strategy Pattern
**目標**: 検索機能を実装し、Strategyパターンを学ぶ

**実装内容**:
- 複数の検索アルゴリズム（完全一致、部分一致、正規表現）
- 検索戦略の切り替え
- 検索結果のハイライト

**学習内容**:
- Strategyパターンの概念
- アルゴリズムの交換可能性
- 実行時の戦略変更

**成果物**: 高機能検索付きエディタ

---

## Phase 8: 統合 + Facade Pattern
**目標**: 全機能を統合し、Facadeパターンを学ぶ

**実装内容**:
- エディタAPIの統一
- 複雑な操作の簡素化
- 外部インターフェースの提供

**学習内容**:
- Facadeパターンの概念
- 複雑性の隠蔽
- APIの設計

**成果物**: 完全機能テキストエディタ

---

## 学習進行方法
1. **各Phase開始時**: デザインパターンの理論学習
2. **実装中**: パターンを意識したコーディング
3. **Phase完了時**: 実装の振り返りとパターンの効果確認
4. **次Phase開始前**: 前回パターンの復習

---

# アーキテクチャ要件定義

## 全体アーキテクチャ方針

### 技術スタック
- **フロントエンド**: React 18 + TypeScript
- **状態管理**: Redux Toolkit (複雑な状態用) + Context API (シンプルな状態用)
- **スタイリング**: CSS Modules + Sass
- **ビルドツール**: Vite
- **テストフレームワーク**: Vitest + React Testing Library

### プロジェクト構造
```
src/
├── components/          # UIコンポーネント
├── patterns/           # デザインパターン実装
├── services/           # ビジネスロジック
├── hooks/              # カスタムフック
├── types/              # TypeScript型定義
├── utils/              # ユーティリティ
└── __tests__/          # テストファイル
```

---

## Phase別アーキテクチャ設計

### Phase 1: 基本エディタ + Singleton
**アーキテクチャ構成**:
```
components/
├── Editor.tsx           # メインエディタコンポーネント
└── TextArea.tsx         # テキスト入力エリア

patterns/
└── singleton/
    └── EditorConfig.ts  # エディタ設定Singleton

services/
└── TextService.ts       # テキスト操作サービス
```

**技術選択理由**:
- React関数コンポーネントで基本構造を構築
- TypeScriptでSingletonパターンを型安全に実装
- 状態管理はuseStateから開始

---

### Phase 2: 操作履歴 + Command
**アーキテクチャ構成**:
```
types/
└── CommandTypes.ts         # Command関連型定義

services/
├── CommandService.ts       # Command管理サービス
├── InsertTextCommand.ts    # テキスト挿入Command
├── DeleteTextCommand.ts    # テキスト削除Command
└── ReplaceTextCommand.ts   # テキスト置換Command

hooks/
└── useCommandHistory.ts    # 履歴管理フック

editor/
├── CommandEditor.tsx       # Command統合エディタ
└── CommandTextArea.tsx     # Command対応テキストエリア
```

**設計原則**:
- Commandパターンで操作を抽象化
- 各操作を独立したオブジェクトとして管理
- アンドゥ・リドゥスタックを配列で実装
- React統合でのテキスト同期

---

### Phase 3: UI更新 + Observer
**アーキテクチャ構成**:
```
services/
├── ObserverService.ts       # Observer管理サービス
└── ConfigObserver.ts        # 設定変更Observer

components/
├── StatusBar.tsx           # ステータスバー
├── LineCounter.tsx         # 行番号カウンター
├── CharCounter.tsx         # 文字数カウンター
├── HistoryPanel.tsx        # 履歴表示パネル
└── OperationStats.tsx      # 操作統計パネル

hooks/
└── useObserver.ts         # Observer管理フック
```

**状態管理戦略**:
- Observer PatternでEditorConfig設定変更を監視
- リアルタイム更新はuseEffectで実装
- 複数コンポーネント間の状態同期

---

### Phase 4: ファイル操作 + Factory
**アーキテクチャ構成**:
```
services/
├── FileFactory.ts          # ファイル作成Factory
├── FileService.ts          # ファイル操作サービス
└── StorageService.ts       # ローカル保存サービス

types/
└── FileTypes.ts           # ファイル関連型定義

components/
├── FileMenu.tsx           # ファイルメニュー
└── FileExplorer.tsx       # ファイル一覧
```

**技術要件**:
- ブラウザのFile APIを使用
- LocalStorageでファイル保存
- 非同期処理はasync/awaitで実装

---

### Phase 5: 装飾機能 + Decorator
**アーキテクチャ構成**:
```
patterns/
└── decorator/
    ├── TextDecorator.ts     # Decoratorベースクラス
    ├── BoldDecorator.ts     # 太字装飾
    ├── ItalicDecorator.ts   # イタリック装飾
    └── ColorDecorator.ts    # 色装飾

components/
├── TextRenderer.tsx        # 装飾テキスト表示
└── DecorationToolbar.tsx   # 装飾ツールバー

services/
└── DecorationService.ts    # 装飾管理サービス
```

**CSS設計**:
- CSS ModulesでスタイルをComponent単位で管理
- 装飾の組み合わせはCSS Customプロパティで実装

---

### Phase 6: エディタ状態管理 + State
**アーキテクチャ構成**:
```
patterns/
└── state/
    ├── EditorState.ts       # Stateインターフェース
    ├── EditingState.ts      # 編集状態
    ├── ReadOnlyState.ts     # 読み取り専用状態
    └── SelectionState.ts    # 選択状態

services/
└── StateService.ts         # 状態管理サービス

hooks/
└── useEditorState.ts      # エディタ状態管理フック
```

**状態遷移設計**:
- 有限状態機械として実装
- 状態遷移図をコメントで記述
- 無効な状態遷移は型レベルで防止

---

### Phase 7: 検索機能 + Strategy
**アーキテクチャ構成**:
```
patterns/
└── strategy/
    ├── SearchStrategy.ts    # 検索戦略インターフェース
    ├── ExactSearch.ts       # 完全一致検索
    ├── PartialSearch.ts     # 部分一致検索
    └── RegexSearch.ts       # 正規表現検索

components/
├── SearchBar.tsx           # 検索バー
└── SearchResults.tsx       # 検索結果表示

services/
└── SearchService.ts        # 検索サービス
```

**パフォーマンス要件**:
- 大きなテキストでも高速検索
- 検索結果のキャッシュ機能
- debounce処理でリアルタイム検索

---

### Phase 8: 統合 + Facade
**アーキテクチャ構成**:
```
patterns/
└── facade/
    └── EditorFacade.ts     # エディタ統合インターフェース

services/
└── EditorService.ts       # 統合サービス

types/
└── EditorAPI.ts          # 外部API型定義
```

**API設計**:
- 単一のFacadeクラスで全機能を提供
- 外部ライブラリとの統合ポイント
- プラグインシステムの基盤

---

## 横断的関心事

### エラーハンドリング
- Error Boundaryでコンポーネントレベルのエラーキャッチ
- try-catchで非同期処理のエラーハンドリング
- ユーザーフレンドリーなエラーメッセージ

### パフォーマンス
- React.memoでコンポーネントの再描画最適化
- useCallbackでコールバック関数の最適化
- 大きなテキストファイルの仮想化

### テスト戦略
- 各デザインパターンの単体テスト
- コンポーネントの統合テスト
- E2Eテストで全体フロー確認

### 型安全性
- 厳密なTypeScript設定
- デザインパターンの型定義
- 実行時型チェック

---

## DDD (Domain-Driven Design) アーキテクチャ適用

### 実装日
2025年7月12日

### 変更概要
従来の技術レイヤー型のフォルダ構成をDDD（ドメイン駆動設計）アーキテクチャに変更しました。

### 新しいフォルダ構造
```
src/
├── application/
│   ├── services/
│   │   ├── TextService.ts        # テキスト操作のユースケース
│   │   └── CommandService.ts       # コマンド実行・管理のユースケース
│   └── usecases/                 # 将来的なユースケース拡張用
│
├── domain/
│   ├── text/
│   │   └── entities/             # テキストエンティティ（将来拡張用）
│   ├── command/
│   │   ├── commands/
│   │   │   ├── InsertTextCommand.ts
│   │   │   ├── DeleteTextCommand.ts
│   │   │   └── ReplaceTextCommand.ts
│   │   └── types/
│   │       └── Command.ts          # Commandのインターフェース（旧CommandTypes.ts）
│   ├── config/
│   │   └── entities/
│   │       └── EditorConfig.ts
│   └── observer/
│       ├── services/
│       │   ├── ObserverService.ts  # 汎用的なオブザーバー
│       │   └── ConfigObserver.ts
│       └── types/
│           └── ObserverTypes.ts
│
├── presentation/
│   ├── components/
│   │   ├── editor/
│   │   │   ├── Editor.tsx
│   │   │   └── TextArea.tsx
│   │   ├── command/
│   │   │   ├── CommandEditor.tsx
│   │   │   └── CommandTextArea.tsx
│   │   └── history/
│   │       ├── HistoryPanel.tsx
│   │       ├── HistoryItem.tsx
│   │       └── HistoryStats.tsx
│   ├── hooks/
│   │   └── useCommandHistory.ts      # UIとapplication層を繋ぐフック
│   └── shared/                     # 共有UIコンポーネント
│       ├── button.tsx
│       ├── card.tsx
│       ├── select.tsx
│       ├── switch.tsx
│       └── textarea.tsx
│
├── shared/
│   ├── types/
│   │   └── CommonTypes.ts          # 共通型定義（将来拡張用）
│   └── utils/
│       └── cn.ts
│
└── App.tsx
```

### 変更内容詳細

#### 1. レイヤー分離
- **Application層**: ユースケースとアプリケーションサービス
- **Domain層**: ビジネスロジックとドメインモデル
- **Presentation層**: UI関連の全コンポーネント
- **Shared層**: 共通ユーティリティとタイプ

#### 2. ドメイン分離
- **text**: テキスト処理関連
- **command**: コマンドパターン実装
- **config**: 設定管理
- **observer**: オブザーバーパターン実装

#### 3. テスト構造も同様に変更
```
tests/
├── application/services/
├── domain/
│   ├── command/commands/
│   ├── config/entities/
│   └── observer/services/
└── presentation/
    ├── components/
    │   ├── editor/
    │   └── history/
    └── hooks/
```

### DDD導入によるメリット
1. **関心の分離**: ビジネスロジックとUIが明確に分離
2. **拡張性**: 新しいドメインの追加が容易
3. **保守性**: ドメイン別に構造化されたコード
4. **テスト可能性**: レイヤー別の独立したテスト
5. **チーム開発**: ドメイン別の並行開発が可能

### 影響範囲
- 全ソースファイルのimportパス変更
- 全テストファイルのimportパス変更
- プロジェクト構造の完全な再編成

### 互換性
- 外部APIは変更なし
- コンポーネントの機能は維持
- デザインパターンの実装は保持