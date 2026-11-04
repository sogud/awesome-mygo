# Awesome MyGo

[![Website](https://img.shields.io/badge/website-mygodock.dev-3fd3f5)](https://mygodock.dev)
[![CI](https://github.com/yldm-tech/awesome-mygo/actions/workflows/ci.yml/badge.svg)](https://github.com/yldm-tech/awesome-mygo/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/yldm-tech/awesome-mygo)](LICENSE)

把圍繞 [MyGo](https://github.com/egoist/mygo) 的應用、外掛、元件和文件收集在一個網站裡：**[mygodock.dev](https://mygodock.dev)**。MyGo 是用 Go 打造桌面應用的工具包，介面可以是原生 UI，也可以是 Web 前端。

[English](README.md) · [简体中文](README.zh-CN.md) · 繁體中文 · [日本語](README.ja.md) · [한국어](README.ko.md)

[![Awesome MyGo](.github/assets/banner.png)](https://mygodock.dev)

## 網站內容

- **作品**：26 款用 MyGo 打造的桌面應用，每款都有完整介紹、截圖（專案有提供時）、介面類型（原生 UI 或 Web 前端），以及同一作者的其他作品。
- **外掛**：11 個官方外掛，標明適用於網頁、原生 UI 還是兩者，另有 `mygo-cli` 工具鏈。
- **UI 元件**：為 MyGo 應用打造的元件庫、主題與圖示。
- **狀態管理**：MyGo 應用的狀態方案，以及 MyGo 內建的綁定服務、通道和型別化事件。
- **文件**：20 篇官方指南、一篇社群文章和官方資源。
- 用 <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> **搜尋**全部內容；想收錄某個專案時，提交表單會替你寫好條目。

網站支援簡體中文、繁體中文、英語、日語和韓語。每個頁面在每種語言下都有獨立網址（`?lang=en`），由伺服器端渲染，並帶有 hreflang 連結和 sitemap。

## 技術實作

pnpm monorepo，由 [TanStack Start](https://tanstack.com/start) 執行在 [Cloudflare Workers](https://workers.cloudflare.com) 上：

| 路徑 | 內容 |
|---|---|
| `apps/web` | 網站：React 19、TanStack Start（伺服器端渲染），以及帶 `@cloudflare/vite-plugin` 的 Vite。`wrangler.jsonc` 把它部署到 `mygodock.dev`。 |
| `packages/catalog` | 資料：`data/*.json`（應用、UI 元件、狀態方案、外掛、文章、指南）及其 JSON Schema，五種語言的介面文案，搜尋與提交表單的條目。測試會驗證每個條目。 |

應用圖示來自 [yldm-tech/ai-logo](https://github.com/yldm-tech/ai-logo)，由它的 CDN 提供；它未收錄的少數應用使用 `apps/web/public/icons/` 裡的官方圖示。

## 本機開發

需要 Node.js 24 或更新版本，以及 pnpm。

```sh
pnpm install
pnpm dev          # 本機網站，由 Workers 執行環境渲染
pnpm test         # catalog 測試
pnpm typecheck
pnpm build
pnpm preview      # 在 Workers 執行環境中執行正式建置
```

`pnpm deploy` 會用 Wrangler 建置並部署，需要一個包含 `apps/web/wrangler.jsonc` 中網域 zone 的 Cloudflare 帳戶。

表單的直接提交透過安裝在本倉庫上的 GitHub App 完成，前面有 Cloudflare Turnstile 人機驗證和依 IP 的限流。給這個 App 開 *Contents* 和 *Pull requests* 的讀寫權限，把它的私鑰轉成 PKCS#8（`openssl pkcs8 -topk8 -nocrypt -in key.pem -out key-pkcs8.pem`），然後在 `apps/web` 下用 `wrangler secret put` 設定四個 secret：`GITHUB_APP_ID`、`GITHUB_APP_PRIVATE_KEY`（PKCS#8 檔案）、`TURNSTILE_SITE_KEY` 和 `TURNSTILE_SECRET_KEY`。四個都設好之前，表單只提供 GitHub 連結。本機測試時，把 Turnstile 的[測試金鑰](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)寫進 `apps/web/.dev.vars`。

## 收錄專案

所有條目都在 [`packages/catalog/data`](packages/catalog/data) 下的 JSON 檔案裡，每個類別一個檔案：

| 檔案 | 內容 |
|---|---|
| `apps.json` | 用 MyGo 做的應用 |
| `ui.json` | UI 元件庫 |
| `state.json` | 狀態管理 |
| `plugins.json` | 外掛 |
| `articles.json` | 文章 |
| `docs.json` | MyGo 官方指南 |

新增方式有兩種：

- **在網站上：** 點「提交」填表，或者直接貼上整條 JSON 條目，然後提交：不需要 GitHub 帳號，網站的 bot 會替你開 PR。有 GitHub 帳號的話，也可以把產生的條目提交為 Issue，或在 GitHub 編輯器裡開啟對應的 JSON 檔案自己加上。
- **在倉庫裡：** 在檔案的清單裡加一個物件，然後提 PR。

`apps.json` 中的一個條目長這樣：

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

- `url` 是應用首頁：官網，沒有官網就填倉庫網址，不要求在 GitHub 上。開源應用再用 `repo` 填 GitHub 倉庫（`owner/name`），閉源應用不填。
- 文字欄位依語言各寫一份。`en` 必填；`zh-CN`、`zh-TW`、`ja`、`ko` 可選，缺少的語言顯示英文。
- 每個檔案都在 `$schema` 裡指向自己的 JSON Schema（在 `data/schema/`），VS Code 等編輯器會在你輸入時補全並檢查欄位。
- 連結必須是 https。截圖請把寬約 1200px 的 WebP 放進 `apps/web/public/shots/`，並寫 `"screenshot": "my-app.webp"`。應用圖示寫 `"icon": { "ailogo": "<id>" }`，id 來自 [ai-logo](https://github.com/yldm-tech/ai-logo)；不寫則顯示字母圖示。
- `pnpm test` 會驗證每個條目，出錯時指出檔案、條目和欄位。CI 會在每個 PR 上執行它。

介面文案在 `packages/catalog/locales/`，每種語言一個 JSON 檔案，鍵完全相同。`zh-CN.json` 是基準：新增的鍵要同時加進其餘四個檔案；缺鍵或 `{x}`/`{n}` 佔位符不一致時，`pnpm typecheck` 和 `pnpm test` 會報錯。

## 致謝

- [MyGo](https://github.com/egoist/mygo) 由 [egoist](https://github.com/egoist) 建立（MIT）。作品、外掛和指南的資料以它的倉庫和官網為準。
- 應用圖示來自 [yldm-tech/ai-logo](https://github.com/yldm-tech/ai-logo)（MIT）或應用自己的圖示；截圖來自 egoist/mygo 的作品展示和各專案的 README。兩者都歸各應用作者所有，名稱和標誌是其商標，僅用於識別。

## 授權

程式碼以 [MIT 授權](LICENSE) 發布。
