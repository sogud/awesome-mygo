# Awesome MyGo

[![Website](https://img.shields.io/badge/website-mygodock.dev-3fd3f5)](https://mygodock.dev)
[![CI](https://github.com/yldm-tech/awesome-mygo/actions/workflows/ci.yml/badge.svg)](https://github.com/yldm-tech/awesome-mygo/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/yldm-tech/awesome-mygo)](LICENSE)

[MyGo](https://github.com/egoist/mygo) 관련 앱, 플러그인, 컴포넌트, 문서를 한 사이트에 모았습니다: **[mygodock.dev](https://mygodock.dev)**. MyGo는 Go로 데스크톱 앱을 만드는 도구로, 화면을 네이티브 UI로도 웹 프런트엔드로도 만들 수 있습니다.

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · 한국어

[![Awesome MyGo](.github/assets/banner.png)](https://mygodock.dev)

## 사이트 내용

- **쇼케이스**: MyGo로 만든 데스크톱 앱 26개. 앱마다 자세한 설명, 스크린샷(프로젝트가 제공한 경우), 인터페이스 종류(네이티브 UI 또는 웹 프런트엔드), 같은 작성자의 다른 앱을 보여줍니다.
- **플러그인**: 공식 플러그인 11개. 웹 페이지, 네이티브 UI, 또는 둘 다 중 어디에 쓰는지 표시하며, `mygo-cli` 툴체인도 소개합니다.
- **UI 컴포넌트**: MyGo 앱을 위한 컴포넌트 라이브러리, 테마, 아이콘.
- **상태 관리**: MyGo 앱의 상태 관리 솔루션과 MyGo에 내장된 바인딩 서비스, 채널, 타입 이벤트.
- **문서**: 공식 가이드 20편, 커뮤니티 글, 공식 자료.
- <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd>로 모든 내용을 **검색**할 수 있고, 수록하고 싶은 프로젝트가 있으면 제출 양식이 항목을 대신 작성해 줍니다.

사이트는 중국어 간체, 중국어 번체, 영어, 일본어, 한국어를 지원합니다. 모든 페이지는 언어마다 고유한 주소(`?lang=en`)를 가지며, 서버에서 렌더링되고 hreflang 링크와 sitemap을 갖추고 있습니다.

## 구성

pnpm 모노레포이며, [TanStack Start](https://tanstack.com/start)가 [Cloudflare Workers](https://workers.cloudflare.com)에서 제공합니다:

| 경로 | 내용 |
|---|---|
| `apps/web` | 사이트: React 19, TanStack Start(서버 렌더링), `@cloudflare/vite-plugin`을 쓰는 Vite. `wrangler.jsonc`로 `mygodock.dev`에 배포합니다. |
| `packages/catalog` | 데이터: `data/*.json`(앱, UI 컴포넌트, 상태 관리 솔루션, 플러그인, 글, 가이드)과 그 JSON Schema, 5개 언어의 UI 문구, 검색, 제출 양식의 항목. 테스트로 모든 항목을 검증합니다. |

앱 아이콘은 [yldm-tech/ai-logo](https://github.com/yldm-tech/ai-logo)의 CDN에서 가져옵니다. ai-logo에 없는 일부 앱은 `apps/web/public/icons/`의 공식 아이콘을 씁니다.

## 개발

Node.js 24 이상과 pnpm이 필요합니다.

```sh
pnpm install
pnpm dev          # 로컬 사이트(Workers 런타임에서 렌더링)
pnpm test         # catalog 테스트
pnpm typecheck
pnpm build
pnpm preview      # 프로덕션 빌드를 Workers 런타임에서 실행
```

`pnpm deploy`는 Wrangler로 빌드하고 배포합니다. `apps/web/wrangler.jsonc`에 있는 도메인의 영역(zone)을 가진 Cloudflare 계정이 필요합니다.

양식의 바로 제출은 이 저장소에 설치한 GitHub App이 처리하며, 그 앞에 Cloudflare Turnstile과 IP별 요청 제한이 있습니다. App에 *Contents*와 *Pull requests* 읽기·쓰기 권한을 주고, 개인 키를 PKCS#8로 변환한 뒤(`openssl pkcs8 -topk8 -nocrypt -in key.pem -out key-pkcs8.pem`), `apps/web`에서 `wrangler secret put`으로 시크릿 4개를 설정합니다: `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`(PKCS#8 파일), `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`. 4개가 모두 설정되기 전까지 양식은 GitHub 링크만 보여 줍니다. 로컬에서 시험할 때는 Turnstile의 [테스트 키](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)를 `apps/web/.dev.vars`에 적습니다.

## 프로젝트 추가

모든 항목은 [`packages/catalog/data`](packages/catalog/data)의 JSON 파일에 있으며, 카테고리마다 파일 하나입니다:

| 파일 | 내용 |
|---|---|
| `apps.json` | MyGo로 만든 앱 |
| `ui.json` | UI 컴포넌트 라이브러리 |
| `state.json` | 상태 관리 |
| `plugins.json` | 플러그인 |
| `articles.json` | 글 |
| `docs.json` | MyGo 공식 가이드 |

추가하는 방법은 두 가지입니다:

- **사이트에서:** "제출"을 눌러 양식을 채우거나 항목을 JSON 그대로 붙여넣은 뒤 바로 제출합니다. GitHub 계정이 필요 없으며, 사이트의 bot이 풀 리퀘스트를 만들어 줍니다. GitHub 계정이 있다면 생성된 항목을 이슈로 보내거나, GitHub 편집기에서 JSON 파일을 열어 직접 추가할 수도 있습니다.
- **저장소에서:** 파일의 목록에 객체를 추가하고 풀 리퀘스트를 보냅니다.

`apps.json`의 항목은 다음과 같습니다:

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

- `url`은 앱의 홈페이지입니다. 공식 웹사이트, 없으면 저장소 주소이며 GitHub가 아니어도 됩니다. 오픈 소스 앱은 `repo`에 GitHub 저장소(`owner/name`)를 적고, 비공개 소스 앱은 생략합니다.
- 텍스트 필드는 언어별로 하나씩 씁니다. `en`은 필수이고 `zh-CN`, `zh-TW`, `ja`, `ko`는 선택이며, 빠진 언어에서는 영어가 표시됩니다.
- 각 파일은 `$schema`로 자신의 JSON Schema(`data/schema/`)를 가리키므로 VS Code 등의 편집기가 입력하는 동안 필드를 자동 완성하고 검사합니다.
- 링크는 https여야 합니다. 스크린샷은 너비 약 1200px의 WebP를 `apps/web/public/shots/`에 두고 `"screenshot": "my-app.webp"`로 씁니다. 앱 아이콘은 [ai-logo](https://github.com/yldm-tech/ai-logo) id로 `"icon": { "ailogo": "<id>" }`를 쓰거나, 생략하면 글자 타일이 표시됩니다.
- `pnpm test`는 모든 항목을 검증하고 오류가 있는 파일, 항목, 필드를 알려 줍니다. CI가 모든 풀 리퀘스트에서 실행합니다.

UI 문구는 `packages/catalog/locales/`에 있으며, 언어마다 키가 같은 JSON 파일이 하나씩 있습니다. 기준은 `zh-CN.json`입니다. 키를 추가할 때는 나머지 네 파일에도 넣어야 하며, 빠진 키나 `{x}`/`{n}` 자리표시자 불일치는 `pnpm typecheck`와 `pnpm test`가 잡아냅니다.

## 크레딧

- [MyGo](https://github.com/egoist/mygo)는 [egoist](https://github.com/egoist)가 만들었습니다(MIT). 쇼케이스, 플러그인, 가이드 데이터는 그 저장소와 사이트를 따릅니다.
- 앱 아이콘은 [yldm-tech/ai-logo](https://github.com/yldm-tech/ai-logo)(MIT) 또는 앱 자체의 아이콘이며, 스크린샷은 egoist/mygo 쇼케이스와 각 프로젝트의 README에서 가져왔습니다. 모두 각 앱의 작성자에게 속하며, 이름과 로고는 해당 상표로 식별 목적으로만 표시합니다.

## 라이선스

코드는 [MIT 라이선스](LICENSE)로 공개합니다.
