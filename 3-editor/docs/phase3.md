# Phase 3: Observer Pattern 実装計画

## 概要

Phase 3では **Observer Pattern** を中心としたリアルタイム更新機能を実装します。
エディタ設定の変更監視、複数コンポーネント間の状態同期、履歴パネルの表示機能を提供し、
ユーザビリティとリアクティブ性を向上させます。

---

## 学習目標

### デザインパターン学習
- **Observer Pattern**: オブジェクトの状態変化を監視・通知する
- **Subject-Observer関係**: 疎結合な通知システム
- **Event-driven Programming**: イベント駆動設計の実践

### 技術的スキル
- React Context API での状態管理
- カスタムフックでのObserver実装
- useEffect による副作用管理
- 複数コンポーネント間の状態同期

---

## 実装スケジュール

### Task 3.1: Observer Pattern の基礎設計
**学習フォーカス**: Observer Pattern の理論と設計

#### 3.1.1 Observer インターフェースの設計
- `IObserver` インターフェースの定義
- `ISubject` インターフェースの定義
- 通知メカニズムの基本設計

#### 3.1.2 ObserverService の実装
- 観察者の登録・解除機能
- 通知の配信機能
- 型安全な通知システム

**成果物**:
```
src/types/
└── ObserverTypes.ts        # Observer関連型定義

src/services/
├── ObserverService.ts      # Observer管理サービス
└── ConfigObserver.ts       # 設定変更Observer
```

---

### Task 3.2: EditorConfig の Observer 対応
**学習フォーカス**: Singleton Pattern + Observer Pattern の統合

#### 3.2.1 EditorConfig の拡張
- Observer機能の追加
- 設定変更時の通知機能
- window.location.reload() の除去

#### 3.2.2 設定変更の監視
- テーマ変更の即座反映
- フォントサイズ変更の即座反映
- 行番号表示設定の即座反映

**成果物**:
```
src/config/
└── EditorConfig.ts         # Observer対応済み設定

src/hooks/
└── useEditorSettings.ts    # 設定監視フック
```

---

### Task 3.3: 履歴パネルの実装
**学習フォーカス**: Command Pattern + Observer Pattern の統合

#### 3.3.1 履歴表示コンポーネント
- 操作履歴の一覧表示
- 任意の履歴ポイントへのジャンプ
- 履歴の視覚的な表現

#### 3.3.2 リアルタイム更新
- Command実行時の自動更新
- 履歴変更の即座反映
- パフォーマンス最適化

**成果物**:
```
src/components/
├── HistoryPanel.tsx        # 履歴表示パネル
├── HistoryItem.tsx         # 履歴項目
└── HistoryStats.tsx        # 履歴統計
```

---

### Task 3.4: 操作統計の実装
**学習フォーカス**: データ可視化とリアルタイム更新

#### 3.4.1 統計データの収集
- 操作回数の統計
- 操作タイプ別の分析
- 時間別の操作パターン

#### 3.4.2 統計表示コンポーネント
- 操作統計の可視化
- リアルタイム更新
- ユーザビリティ指標

**成果物**:
```
src/components/
├── OperationStats.tsx      # 操作統計パネル
├── StatsChart.tsx          # 統計グラフ
└── StatsCounter.tsx        # 統計カウンター
```

---

### Task 3.5: ステータスバーの実装
**学習フォーカス**: 複数情報の統合表示

#### 3.5.1 ステータスバーコンポーネント
- 文字数・行数の表示
- 現在の操作状態表示
- エディタ設定の表示

#### 3.5.2 リアルタイム更新機能
- テキスト変更時の自動更新
- 設定変更時の自動更新
- パフォーマンス最適化

**成果物**:
```
src/components/
├── StatusBar.tsx           # ステータスバー
├── LineCounter.tsx         # 行数カウンター
└── CharCounter.tsx         # 文字数カウンター
```

---

## TDD 実装アプローチ

### Phase 3 での TDD サイクル

#### Red フェーズ
1. Observer インターフェースのテスト作成
2. ObserverService のテスト作成
3. EditorConfig 通知機能のテスト作成
4. 履歴パネルのテスト作成
5. 統計機能のテスト作成

#### Green フェーズ
1. 最小限の Observer 実装
2. EditorConfig の Observer 対応
3. 履歴パネルの基本機能実装
4. 統計機能の基本実装
5. ステータスバーの実装

#### Refactor フェーズ
1. パフォーマンス最適化
2. メモリリーク対策
3. TypeScript 型安全性の向上
4. コンポーネント最適化

---

## 技術要件

