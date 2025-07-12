# Phase 4: ファイル操作 + Factory Pattern 実装計画

## 実装日
2025年7月12日

## 概要
Phase 3のObserver Pattern実装が完了し、UIコンフィグシステムが正常に動作することを確認。
次のステップとして、Phase 4でファイル操作機能とFactory Patternを実装する。

## Phase 3 完了状況確認
### ✅ 完了済み機能
- リアルタイム設定変更（フォントサイズ、テーマ、行番号表示、自動保存）
- Observer Patternによるコンポーネント間通知システム
- ConfigObserver実装（基本、テーマ専用、フォントサイズ専用、行番号専用）
- UIコンフィグの表示更新（App.tsx修正済み）
- TextAreaでのフォントサイズ実反映（インラインスタイル適用）

### ✅ 動作確認済み
- Playwright自動テストで全設定変更が正常に動作
- UIとエディタのリアルタイム同期
- Observer Patternの完全動作

## Phase 4 実装目標
ファイル作成・保存機能を実装し、Factory Patternを学習する。

### 実装内容
1. **異なるファイル形式の作成** (.txt, .md, .json)
2. **ファイル作成をFactoryで管理**
3. **ファイル保存・読み込み機能**
4. **ローカルストレージによるファイル管理**

## 詳細実装計画

### 1. アーキテクチャ設計

#### DDD構造に従った配置
```
src/
├── domain/
│   └── file/
│       ├── entities/
│       │   ├── TextFile.ts          # テキストファイルエンティティ
│       │   ├── MarkdownFile.ts      # Markdownファイルエンティティ
│       │   └── JsonFile.ts          # JSONファイルエンティティ
│       ├── factories/
│       │   └── FileFactory.ts       # Factory Pattern実装
│       └── types/
│           └── FileTypes.ts         # ファイル関連型定義
│
├── application/
│   └── services/
│       ├── FileService.ts           # ファイル操作ユースケース
│       └── StorageService.ts        # ローカル保存サービス
│
└── presentation/
    └── components/
        └── file/
            ├── FileMenu.tsx         # ファイルメニュー
            ├── FileExplorer.tsx     # ファイル一覧表示
            ├── SaveDialog.tsx       # 保存ダイアログ
            └── LoadDialog.tsx       # 読み込みダイアログ
```

### 2. Factory Pattern実装

#### FileFactory.ts
```typescript
export abstract class FileFactory {
  abstract createFile(name: string, content: string): FileEntity
  
  static getFactory(type: FileType): FileFactory {
    switch (type) {
      case 'txt': return new TextFileFactory()
      case 'md': return new MarkdownFileFactory()
      case 'json': return new JsonFileFactory()
      default: throw new Error(`Unsupported file type: ${type}`)
    }
  }
}

export class TextFileFactory extends FileFactory {
  createFile(name: string, content: string): TextFile {
    return new TextFile(name, content)
  }
}

export class MarkdownFileFactory extends FileFactory {
  createFile(name: string, content: string): MarkdownFile {
    return new MarkdownFile(name, content)
  }
}

export class JsonFileFactory extends FileFactory {
  createFile(name: string, content: string): JsonFile {
    return new JsonFile(name, content)
  }
}
```

#### ファイルエンティティの基底クラス
```typescript
export abstract class FileEntity {
  constructor(
    public readonly name: string,
    public readonly content: string,
    public readonly type: FileType,
    public readonly createdAt: Date = new Date()
  ) {}
  
  abstract validate(): boolean
  abstract getExtension(): string
  abstract getPreview(): string
}
```

### 3. ファイル操作サービス

#### FileService.ts
```typescript
export class FileService {
  constructor(
    private storageService: StorageService,
    private fileFactory: FileFactory
  ) {}
  
  async createFile(type: FileType, name: string, content: string): Promise<FileEntity> {
    const factory = FileFactory.getFactory(type)
    const file = factory.createFile(name, content)
    
    if (!file.validate()) {
      throw new Error('Invalid file content')
    }
    
    await this.storageService.save(file)
    return file
  }
  
  async loadFile(id: string): Promise<FileEntity> {
    return await this.storageService.load(id)
  }
  
  async listFiles(): Promise<FileEntity[]> {
    return await this.storageService.listAll()
  }
  
  async deleteFile(id: string): Promise<void> {
    await this.storageService.delete(id)
  }
}
```

### 4. UI コンポーネント実装

#### FileMenu.tsx
```typescript
export const FileMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  
  const handleNewFile = (type: FileType) => {
    // 新規ファイル作成ロジック
  }
  
  const handleSave = () => {
    // ファイル保存ロジック
  }
  
  const handleLoad = () => {
    // ファイル読み込みロジック
  }
  
  return (
    <div className="file-menu">
      <Button onClick={() => setIsOpen(!isOpen)}>
        ファイル
      </Button>
      {isOpen && (
        <div className="dropdown-menu">
          <MenuItem onClick={() => handleNewFile('txt')}>新規テキスト</MenuItem>
          <MenuItem onClick={() => handleNewFile('md')}>新規Markdown</MenuItem>
          <MenuItem onClick={() => handleNewFile('json')}>新規JSON</MenuItem>
          <MenuItem onClick={handleSave}>保存</MenuItem>
          <MenuItem onClick={handleLoad}>開く</MenuItem>
        </div>
      )}
    </div>
  )
}
```

