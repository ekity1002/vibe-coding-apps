# Singletonパターン学習ドキュメント

## Singletonパターンとは

Singletonパターンは、**クラスのインスタンスが1つしか生成されないことを保証する**デザインパターンです。

### 主な特徴

1. **インスタンスの一意性**: アプリケーション内にインスタンスが1つしか存在しない
2. **グローバルアクセス**: どこからでも唯一のインスタンスにアクセス可能
3. **遅延初期化**: 必要になるまでインスタンス生成を遅らせることができる

### 実装の基本要素

1. **privateコンストラクタ**: 外部からのインスタンス化を防ぐ
2. **静的インスタンス変数**: 自身のクラスのインスタンスを保持
3. **静的取得メソッド**: `getInstance()`のような静的メソッド

## TypeScriptでの実装パターン

### 1. クラシック実装

```typescript
class ClassicSingleton {
  private static instance: ClassicSingleton;
  
  private constructor() {
    // privateコンストラクタで外部からの生成を防ぐ
  }
  
  public static getInstance(): ClassicSingleton {
    if (!ClassicSingleton.instance) {
      ClassicSingleton.instance = new ClassicSingleton();
    }
    return ClassicSingleton.instance;
  }
}

// 使用方法
const config = ClassicSingleton.getInstance();
```

### 2. モダンES Module実装（推奨）

```typescript
// singleton.ts
class ModernSingleton {
  constructor() {
    // 通常のコンストラクタ
  }
}

// モジュールレベルでインスタンスを作成・エクスポート
export const singletonInstance = new ModernSingleton();

// 使用方法
import { singletonInstance } from './singleton';
```

### 実装パターンの比較

| 項目 | クラシック | モダンES |
|------|------------|----------|
| **コンストラクタ** | private | public |
| **アクセス方法** | `getInstance()` | import |
| **インスタンス管理** | 手動制御 | モジュールシステム任せ |
| **学習価値** | デザインパターンを明示的に学べる | シンプルで実用的 |
| **テスト** | リセットメソッド必要 | モジュールモック必要 |

**特徴**: ES Moduleは一度だけ評価されるため、エクスポートされたインスタンスは自然にSingletonになる

## エディタ設定でSingletonが適切な理由

### 1. 設定の一貫性
- エディタ全体で同じ設定（フォントサイズ、テーマ等）を共有する必要がある
- 複数のコンポーネント間で設定の一貫性を保つ

### 2. リソースの効率性
- 設定データの複製を避ける
- メモリ使用量の最適化

### 3. グローバルアクセス
- アプリケーションのどこからでも設定にアクセス可能
- コンポーネント階層を超えた設定の参照

### 4. 状態管理の簡素化
- 設定変更時の同期処理が簡単
- 単一の真実の源（Single Source of Truth）

### 5. 従来のエディタの慣例
- VS Code、Sublime Text等で同様のパターンが使用されている

## メリットとデメリット

### メリット
- ✅ リソースの節約
- ✅ グローバルな状態管理が容易
- ✅ 設定の一貫性を保証
- ✅ アクセスが簡単

### デメリット
- ❌ 単一責任の原則に違反しやすい
- ❌ テストが困難になる場合がある
- ❌ 依存関係が隠蔽される
- ❌ コードの結合度が高くなる

## 実装時の注意点

1. **テスト考慮**: テスト用のリセットメソッドを提供
2. **型安全性**: TypeScriptの型システムを活用
3. **スレッドセーフ**: 必要に応じてスレッドセーフ対応
4. **適用範囲**: 本当にSingletonが必要かを慎重に検討

## 今回のプロジェクトでの使用方針

- **EditorConfig**: エディタ設定管理にSingletonを適用
- **実装方式**: クラシック実装（学習目的のため明示的な実装）
- **テスト対応**: リセットメソッドを含む設計
- **将来拡張**: 後のPhaseでObserverパターンと組み合わせ