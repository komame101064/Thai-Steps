# Thai Steps — Claude開発引き継ぎ用

日本語話者向けのタイ語学習Webアプリです。最初に `CLAUDE.md`、次に `docs/HANDOFF_JA.md` を読んでください。

## 起動

Node.js 18以降を使う場合（npm install不要）：

```sh
npm run dev
```

http://localhost:8000/ を開きます。


Python 3を使う場合（追加パッケージ不要）：

```sh
python -m http.server 8000 --bind 127.0.0.1 --directory dist
```

ブラウザで http://localhost:8000/ を開きます。Windowsで `python` が使えない場合は `py -3` に置き換えてください。

`dist/index.html` をダブルクリックするとJSONのfetchが失敗することがあるため、HTTPサーバーで起動します。

## 動作テスト

Node.jsが必要です。依存パッケージのインストールは不要です。

```sh
npm test
```

Pythonから起動する場合は `python tools/run_tests.py` でも実行できます。

現在8テスト（校閲統合の検証 `tests/review.test.cjs` を含む）がすべて成功します。言語データの全件正確性を保証するテストではありません。`main` へのpushでテスト後にGitHub Pagesへ `dist/` を公開します（`.github/workflows/pages.yml`）。

## フォルダ

- `dist/`：そのまま配信できるHTML・CSS・JavaScript・フォント・アイコン・データ
- `scripts/`：データ生成・整備用コードと編集用データ
- `scripts/expansion/`：追加語の作成仕様（SPEC.md）・点検手順（REVIEW.md）・検証スクリプトと、回ごとの作成・点検結果
- `scripts/full-review/`：全件校閲パッチ（統合済み）と適用記録 `applied-changes.json`。アプリは直接読み込みません
- `tests/`：Node.jsの回帰テスト
- `docs/`：機能・データ仕様・校閲の引き継ぎ情報
- `.openai/hosting.json`：元のSites用設定（参考）。独自ホスティングで必須ではありません

ビルド工程、APIキー、サーバー、DBは不要です。`dist/`を静的ホスティングへ配置できます。

## 現在の状態

- 動くアプリ本体はソースコミット `3ccc33c09c30d570bf731656b6eeee56b785c338` を基準としています。
- 元の公開URL：https://thai-grammar-path-kimoto.viridjewel.chatgpt.site
- 由来ラベルの「中国由来」への統一を含みます。歴史的な区分は詳細に表示します。
- 全件校閲パッチは **dist へ統合済み** です（7,624語義のうち7,616を確認済み。疑義のあった8語義のうち4つを除外して保管し、4つは `needs-source` として「要確認」表示・出題対象外）。集計は `dist/full-review.json`、未解決点は `docs/REVIEW_STATUS.json` を参照してください。AIによる校閲で、母語話者の認証・音声の実聴ではありません。
- 2万語には達していません。公開見出しは重複を除いて6,067語です（元の5,077語＋第1回の追加990語）。追加語はAIが作成し、別担当のAIが1語ずつ点検したもので、母語話者の確認は入っていません。手順は `docs/HANDOFF_JA.md` の7節を参照してください。

## ライセンス

データの元資料・加工方法・ライセンスは `dist/sources.html` と各ライセンスファイルを参照してください。語彙データはCC BY-SA 4.0に基づく帰属表示などの条件があります。フォントにも同梱ライセンスがあります。
