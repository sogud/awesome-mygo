# Awesome MyGo

[![Website](https://img.shields.io/badge/website-mygodock.dev-3fd3f5)](https://mygodock.dev)
[![CI](https://github.com/yldm-tech/awesome-mygo/actions/workflows/ci.yml/badge.svg)](https://github.com/yldm-tech/awesome-mygo/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/yldm-tech/awesome-mygo)](LICENSE)

[MyGo](https://github.com/egoist/mygo) まわりのアプリ、プラグイン、コンポーネント、ドキュメントをひとつのサイトに集めました：**[mygodock.dev](https://mygodock.dev)**。MyGo は Go でデスクトップアプリを作るツールキットで、UI はネイティブ UI でも Web フロントエンドでも作れます。

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · 日本語 · [한국어](README.ko.md)

[![Awesome MyGo](.github/assets/banner.png)](https://mygodock.dev)

## サイトの内容

- **ショーケース**：MyGo で作られた 26 のデスクトップアプリ。それぞれ詳しい説明、スクリーンショット（プロジェクトが用意している場合）、UI の種類（ネイティブ UI か Web フロントエンド）、同じ作者のほかのアプリを載せています。
- **プラグイン**：公式プラグイン 11 件。Web ページ・ネイティブ UI・その両方のどれに使えるかを示し、`mygo-cli` ツールチェーンも紹介します。
- **UI コンポーネント**：MyGo アプリ向けのコンポーネントライブラリ、テーマ、アイコン。
- **状態管理**：MyGo アプリの状態管理と、MyGo 標準のバインドサービス・チャネル・型付きイベント。
- **ドキュメント**：公式ガイド 20 本、コミュニティ記事、公式リソース。
- <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> ですべてを**検索**できます。掲載してほしいプロジェクトがあれば、投稿フォームが項目を書いてくれます。

サイトは簡体字中国語、繁体字中国語、英語、日本語、韓国語に対応しています。どのページも言語ごとに固有のアドレス（`?lang=en`）を持ち、サーバーでレンダリングされ、hreflang リンクと sitemap を備えています。

## 構成

pnpm のモノレポで、[TanStack Start](https://tanstack.com/start) が [Cloudflare Workers](https://workers.cloudflare.com) 上で配信します：

| パス | 内容 |
|---|---|
| `apps/web` | サイト本体：React 19、TanStack Start（サーバーレンダリング）、`@cloudflare/vite-plugin` 付きの Vite。`wrangler.jsonc` で `mygodock.dev` にデプロイします。 |
| `packages/catalog` | データ：`data/*.json`（アプリ、UI コンポーネント、状態管理、プラグイン、記事、ガイド）とその JSON Schema、5 言語の UI 文言、検索、投稿フォームの項目。テストで全項目を検証します。 |

アプリのアイコンは [yldm-tech/ai-logo](https://github.com/yldm-tech/ai-logo) の CDN から配信しています。ai-logo に収録されていない一部のアプリは、`apps/web/public/icons/` にある公式アイコンを使います。

## 開発

Node.js 24 以降と pnpm が必要です。

```sh
pnpm install
pnpm dev          # ローカルのサイト（Workers ランタイムでレンダリング）
pnpm test         # catalog のテスト
pnpm typecheck
pnpm build
pnpm preview      # 本番ビルドを Workers ランタイムで実行
```

`pnpm deploy` は Wrangler でビルドとデプロイを行います。`apps/web/wrangler.jsonc` のドメインのゾーンを持つ Cloudflare アカウントが必要です。

フォームからの直接投稿は、このリポジトリにインストールした GitHub App が行い、その前段に Cloudflare Turnstile と IP ごとのレート制限があります。App には *Contents* と *Pull requests* の読み書き権限を与え、秘密鍵を PKCS#8 に変換し（`openssl pkcs8 -topk8 -nocrypt -in key.pem -out key-pkcs8.pem`）、`apps/web` で `wrangler secret put` を使って 4 つのシークレットを設定します：`GITHUB_APP_ID`、`GITHUB_APP_PRIVATE_KEY`（PKCS#8 のファイル）、`TURNSTILE_SITE_KEY`、`TURNSTILE_SECRET_KEY`。4 つすべてがそろうまで、フォームは GitHub へのリンクだけを表示します。ローカルで試すときは、Turnstile の[テスト用キー](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)を `apps/web/.dev.vars` に書きます。

## プロジェクトを追加する

すべての項目は [`packages/catalog/data`](packages/catalog/data) の JSON ファイルにあり、カテゴリごとに 1 ファイルです：

| ファイル | 内容 |
|---|---|
| `apps.json` | MyGo で作られたアプリ |
| `ui.json` | UI コンポーネントライブラリ |
| `state.json` | 状態管理 |
| `plugins.json` | プラグイン |
| `articles.json` | 記事 |
| `docs.json` | MyGo 公式ガイド |

追加の方法は 2 つあります：

- **サイトから：** 「投稿」を押してフォームに入力するか、項目を JSON のまま貼り付けて、そのまま投稿します。GitHub アカウントは不要で、サイトの bot がプルリクエストを作ります。GitHub アカウントがあれば、作られた項目を Issue として送ったり、GitHub のエディタで JSON ファイルを開いて自分で追加したりもできます。
- **リポジトリで：** ファイルのリストにオブジェクトを追加し、プルリクエストを送ります。

`apps.json` の項目は次のとおりです：

```json
{
  "slug": "my-app",
  "name": "My App",
  "author": "your-github-login",
  "kind": "native",
  "url": "https://my-app.dev",
  "repo": "you/my-app",
  "summary": { "en": "One line about the app.", "ja": "アプリの一行説明。" },
  "description": { "en": "A few sentences for the detail drawer." }
}
```

- `url` はアプリのホームページです。公式サイト、なければリポジトリの URL で、GitHub でなくてもかまいません。オープンソースのアプリは `repo` に GitHub リポジトリ（`owner/name`）を書き、クローズドソースなら省きます。
- テキストの欄は言語ごとに 1 つずつ書きます。`en` は必須で、`zh-CN`、`zh-TW`、`ja`、`ko` は任意です。欠けている言語では英語が表示されます。
- 各ファイルは `$schema` で自分の JSON Schema（`data/schema/`）を指しているので、VS Code などのエディタが入力中に補完とチェックをします。
- リンクは https のみです。スクリーンショットは幅 1200px 程度の WebP を `apps/web/public/shots/` に置き、`"screenshot": "my-app.webp"` と書きます。アプリのアイコンは [ai-logo](https://github.com/yldm-tech/ai-logo) の id で `"icon": { "ailogo": "<id>" }` と書くか、省略して文字のタイルにします。
- `pnpm test` は全項目を検証し、誤りのあるファイル、項目、欄を示します。CI はすべてのプルリクエストで実行します。

UI の文言は `packages/catalog/locales/` にあり、言語ごとに同じキーを持つ JSON ファイルが 1 つずつあります。基準は `zh-CN.json` です。キーを追加するときは残り 4 ファイルにも加えてください。キーの抜けや `{x}`/`{n}` プレースホルダーの不一致は `pnpm typecheck` と `pnpm test` が検出します。

## クレジット

- [MyGo](https://github.com/egoist/mygo) は [egoist](https://github.com/egoist) が作っています（MIT）。ショーケース、プラグイン、ガイドのデータはそのリポジトリとサイトに沿っています。
- アプリのアイコンは [yldm-tech/ai-logo](https://github.com/yldm-tech/ai-logo)（MIT）またはアプリ自身のアイコン、スクリーンショットは egoist/mygo のショーケースと各プロジェクトの README からのものです。いずれも各アプリの作者に帰属し、名称とロゴは各社の商標で、識別のためにのみ表示しています。

## ライセンス

コードは [MIT ライセンス](LICENSE)で公開しています。
