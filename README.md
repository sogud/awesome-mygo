# Awesome MyGo

[![Website](https://img.shields.io/badge/website-mygodock.dev-3fd3f5)](https://mygodock.dev)
[![CI](https://github.com/yldm-tech/awesome-mygo/actions/workflows/ci.yml/badge.svg)](https://github.com/yldm-tech/awesome-mygo/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/yldm-tech/awesome-mygo)](LICENSE)

The apps, plugins, components and guides around [MyGo](https://github.com/egoist/mygo), the Go toolkit for desktop apps with native UI or a web frontend, collected on one site: **[mygodock.dev](https://mygodock.dev)**.

English · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

[![Awesome MyGo](.github/assets/banner.png)](https://mygodock.dev)

## What is on the site

- **Showcase**: 26 desktop apps built with MyGo. Each has its full description, a screenshot where the project has one, its interface (native UI or web frontend) and its other apps by the same author.
- **Plugins**: the 11 official plugins, marked by the kind of window they serve (web pages, native UI or both), plus the `mygo-cli` toolchain.
- **UI components**: component libraries, themes and icons made for MyGo apps.
- **State**: state management for MyGo apps, beside MyGo's own bound services, channels and typed events.
- **Learn**: the 20 official guides, a community article and the official resources.
- **Search** across everything with <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd>, and a form that writes the entry for a project you want listed.

The site speaks Simplified Chinese, Traditional Chinese, English, Japanese and Korean. Every page has its own address per language (`?lang=en`), is rendered on the server, and has hreflang links and a sitemap.

## How it is built

A pnpm monorepo, served by [TanStack Start](https://tanstack.com/start) on [Cloudflare Workers](https://workers.cloudflare.com):

| Path | What it holds |
|---|---|
| `apps/web` | The site: React 19, TanStack Start (server rendering) and Vite with `@cloudflare/vite-plugin`. `wrangler.jsonc` deploys it to `mygodock.dev`. |
| `packages/catalog` | The data: `data/*.json` (apps, UI components, state solutions, plugins, articles, guides) and their JSON Schemas, the UI copy in five languages, search and the submit form's entries. Its tests validate every entry. |

App icons come from [yldm-tech/ai-logo](https://github.com/yldm-tech/ai-logo), served by its CDN; the few apps it does not list use their official icon from `apps/web/public/icons/`.

## Development

Requires Node.js 24 or later and pnpm.

```sh
pnpm install
pnpm dev          # local site, rendered by the Workers runtime
pnpm test         # catalog tests
pnpm typecheck
pnpm build
pnpm preview      # the production build in the Workers runtime
```

`pnpm deploy` builds and deploys with Wrangler. It needs a Cloudflare account that holds the zone of the domain in `apps/web/wrangler.jsonc`.

Direct submissions from the form go through a GitHub App installed on this repository, with Cloudflare Turnstile and a per-IP rate limit in front of it. Give the app *Contents* and *Pull requests* read and write access, convert its private key to PKCS#8 (`openssl pkcs8 -topk8 -nocrypt -in key.pem -out key-pkcs8.pem`), and set four secrets with `wrangler secret put` in `apps/web`: `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY` (the PKCS#8 file), `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. Until all four are set, the form offers only the GitHub links. For local testing, put Turnstile's [test keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) in `apps/web/.dev.vars`.

## Adding a project

Every entry lives in a JSON file under [`packages/catalog/data`](packages/catalog/data), one file per category:

| File | Lists |
|---|---|
| `apps.json` | Apps built with MyGo |
| `ui.json` | UI component libraries |
| `state.json` | State management |
| `plugins.json` | Plugins |
| `articles.json` | Articles |
| `docs.json` | MyGo's guides |

There are two ways to add one:

- **On the site:** click "Submit" and fill in the form, or paste a whole entry as JSON, then submit it directly: no GitHub account needed, the site's bot opens the pull request for you. With a GitHub account you can also send the generated entry as an issue, or open the JSON file in GitHub's editor and add it yourself.
- **In the repository:** add an object to the list in the file and open a pull request.

An entry in `apps.json` looks like this:

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

- `url` is the app's homepage: its website, or its repository if it has none; it need not be on GitHub. An open-source app adds its GitHub repository as `repo` (`owner/name`); a closed-source one leaves it out.
- Text fields hold one string per language. `en` is required; `zh-CN`, `zh-TW`, `ja` and `ko` are optional, and a missing language shows the English text.
- Each file names its JSON Schema (in `data/schema/`) in `$schema`, so VS Code and other editors complete and check the fields as you type.
- Links must be https. For a screenshot, add a WebP about 1200px wide to `apps/web/public/shots/` and set `"screenshot": "my-app.webp"`. For an app icon, set `"icon": { "ailogo": "<id>" }` with an [ai-logo](https://github.com/yldm-tech/ai-logo) id, or leave it out for a letter tile.
- `pnpm test` checks every entry and names the file, entry and field of each mistake. CI runs it on every pull request.

The UI copy is in `packages/catalog/locales/`, one JSON file per language with the same keys. `zh-CN.json` is the reference: add a new key there and to the other four files; `pnpm typecheck` and `pnpm test` report a missing key or a mismatched `{x}`/`{n}` placeholder.

## Credits

- [MyGo](https://github.com/egoist/mygo) is made by [egoist](https://github.com/egoist) (MIT). The showcase, plugin and guide data follows its repository and site.
- App icons are from [yldm-tech/ai-logo](https://github.com/yldm-tech/ai-logo) (MIT) or the apps' own icons. Screenshots come from egoist/mygo's showcase and the projects' READMEs. Both belong to the apps' authors; names and logos are their trademarks and are shown to identify them.

## License

The code is released under the [MIT License](LICENSE).