### TypeScript 設計原則
```typescript
// Observer インターフェース例
interface IObserver<T = any> {
  update(data: T): void
  getId(): string
}

// Subject インターフェース例
interface ISubject<T = any> {
  attach(observer: IObserver<T>): void
  detach(observer: IObserver<T>): void
  notify(data: T): void
}

// ObserverService 例
class ObserverService<T = any> implements ISubject<T> {
  private observers: Map<string, IObserver<T>> = new Map()
  
  attach(observer: IObserver<T>): void
  detach(observer: IObserver<T>): void
  notify(data: T): void
}
```

### React 統合パターン
```typescript
// useObserver カスタムフック
function useObserver<T>(
  subject: ISubject<T>,
  callback: (data: T) => void
): void {
  useEffect(() => {
    const observer = new CallbackObserver(callback)
    subject.attach(observer)
    return () => subject.detach(observer)
  }, [subject, callback])
}

// 設定監視フック
function useEditorSettings() {
  const [settings, setSettings] = useState(() => 
    EditorConfig.getInstance().getSettings()
  )
  
  useObserver(
    EditorConfig.getInstance(),
    (newSettings) => setSettings(newSettings)
  )
  
  return settings
}
```

---

## パフォーマンス考慮

### 1. メモリリーク対策
```typescript
// Observer の適切な解除
useEffect(() => {
  const observer = new MyObserver()
  subject.attach(observer)
  
  return () => {
    subject.detach(observer)  // 必須: クリーンアップ
  }
}, [])
```

### 2. 過度な再レンダリング対策
```typescript
// React.memo によるコンポーネント最適化
const HistoryPanel = React.memo<HistoryPanelProps>(({ history }) => {
  // 履歴が変わった時のみ再レンダリング
})

// useCallback によるコールバック最適化
const handleHistoryUpdate = useCallback((newHistory) => {
  setHistory(newHistory)
}, [])
```

### 3. 大量データ対応
```typescript
// 仮想化による長い履歴の効率表示
const VirtualizedHistoryList = ({ items }) => {
  const [visibleItems, setVisibleItems] = useState(
    items.slice(0, VISIBLE_COUNT)
  )
  
  // スクロール時の動的読み込み
}
```

---

## 期待される学習効果

### デザインパターン理解
1. **Observer Pattern**
   - 状態変化の監視と通知
   - 疎結合なコンポーネント設計
   - イベント駆動アーキテクチャ

2. **パターンの組み合わせ**
   - Singleton + Observer (EditorConfig)
   - Command + Observer (履歴監視)
   - Factory + Observer (将来のファイル通知)

### React 実践スキル
- Context API による状態管理
- カスタムフックの設計
- パフォーマンス最適化技術
- 副作用の適切な管理

---

## Phase 4 への準備

Phase 3 完了後は以下の機能が実装済みとなり、Phase 4 (Factory Pattern) への基盤が整います：

- ✅ Observer Pattern による設定変更通知
- ✅ 履歴パネルと操作統計の表示
- ✅ 複数コンポーネント間のリアルタイム同期
- ✅ ステータスバーの実装
- ✅ パフォーマンス最適化済みのUI

これらの機能により、Phase 4 でのファイル操作機能の実装時に、
ファイル状態の監視や操作通知が容易になります。

---

## 開発スケジュール

| タスク | 期間 | 主要成果物 | 学習ポイント |
|--------|------|------------|--------------|
| Task 3.1 | 1日 | Observer基礎設計 | Observer Pattern理論 |
| Task 3.2 | 1日 | EditorConfig拡張 | Singleton + Observer |
| Task 3.3 | 1日 | 履歴パネル実装 | Command + Observer |
| Task 3.4 | 1日 | 操作統計実装 | データ可視化 |
| Task 3.5 | 1日 | ステータスバー実装 | 統合UI設計 |

**合計期間**: 5日間
**予想テスト数**: 約50テスト追加（Phase 2の35テストに追加）
**予想コード行数**: 約1000行追加

---

## 実装上の課題と対策

### 課題1: メモリリークの防止
**対策**: useEffect のクリーンアップ関数を確実に実装

### 課題2: 過度な再レンダリング
**対策**: React.memo、useCallback、useMemo の適切な活用

### 課題3: Observer の循環参照
**対策**: WeakMap による弱参照の活用

### 課題4: 通知の順序制御
**対策**: 優先度付きQueue による通知管理

---

## まとめ

Phase 3 では Observer Pattern の実装を通じて、以下の技術的成果を目指します：

### 技術的目標
- リアルタイム更新機能の実装
- 疎結合なコンポーネント設計
- パフォーマンス最適化済みのUI
- 型安全な通知システム

### 学習効果
- **Observer Pattern の実践的理解**
- **React での状態管理パターン**
- **パフォーマンス最適化技術**
- **複数パターンの組み合わせ設計**

この実装により、Phase 4 での Factory Pattern 実装に向けた、
堅牢で拡張可能な基盤が完成します。