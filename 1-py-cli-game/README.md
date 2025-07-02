# CLIバトルゲーム

シンプルなコマンドラインのバトルゲームです。Docker Compose を使って簡単に実行できます。

## 必要なもの
*   Docker
*   Docker Compose

## 遊び方

以下のコマンドを実行すると、ゲームが起動します。

```bash
docker compose run --build --rm app
```

ゲームが始まったら、矢印キー（または `w` `s` キー）で「Attack」か「Heal」を選択し、Enterキーで決定してください。

## テストの実行方法

単体テストを実行するには、以下のコマンドを使用します。

```bash
docker compose run --build test
```

## ファイル構成

*   `main.py`: ゲーム本体のロジック
*   `test_main.py`: `main.py` の単体テスト
*   `Dockerfile`: アプリケーション実行用のDockerfile
*   `Dockerfile.test`: テスト実行用のDockerfile
*   `docker-compose.yml`: `app` と `test` サービスを定義
*   `requirements.txt`: Pythonの依存ライブラリ