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

このZIPの公開版相当のコードについて、2026-11-11の引き継ぎ時に7テストを実行し、すべて成功しました。言語データの全件正確性を保証するテストではありません。

## フォルダ

- `dist/`：そのまま配信できるHTML・CSS・JavaScript・フォント・アイコン・データ
- `scripts/`：データ生成・整備用コードと編集用データ
- `scripts/full-review/`：未反映の全件校閲パッチ。アプリは直接読み込みません
- `tests/`：Node.jsの回帰テスト
- `docs/`：機能・データ仕様・校閲の引き継ぎ情報
- `.openai/hosting.json`：元のSites用設定（参考）。独自ホスティングで必須ではありません

ビルド工程、APIキー、サーバー、DBは不要です。`dist/`を静的ホスティングへ配置できます。

## 現在の状態

- 動くアプリ本体はソースコミット `3ccc33c09c30d570bf731656b6eeee56b785c338` を基準としています。
- 元の公開URL：https://thai-grammar-path-kimoto.viridjewel.chatgpt.site
- 由来ラベルの「中国由来」への統一を含みます。歴史的な区分は詳細に表示します。
- 全件校閲の大規模パッチは **未反映** です。回収範囲と未解決点は `docs/REVIEW_STATUS.json` を参照してください。
- 新しい2万語が教材に登録された状態ではありません。公開見出しは重複を除いて5,077語です。

## ライセンス

データの元資料・加工方法・ライセンスは `dist/sources.html` と各ライセンスファイルを参照してください。語彙データはCC BY-SA 4.0に基づく帰属表示などの条件があります。フォントにも同梱ライセンスがあります。