### 5. ストレージ実装

#### StorageService.ts
```typescript
export class StorageService {
  private readonly STORAGE_KEY = 'text-editor-files'
  
  async save(file: FileEntity): Promise<void> {
    const files = await this.listAll()
    const updatedFiles = [...files.filter(f => f.name !== file.name), file]
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedFiles))
  }
  
  async load(name: string): Promise<FileEntity> {
    const files = await this.listAll()
    const file = files.find(f => f.name === name)
    if (!file) {
      throw new Error(`File not found: ${name}`)
    }
    return file
  }
  
  async listAll(): Promise<FileEntity[]> {
    const data = localStorage.getItem(this.STORAGE_KEY)
    return data ? JSON.parse(data) : []
  }
  
  async delete(name: string): Promise<void> {
    const files = await this.listAll()
    const filteredFiles = files.filter(f => f.name !== name)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredFiles))
  }
}
```

### 6. Observer Pattern統合

既存のConfigObserverに加えて、ファイル操作のObserverを追加：

#### FileObserver.ts
```typescript
export class FileObserver implements IObserver<FileChangeData> {
  constructor(
    private callback: (data: FileChangeData) => void,
    private options: { id?: string } = {}
  ) {}
  
  update(data: FileChangeData): void {
    this.callback(data)
  }
  
  getId(): string {
    return this.options.id || `file-observer-${Date.now()}`
  }
}

export interface FileChangeData {
  action: 'created' | 'saved' | 'loaded' | 'deleted'
  file: FileEntity
  timestamp: number
}
```

## 実装手順

### Step 1: ドメイン層実装
1. FileTypes.ts - 型定義作成
2. FileEntity.ts - 基底クラス実装
3. 各ファイルエンティティ実装（TextFile, MarkdownFile, JsonFile）
4. FileFactory.ts - Factory Pattern実装

### Step 2: アプリケーション層実装
1. StorageService.ts - ローカルストレージサービス
2. FileService.ts - ファイル操作ユースケース

### Step 3: プレゼンテーション層実装
1. FileMenu.tsx - ファイルメニューコンポーネント
2. FileExplorer.tsx - ファイル一覧コンポーネント
3. SaveDialog.tsx - 保存ダイアログ
4. LoadDialog.tsx - 読み込みダイアログ

### Step 4: 統合とテスト
1. App.tsxにファイル機能統合
2. Factory Patternの動作確認
3. ファイル保存・読み込みテスト
4. Observer PatternとFactory Patternの連携確認

## テスト計画

### 単体テスト
- FileFactory各クラスのテスト
- FileService各メソッドのテスト
- StorageServiceのテスト
- 各ファイルエンティティのバリデーションテスト

### 統合テスト
- ファイル作成から保存までの一連の流れ
- 異なるファイル形式の作成・保存・読み込み
- Observer Patternとの統合動作

### E2Eテスト（Playwright）
- ファイルメニューからの新規作成
- ファイル保存と読み込み
- ファイル一覧表示と削除

## 学習目標

### Factory Pattern
- オブジェクト生成の抽象化
- 拡張性のある設計
- 型安全なファクトリー実装

### 設計原則
- 単一責任の原則（各ファクトリーは一つのファイル型のみ担当）
- 開放閉鎖の原則（新しいファイル形式追加時の拡張性）
- 依存性逆転の原則（抽象に依存、具象に依存しない）

## 完了基準

### 機能面
- [ ] 3種類のファイル形式（txt, md, json）が作成可能
- [ ] ファイルの保存・読み込み・削除が正常動作
- [ ] ファイル一覧表示機能
- [ ] エディタとファイル機能の統合

### 技術面
- [ ] Factory Patternの正しい実装
- [ ] DDDアーキテクチャへの適合
- [ ] 既存Observer Patternとの統合
- [ ] TypeScript型安全性の確保

### テスト面
- [ ] 全単体テストの合格
- [ ] 統合テストの合格
- [ ] Playwrightでの自動テスト合格
- [ ] エラーケースの適切な処理

## 次回Phase準備

Phase 5（Decorator Pattern）への準備として：
- ファイル形式別の装飾機能の基盤準備
- テキスト装飾のためのDOM構造設計
- CSS設計の基盤構築

## 想定課題と対策

### 課題1: ブラウザのファイルAPI制限
**対策**: LocalStorageを主とし、将来的にFile System Access APIへの拡張を検討

### 課題2: 大きなファイルの処理
**対策**: ファイルサイズ制限を設け、仮想化による表示最適化

### 課題3: JSON形式のバリデーション
**対策**: JSON.parseでの例外処理とユーザーフレンドリーなエラーメッセージ

## 実装期間
予定期間: 2-3日
- Day 1: ドメイン層とアプリケーション層
- Day 2: プレゼンテーション層
- Day 3: 統合・テスト・デバッグ