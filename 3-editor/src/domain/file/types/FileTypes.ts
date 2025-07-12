/**
 * ファイル操作関連の型定義
 * 
 * Factory Patternの実装において、ファイルの種類や操作を
 * 型安全に管理するための型定義群
 */

/**
 * サポートするファイル形式の列挙型
 * 
 * Factory Patternにおいて、どの具象ファクトリーを使用するかを
 * 決定する際のキーとして使用される
 */
export type FileType = 'txt' | 'md' | 'json'

/**
 * ファイル操作の種類
 * 
 * Observer Patternとの統合において、ファイル操作の通知時に使用
 */
export type FileOperation = 'create' | 'save' | 'load' | 'delete' | 'update'

/**
 * ファイルのメタデータ情報
 * 
 * 全てのファイルエンティティが持つ共通のメタデータ
 */
export interface FileMetadata {
  /** ファイル名（拡張子を含む） */
  readonly name: string
  /** ファイルの種類 */
  readonly type: FileType
  /** 作成日時 */
  readonly createdAt: Date
  /** 最終更新日時 */
  readonly updatedAt: Date
  /** ファイルサイズ（文字数） */
  readonly size: number
  /** ファイルの一意識別子 */
  readonly id: string
}

/**
 * ファイルの内容情報
 * 
 * ファイルの実際の内容とその形式に関する情報
 */
export interface FileContent {
  /** ファイルの内容（テキスト） */
  readonly content: string
  /** 内容のエンコーディング */
  readonly encoding: string
  /** 内容が変更されているかどうか */
  readonly isDirty: boolean
}

/**
 * ファイル操作の結果
 * 
 * Factory Patternで生成されたファイルの操作結果を表現
 */
export interface FileOperationResult {
  /** 操作が成功したかどうか */
  readonly success: boolean
  /** エラーメッセージ（失敗時） */
  readonly error?: string
  /** 操作対象のファイル */
  readonly file?: FileMetadata
  /** 操作の種類 */
  readonly operation: FileOperation
  /** 操作実行時刻 */
  readonly timestamp: Date
}

/**
 * ファイルバリデーションの結果
 * 
 * ファイルエンティティのバリデーション結果を表現
 */
export interface FileValidationResult {
  /** バリデーションが成功したかどうか */
  readonly isValid: boolean
  /** エラーメッセージの配列 */
  readonly errors: string[]
  /** 警告メッセージの配列 */
  readonly warnings: string[]
}

/**
 * ファイル作成時のオプション
 * 
 * Factory Patternでファイルを作成する際の設定オプション
 */
export interface FileCreationOptions {
  /** ファイル名（省略時は自動生成） */
  name?: string
  /** 初期内容 */
  content?: string
  /** エンコーディング（デフォルト: UTF-8） */
  encoding?: string
  /** メタデータ */
  metadata?: Partial<FileMetadata>
}

/**
 * ファイルのプレビュー情報
 * 
 * ファイル一覧表示時に使用される軽量な情報
 */
export interface FilePreview {
  /** ファイルメタデータ */
  readonly metadata: FileMetadata
  /** プレビュー用の短縮内容（最初の数行） */
  readonly preview: string
  /** ファイルアイコン用の拡張子 */
  readonly extension: string
}

/**
 * ファイル検索条件
 * 
 * ファイル一覧の検索・フィルタリング時に使用
 */
export interface FileSearchCriteria {
  /** ファイル名による検索（部分一致） */
  namePattern?: string
  /** ファイル種類による絞り込み */
  types?: FileType[]
  /** 作成日時の範囲指定 */
  createdDateRange?: {
    from?: Date
    to?: Date
  }
  /** ファイルサイズの範囲指定 */
  sizeRange?: {
    min?: number
    max?: number
  }
}

/**
 * Factory Pattern実装における定数定義
 */
export const FILE_CONSTANTS = {
  /** デフォルトエンコーディング */
  DEFAULT_ENCODING: 'UTF-8',
  /** 最大ファイルサイズ（文字数） */
  MAX_FILE_SIZE: 1000000,
  /** プレビューの最大文字数 */
  PREVIEW_MAX_LENGTH: 200,
  /** デフォルトファイル名のプレフィックス */
  DEFAULT_NAME_PREFIX: 'untitled',
  /** 拡張子とMIMEタイプのマッピング */
  EXTENSIONS: {
    txt: '.txt',
    md: '.md',
    json: '.json'
  } as const,
  /** MIMEタイプの定義 */
  MIME_TYPES: {
    txt: 'text/plain',
    md: 'text/markdown',
    json: 'application/json'
  } as const
} as const

/**
 * エラーメッセージの定数
 * 
 * Factory Patternの実装で使用するエラーメッセージ
 */
export const FILE_ERROR_MESSAGES = {
  INVALID_FILE_TYPE: 'サポートされていないファイル形式です',
  FILE_NOT_FOUND: 'ファイルが見つかりません',
  FILE_TOO_LARGE: 'ファイルサイズが上限を超えています',
  INVALID_FILE_NAME: '無効なファイル名です',
  INVALID_JSON_FORMAT: 'JSONの形式が正しくありません',
  STORAGE_ERROR: 'ストレージへの保存に失敗しました',
  ENCODING_ERROR: 'エンコーディングエラーが発生しました'
} as const