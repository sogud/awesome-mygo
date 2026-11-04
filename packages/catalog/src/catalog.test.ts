import { describe, expect, it } from 'vitest';
import apps from '../data/apps.json';
import articles from '../data/articles.json';
import docs from '../data/docs.json';
import plugins from '../data/plugins.json';
import appsSchema from '../data/schema/apps.schema.json';
import articlesSchema from '../data/schema/articles.schema.json';
import docsSchema from '../data/schema/docs.schema.json';
import pluginsSchema from '../data/schema/plugins.schema.json';
import stateSchema from '../data/schema/state.schema.json';
import uiSchema from '../data/schema/ui.schema.json';
import state from '../data/state.json';
import ui from '../data/ui.json';
import { AILOGO_CDN, APP_CATEGORIES, APP_GROUPS, APPS, GROUP_CATEGORY, appGroup, appSource, ARTICLES, COMMUNITY_PLUGINS, DOCS, PLUGINS, STATE_SOLUTIONS, UI_LIBS, appBySlug, authorProfile, hostOf, readApps, readPlugins } from './catalog';
import { SUBMIT_CATS, SUBMIT_FILES, appendEntry, buildEntry, codeFence, descMax, editUrl, entryCats, entryProblem, guessFromLink, isBadUrl, isEntryComplete, issueUrl, jsonEntry, missingFields, parseEntryJson, pastedEntryProblem, pastedName, slugify, withScheme } from './entry';
import { LANGS, type LangCode, type Text, fill, langRedirectScript, negotiateLang, pick, validateRootSearch } from './lang';
import { buildSearchIndex, searchCatalog } from './search';
import { LIKE_KEYS, likeKey } from './likes';
import { LOCALES } from './strings';
import { appDescription, t } from './translate';
import { CatalogError, readList, unique } from './validate';

// The tests run on Node 24; this package has no Node type definitions, so the one function needed is declared here.
declare const process: { getBuiltinModule(id: 'node:fs'): { existsSync(path: URL): boolean; readFileSync(path: URL, encoding: 'utf8'): string } };
const { existsSync, readFileSync } = process.getBuiltinModule('node:fs');
const dataText = (file: string) => readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8');

const PUBLIC = new URL('../../../apps/web/public/', import.meta.url);
type Schema = { $id: string; properties: Record<string, { items: { required: string[]; properties: Record<string, unknown> } }> };
const SCHEMAS: Record<string, Schema> = { 'apps.json': appsSchema, 'ui.json': uiSchema, 'state.json': stateSchema, 'plugins.json': pluginsSchema, 'docs.json': docsSchema, 'articles.json': articlesSchema } as unknown as Record<string, Schema>;
const FILES: Record<string, { $schema: string }> = { 'apps.json': apps, 'ui.json': ui, 'state.json': state, 'plugins.json': plugins, 'docs.json': docs, 'articles.json': articles };
const texts = (): Text[] => [...APPS.flatMap((a) => [a.desc, a.about]), ...UI_LIBS.map((l) => l.desc), ...STATE_SOLUTIONS.map((s) => s.desc), ...PLUGINS.map((p) => p.desc), ...COMMUNITY_PLUGINS.map((p) => p.desc), ...DOCS.map((d) => d.desc)];

describe('catalog data', () => {
	it('loads every data file', () => {
		expect(APPS.length).toBeGreaterThan(0);
		expect(UI_LIBS.length).toBeGreaterThan(0);
		expect(PLUGINS.length).toBeGreaterThan(0);
		expect(DOCS.length).toBeGreaterThan(0);
		expect(ARTICLES.length).toBeGreaterThan(0);
	});

	it('links only to https URLs', () => {
		for (const u of [...APPS.map((a) => a.url), ...UI_LIBS.map((l) => l.url), ...PLUGINS.map((p) => p.url), ...DOCS.map((d) => d.url), ...STATE_SOLUTIONS.map((s) => s.url), ...ARTICLES.map((a) => a.url)]) {
			expect(u.startsWith('https://')).toBe(true);
		}
	});

	it('has English for every entry, and only site languages', () => {
		for (const text of texts()) {
			expect(text.en.trim()).not.toBe('');
			for (const lang of Object.keys(text)) expect(LANGS.map((l) => l.code)).toContain(lang);
		}
	});

	it('gives every official plugin its Go package, and a frontend package only to plugins that serve pages', () => {
		for (const p of PLUGINS) {
			expect(p.goImport).toBe(`github.com/egoist/mygo/plugins/${p.slug}`);
			if (p.npm) expect(p.surface).not.toBe('native');
		}
	});

	it('rejects a malformed Go import path or npm package name', () => {
		const plugin = { slug: 'kit', name: 'Kit', mark: 'Kt', official: false, surface: 'web', tags: [], docs: 'https://x.dev', summary: { en: 'A kit.' } };
		expect(() => readPlugins({ plugins: [{ ...plugin, import: 'github.com/you/kit', npm: '@you/kit' }] })).not.toThrow();
		expect(() => readPlugins({ plugins: [{ ...plugin, import: 'go get github.com/you/kit' }] })).toThrow(/import must be a Go import path/);
		expect(() => readPlugins({ plugins: [{ ...plugin, npm: 'bun add @you/kit' }] })).toThrow(/npm must be an npm package name/);
	});

	it('falls back to English for a missing language', () => {
		expect(pick({ en: 'Hello' }, 'ja')).toBe('Hello');
		expect(pick({ en: 'Hello', ja: 'こんにちは' }, 'ja')).toBe('こんにちは');
	});

	it('has every UI string in every language, with the same placeholders', () => {
		const ref = LOCALES['zh-CN'];
		const keys = Object.keys(ref).sort();
		const holes = (s: string) => (s.match(/\{[xn]\}/g) ?? []).sort().join();
		for (const L of LANGS) {
			const dict = LOCALES[L.code];
			expect(Object.keys(dict).sort(), L.code).toEqual(keys);
			for (const k of keys as (keyof typeof ref)[]) {
				expect(typeof dict[k] === 'string' && dict[k].trim() !== '', `${L.code} ${k}`).toBe(true);
				expect(holes(dict[k]), `${L.code} ${k}`).toBe(holes(ref[k]));
			}
		}
	});

	it('takes icons from ai-logo, a local official icon for a few, and none for the apps on the mygo init default', () => {
		const slugs = (pred: (icon: string | undefined) => boolean) => APPS.filter((a) => pred(a.icon)).map((a) => a.slug).sort();
		expect(slugs((i) => i === undefined)).toEqual(['2048', 'uma']);
		expect(slugs((i) => i !== undefined && !i.startsWith(AILOGO_CDN))).toEqual(['joplin-lite', 'myskills', 'nova', 'repo-hopper', 'tomoru']);
		for (const a of APPS) {
			if (!a.icon) continue;
			expect(a.icon).toMatch(a.icon.startsWith(AILOGO_CDN) ? /^https:\/\/ailogo\.yldm\.ai\/avatar\/[a-z0-9]+\.webp$/ : new RegExp(`^/icons/${a.slug}\\.webp$`));
		}
	});

	it('has every screenshot and local icon it names in apps/web/public', () => {
		const files = [...APPS.flatMap((a) => [a.image, a.icon?.startsWith('/') ? a.icon : undefined]), ...UI_LIBS.map((l) => l.image), ...STATE_SOLUTIONS.map((s) => s.image)];
		for (const f of files) if (f) expect(existsSync(new URL(f.slice(1), PUBLIC)), f).toBe(true);
	});

	it('points every data file at its schema', () => {
		for (const [file, json] of Object.entries(FILES)) expect(json.$schema, file).toBe(`./schema/${SCHEMAS[file].$id}`);
	});

	it('resolves apps by slug', () => {
		expect(appBySlug('kero')?.name).toBe('Kero');
		expect(appBySlug('nope')).toBeUndefined();
	});

	// The category is optional (the submission form and bot write entries without one), so only its value is checked.
	it('takes an app category only from the values its schema allows', () => {
		const schemaEnum = (appsSchema as unknown as { properties: { apps: { items: { properties: { category: { enum: string[] } } } } } }).properties.apps.items.properties.category.enum;
		expect(schemaEnum).toEqual([...APP_CATEGORIES]);
		for (const a of APPS) if (a.category !== undefined) expect(APP_CATEGORIES, a.slug).toContain(a.category);
		const entry = { slug: 'kit', name: 'Kit', author: 'someone', kind: 'native', url: 'https://x.dev', summary: { en: 'A kit.' }, description: { en: 'A kit.' } };
		expect(readApps({ apps: [entry] })[0].category).toBeUndefined();
		expect(() => readApps({ apps: [{ ...entry, category: 'DesktopApplication' }] })).toThrow(/category must be one of/);
	});

	it('links an author to a GitHub profile only when one of their apps is in a repository they own', () => {
		expect(authorProfile('fzn0x')).toBe('https://github.com/fzn0x');
		// Pulse lives on its own domain, but egoist's other apps are in github.com/egoist.
		expect(authorProfile('egoist')).toBe('https://github.com/egoist');
		// video-downloader is in github.com/fazi-gondal: 'Faizan' is a name, not that login.
		expect(authorProfile('Faizan')).toBeUndefined();
		expect(authorProfile('echoVic')).toBeUndefined();
	});

	it('strips the scheme and trailing slash for display', () => {
		expect(hostOf('https://kero.sh/')).toBe('kero.sh');
		expect(hostOf('https://github.com/egoist/gorex')).toBe('github.com/egoist/gorex');
	});
});

describe('showcase groups', () => {
	it('puts every category in a group, and every app in a group with others', () => {
		for (const c of APP_CATEGORIES) expect(APP_GROUPS).toContain(appGroup({ category: c }));
		expect(appGroup({})).toBe('other');
		for (const [g, c] of Object.entries(GROUP_CATEGORY)) expect(appGroup({ category: c })).toBe(g);
		// A group with a single app reads as a mistake on the page: merge it into a neighbour instead.
		const sizes = APPS.reduce<Record<string, number>>((n, a) => ({ ...n, [appGroup(a)]: (n[appGroup(a)] ?? 0) + 1 }), {});
		for (const [g, n] of Object.entries(sizes)) expect([g, n >= 2]).toEqual([g, true]);
	});
});

describe('like keys', () => {
	it('gives every likeable entry its own key', () => {
		expect(LIKE_KEYS.size).toBe(APPS.length + UI_LIBS.length + STATE_SOLUTIONS.length + PLUGINS.length);
		expect(LIKE_KEYS.has(likeKey.app(APPS[0]))).toBe(true);
		expect(LIKE_KEYS.has('app:not-an-app')).toBe(false);
	});
});

describe('validation of contributed entries', () => {
	const read = (entry: Record<string, unknown>) => () =>
		readList('apps.json', { apps: [entry] }, 'apps', (r) => {
			r.only(['name', 'url', 'kind', 'summary']);
			return [r.str('name'), r.url('url'), r.oneOf('kind', ['native', 'web']), r.text('summary')];
		});
	const ok = { name: 'Kit', url: 'https://x.dev', kind: 'native', summary: { en: 'A kit.' } };

	it('accepts a well-formed entry', () => {
		expect(read(ok)).not.toThrow();
	});

	it('names the file, entry and field of each mistake', () => {
		expect(read({ ...ok, summary: { 'zh-CN': '工具' } })).toThrow(/apps.json entry 1 \(Kit\): summary.en is required/);
		expect(read({ ...ok, summary: { en: 'A kit.', fr: 'Un kit.' } })).toThrow(/summary.fr is not a site language/);
		expect(read({ ...ok, url: 'http://x.dev' })).toThrow(/url must be an https link/);
		expect(read({ ...ok, kind: 'electron' })).toThrow(/kind must be one of native, web/);
		expect(read({ ...ok, descripton: 'typo' })).toThrow(/descripton is not a known field/);
		expect(read({ ...ok, name: ' ' })).toThrow(CatalogError);
	});

	it('rejects duplicates', () => {
		expect(() => unique('apps.json', [{ slug: 'a' }, { slug: 'a' }], 'slug', (x) => x.slug)).toThrow(/two entries have slug "a"/);
	});
});

describe('negotiateLang', () => {
	const CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
	const SITE = 'https://mygodock.dev';

	it('prefers a saved choice', () => {
		expect(negotiateLang('ja', 'en-US')).toBe('ja');
	});

	it('ignores an unknown saved value', () => {
		expect(negotiateLang('fr', 'ko-KR')).toBe('ko');
	});

	it('maps traditional Chinese locales to zh-TW', () => {
		expect(negotiateLang(null, 'zh-TW')).toBe('zh-TW');
		expect(negotiateLang(null, 'zh-HK')).toBe('zh-TW');
		expect(negotiateLang(null, 'zh-Hant-MO')).toBe('zh-TW');
		expect(negotiateLang(null, 'zh-CN')).toBe('zh-CN');
	});

	it('falls back to simplified Chinese', () => {
		expect(negotiateLang(null, 'de-DE')).toBe('zh-CN');
		expect(negotiateLang(null, undefined)).toBe('zh-CN');
	});

	it('keeps crawlers on the language the URL declares', () => {
		const crawlers = [
			'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
			'Mozilla/5.0 (compatible; Google-InspectionTool/1.0)',
			'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0.1938.76 Safari/537.36',
			'Mozilla/5.0 (compatible; Baiduspider-render/2.0; +http://www.baidu.com/search/spider.html)',
			'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)',
			'Mozilla/5.0 (Linux; Android 7.0;) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; PetalBot;+https://webmaster.petalsearch.com/site/petalbot)',
			'Mozilla/5.0 (compatible; Yeti/1.1; +https://naver.me/spd)',
			'Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)',
			'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
			'WhatsApp/2.23.20.0',
			'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse',
		];
		for (const userAgent of crawlers) expect(negotiateLang(null, 'en-US', { userAgent, referrer: '', origin: SITE }), userAgent).toBe('zh-CN');
		expect(negotiateLang(null, 'en-US', { userAgent: CHROME, referrer: '', origin: SITE })).toBe('en');
	});

	it('treats browsers that carry a search brand in their UA as browsers', () => {
		const browsers: [string, string][] = [
			['Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/140.0.0.0 Mobile Safari/537.36 DuckDuckGo/5', 'en-US'],
			['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 DuckDuckGo/7 Safari/605.1.15', 'en-US'],
			['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 NAVER(inapp; search; 2000; 12.10.0; 15PRO)', 'ko-KR'],
			['Mozilla/5.0 (Linux; Android 14; SM-S921N Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/140.0.0.0 Mobile Safari/537.36 NAVER(inapp; search; 2000; 12.10.0)', 'ko-KR'],
		];
		for (const [userAgent, browser] of browsers) expect(negotiateLang(null, browser, { userAgent, referrer: '', origin: SITE }), userAgent).toBe(browser.slice(0, 2));
	});

	it('keeps visitors from another site on the language the URL declares, unless they saved a choice', () => {
		expect(negotiateLang(null, 'en-US', { userAgent: CHROME, referrer: 'https://www.google.com/', origin: SITE })).toBe('zh-CN');
		expect(negotiateLang(null, 'en-US', { userAgent: CHROME, referrer: 'https://mygodock.dev.example.com/', origin: SITE })).toBe('zh-CN');
		expect(negotiateLang('ja', 'en-US', { userAgent: CHROME, referrer: 'https://www.google.com/', origin: SITE })).toBe('ja');
		expect(negotiateLang(null, 'en-US', { userAgent: CHROME, referrer: 'https://mygodock.dev/ui', origin: SITE })).toBe('en');
	});
});

describe('langRedirectScript', () => {
	const CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
	const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
	// Runs the inline script against a fake page and returns where it redirected, or null.
	const run = (href: string, saved: string | null, browser: string, userAgent = CHROME, referrer = '') => {
		let to: string | null = null;
		const location = { href, origin: new URL(href).origin, replace: (u: string) => (to = u) };
		const localStorage = { getItem: () => saved };
		new Function('location', 'localStorage', 'navigator', 'document', langRedirectScript())(location, localStorage, { language: browser, userAgent }, { referrer });
		return to;
	};
	const browsers = ['en-US', 'zh-TW', 'zh-HK', 'zh-Hant-MO', 'zh-CN', 'ja-JP', 'ko-KR', 'de-DE'];
	const saves = [null, 'ja', 'fr', 'zh-CN'];
	const visits: [string, string][] = [
		[CHROME, ''],
		[CHROME, 'https://mygodock.dev/ui'],
		[CHROME, 'https://www.google.com/'],
		[GOOGLEBOT, ''],
	];

	it('picks the same language as negotiateLang', () => {
		for (const browser of browsers) {
			for (const saved of saves) {
				for (const [userAgent, referrer] of visits) {
					const want = negotiateLang(saved, browser, { userAgent, referrer, origin: 'https://mygodock.dev' });
					const to = run('https://mygodock.dev/showcase?app=kero', saved, browser, userAgent, referrer);
					expect(to ? new URL(to).searchParams.get('lang') : 'zh-CN', `${browser} ${saved} ${userAgent} ${referrer}`).toBe(want);
				}
			}
		}
	});

	it('keeps the path and other parameters', () => {
		expect(run('https://mygodock.dev/showcase?app=kero', null, 'en-US')).toBe('https://mygodock.dev/showcase?app=kero&lang=en');
	});

	it('leaves a page that already names a language', () => {
		expect(run('https://mygodock.dev/?lang=ja', null, 'en-US')).toBeNull();
	});

	it('leaves an explicit ?lang= of the default language', () => {
		expect(run('https://mygodock.dev/?lang=zh-CN', null, 'en-US')).toBeNull();
		expect(run('https://mygodock.dev/?lang=zh-CN', 'ja', 'en-US')).toBeNull();
	});

	it('does not redirect crawlers or visitors from another site', () => {
		expect(run('https://mygodock.dev/', null, 'en-US', GOOGLEBOT)).toBeNull();
		expect(run('https://mygodock.dev/', null, 'en-US', CHROME, 'https://www.google.com/')).toBeNull();
		expect(run('https://mygodock.dev/', 'ja', 'en-US', CHROME, 'https://www.google.com/')).toBe('https://mygodock.dev/?lang=ja');
	});
});

describe('validateRootSearch', () => {
	it('drops a lang that is not a site language, so it never reaches the render', () => {
		for (const lang of ['fr', 'EN', 'zh-cn', '', 123, ['en', 'ja'], null]) {
			const v = validateRootSearch({ lang });
			// The key must be present (as undefined) to override the raw value TanStack merges the result over.
			expect('lang' in v, JSON.stringify(lang)).toBe(true);
			expect(v.lang, JSON.stringify(lang)).toBeUndefined();
		}
		for (const L of LANGS) expect(validateRootSearch({ lang: L.code }).lang).toBe(L.code);
	});

	it('keeps app slugs, numeric ones included, and drops anything else', () => {
		expect(validateRootSearch({ app: 2048 }).app).toBe('2048');
		expect(validateRootSearch({ app: 'kero' }).app).toBe('kero');
		for (const app of ['Bad Slug', '', 'a'.repeat(65), ['kero', 'pulse'], { x: 1 }]) {
			const v = validateRootSearch({ app });
			expect('app' in v, JSON.stringify(app)).toBe(true);
			expect(v.app, JSON.stringify(app)).toBeUndefined();
		}
	});

	it('round-trips every app slug through the URL as the router writes and reads it', () => {
		// The router writes strings as plain text (stringifySearchWith(JSON.stringify)) and its default reader JSON-parses each value that can begin JSON, which turns ?app=2048 into a number.
		const parse = (v: string): unknown => {
			try {
				return JSON.parse(v);
			} catch {
				return v;
			}
		};
		const read = (query: string) => Object.fromEntries([...new URLSearchParams(query)].map(([k, v]) => [k, parse(v)]));
		for (const a of APPS) expect(validateRootSearch(read(new URLSearchParams({ app: a.slug, lang: 'ja' }).toString())), a.slug).toEqual({ app: a.slug, lang: 'ja' });
	});
});

describe('t', () => {
	it('falls back to the default language for a value that is not a site language', () => {
		expect(t('fr' as LangCode)).toBe(t('zh-CN'));
		expect(t('' as LangCode).nf_h).toBe(LOCALES['zh-CN'].nf_h);
	});
});

describe('search snippets', () => {
	// Display width as search results measure it: CJK, kana, Hangul and full-width forms take two columns.
	const width = (s: string) => Array.from(s).reduce((w, c) => w + (/[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]/.test(c) ? 2 : 1), 0);
	const PAGES = [
		['title_home', 'desc_home'],
		['title_ui', 'desc_ui'],
		['title_state', 'desc_state'],
		['title_plugins', 'desc_plugins'],
		['title_showcase', 'desc_showcase'],
		['title_learn', 'desc_learn'],
	] as const;

	it('puts the site name first in the home title and keeps every title short enough to show whole', () => {
		for (const [title] of PAGES) {
			for (const L of LANGS) {
				const topic = LOCALES[L.code][title];
				const full = title === 'title_home' ? topic : `${topic} · Awesome MyGo`;
				if (title === 'title_home') expect(full.startsWith('Awesome MyGo · '), `${title} ${L.code}`).toBe(true);
				expect(width(full), `${title} ${L.code}: ${full}`).toBeLessThanOrEqual(64);
			}
		}
	});

	it('gives every page its own description that fits the snippet', () => {
		LANGS.forEach((L) => {
			const descs = PAGES.map(([, desc]) => LOCALES[L.code][desc]);
			expect(new Set(descs).size, L.code).toBe(PAGES.length);
			for (const d of descs) expect(width(d), `${L.code}: ${d}`).toBeLessThanOrEqual(160);
		});
	});

	it('gives every app page its own description that fits the snippet', () => {
		for (const L of LANGS) {
			const descs = APPS.map((a) => appDescription(a, L.code));
			expect(new Set(descs).size, L.code).toBe(APPS.length);
			for (const d of descs) expect(width(d), `${L.code}: ${d}`).toBeLessThanOrEqual(160);
		}
		const kero = appBySlug('kero');
		if (!kero) throw new Error('kero is missing');
		expect(appDescription(kero, 'en')).toBe(`${kero.desc.en} A desktop app by ${kero.author}, built with Go and MyGo.`);
		expect(appDescription(kero, 'zh-CN')).toBe(`${pick(kero.desc, 'zh-CN')}由 ${kero.author} 用 Go 与 MyGo 开发的桌面应用。`);
	});
});

describe('fill', () => {
	it('replaces both placeholders', () => {
		expect(fill(t('en').live_badge, { n: 17 })).toBe('17 community apps listed');
		expect(fill(t('en').more_by, { x: 'egoist' })).toBe('More by egoist');
	});
});

describe('search', () => {
	const index = buildSearchIndex('en');

	it('returns nothing for a blank query', () => {
		expect(searchCatalog(index, '   ')).toEqual([]);
	});

	it('matches case-insensitively', () => {
		expect(searchCatalog(index, 'KERO').map((r) => r.name)).toEqual(['Kero']);
	});

	it('matches app descriptions in any language', () => {
		const names = searchCatalog(index, '音乐').map((r) => r.name);
		expect(names).toContain('MixMusic');
		expect(names).toContain('MyGo 云音乐');
	});

	it('finds state solutions', () => {
		expect(searchCatalog(index, 'zustand').map((r) => r.name)).toEqual(['Nodra']);
	});

	it('finds plugins by tag and the cli by command', () => {
		expect(searchCatalog(index, 'no-cors').map((r) => r.name)).toEqual(['Fetch']);
		expect(searchCatalog(index, 'doctor')[0]?.target).toEqual({ type: 'page', path: '/plugins' });
	});
});

describe('submission entry', () => {
	const ph = { name: 'Name', desc: 'One-line description.' };
	const draft = { name: 'My "Kit"', author: 'someone', url: 'https://github.com/someone/my-kit', desc: 'Widgets for MyGo.' };

	it('reads a link typed without its scheme as https, and leaves other schemes for the check', () => {
		expect(withScheme(' github.com/you/app ')).toBe('https://github.com/you/app');
		expect(withScheme('mygo.dev')).toBe('https://mygo.dev');
		expect(withScheme('https://x.dev')).toBe('https://x.dev');
		expect(withScheme('http://x.dev')).toBe('http://x.dev');
		expect(isBadUrl(withScheme('http://x.dev'))).toBe(true);
		expect(withScheme('my app')).toBe('my app');
		expect(withScheme('')).toBe('');
	});

	it('offers the repository name and owner of a GitHub link', () => {
		expect(guessFromLink('https://github.com/you/my-app.git')).toEqual({ name: 'my-app', author: 'you' });
		expect(guessFromLink('https://my-app.dev')).toBeUndefined();
	});

	it('lists what a draft still lacks, and nothing once it is complete', () => {
		const empty = { name: '', author: '', url: '', desc: '' };
		expect(missingFields('showcase', empty)).toEqual(['url', 'name', 'author', 'desc']);
		expect(missingFields('article', empty)).toEqual(['url', 'name']);
		expect(missingFields('ui', { ...draft, url: 'http://x.dev' })).toEqual(['url']);
		for (const cat of SUBMIT_CATS) expect(missingFields(cat, draft).length === 0).toBe(isEntryComplete(cat, draft));
	});

	it('writes the picked category into a showcase entry, and none when none was picked', () => {
		expect(JSON.parse(jsonEntry('showcase', { ...draft, category: 'GameApplication' }, 'native', ph)).category).toBe('GameApplication');
		expect('category' in JSON.parse(jsonEntry('showcase', draft, 'native', ph))).toBe(false);
		expect(() => readApps({ apps: [buildEntry('showcase', { ...draft, category: 'GameApplication' }, 'native', ph)] })).not.toThrow();
	});

	it('writes, for every category, an entry with the fields its schema requires and no others', () => {
		for (const cat of SUBMIT_CATS) {
			const { file, list } = SUBMIT_FILES[cat];
			const item = SCHEMAS[file].properties[list].items;
			const entry = JSON.parse(jsonEntry(cat, draft, 'native', ph));
			for (const field of item.required) expect(entry, `${cat} ${field}`).toHaveProperty(field);
			for (const field of Object.keys(entry)) expect(Object.keys(item.properties), `${cat} ${field}`).toContain(field);
		}
	});

	it('derives the slug and the GitHub repo, and escapes quotes', () => {
		const app = JSON.parse(jsonEntry('showcase', draft, 'web', ph));
		expect(app).toMatchObject({ slug: 'my-kit', name: 'My "Kit"', kind: 'web', summary: { en: 'Widgets for MyGo.' } });
		expect(JSON.parse(jsonEntry('ui', draft, 'native', ph)).repo).toBe('someone/my-kit');
		expect(slugify('留白 Liubai')).toBe('liubai');
	});

	it('opens a prefilled issue, or the data file in GitHub\'s editor', () => {
		const entry = jsonEntry('ui', draft, 'native', ph);
		const u = new URL(issueUrl('https://github.com/yldm-tech/awesome-mygo', 'ui', 'UI', draft, entry, ph));
		expect(u.origin + u.pathname).toBe('https://github.com/yldm-tech/awesome-mygo/issues/new');
		expect(u.searchParams.get('title')).toBe('Add My "Kit" (UI)');
		expect(u.searchParams.get('body')).toBe(`UI: \`packages/catalog/data/ui.json\`\n\n\`\`\`json\n${entry}\n\`\`\`\n`);
		expect(editUrl('https://github.com/yldm-tech/awesome-mygo', 'showcase')).toBe('https://github.com/yldm-tech/awesome-mygo/edit/main/packages/catalog/data/apps.json');
	});

	it('flags non-https links only once something is typed', () => {
		expect(isBadUrl('')).toBe(false);
		expect(isBadUrl('http://x.dev')).toBe(true);
		expect(isBadUrl('https://x.dev')).toBe(false);
	});

	it('is complete only with every field it needs and a valid link', () => {
		expect(isEntryComplete('ui', draft)).toBe(true);
		expect(isEntryComplete('ui', { ...draft, author: '' })).toBe(false);
		expect(isEntryComplete('ui', { ...draft, url: 'http://x' })).toBe(false);
		expect(isEntryComplete('ui', { ...draft, desc: ' ' })).toBe(false);
		expect(isEntryComplete('article', { name: 'Post', author: '', url: 'https://x.dev/post', desc: '' })).toBe(true);
	});

	it('allows a longer description for apps', () => {
		expect(descMax('showcase')).toBeGreaterThan(descMax('ui'));
	});

	it('fences text that itself contains backticks', () => {
		expect(codeFence('a', 'json')).toBe('```json\na\n```');
		expect(codeFence('x ``` y')).toBe('````\nx ``` y\n````');
	});

	it('derives the install command of a state solution from its repo', () => {
		expect(buildEntry('state', draft, 'native', ph).install).toBe('go get github.com/someone/my-kit');
	});
});

describe('bot submission', () => {
	const ph = { name: 'Name', desc: 'One-line description.' };
	const draft = { name: 'Brand New Kit', author: 'someone', url: 'https://github.com/someone/brand-new-kit', desc: 'Widgets for MyGo.' };

	it('accepts a complete draft and says what is wrong with the rest', () => {
		expect(entryProblem('ui', draft)).toBeUndefined();
		expect(entryProblem('article', { name: 'Post', author: '', url: 'https://x.dev/post', desc: '' })).toBeUndefined();
		expect(entryProblem('ui', { ...draft, author: '' })).toMatch(/required/);
		expect(entryProblem('ui', { ...draft, url: 'https://example.com/kit' })).toMatch(/GitHub repository/);
		expect(entryProblem('ui', { ...draft, desc: 'x'.repeat(descMax('ui') + 1) })).toMatch(/longer than/);
		expect(entryProblem('ui', { ...draft, name: 'a\nb' })).toMatch(/single line/);
		expect(entryProblem('showcase', { ...draft, url: 'https://x.dev/a b' })).toMatch(/spaces/);
	});

	it('appends the entry to every data file, keeping the rest of the file byte for byte', () => {
		for (const cat of SUBMIT_CATS) {
			const { file, list } = SUBMIT_FILES[cat];
			const before = dataText(file);
			const entry = buildEntry(cat, draft, 'native', ph);
			const after = appendEntry(cat, before, entry);
			expect(JSON.parse(after)[list].at(-1), cat).toEqual(entry);
			const [b, a] = [before.split('\n'), after.split('\n')];
			// Only the old last entry's closing brace gains a comma; everything above it is untouched.
			expect(a.slice(0, b.length - 4), cat).toEqual(b.slice(0, b.length - 4));
			expect(a.length - b.length, cat).toBe(JSON.stringify(entry, null, '\t').split('\n').length);
		}
	});

	it('keeps the homepage of an app and its optional GitHub repository apart', () => {
		const home = { ...draft, url: 'https://my-kit.dev' };
		const withRepo = buildEntry('showcase', { ...home, repo: 'https://github.com/someone/my-kit' }, 'native', ph);
		expect(withRepo).toMatchObject({ url: 'https://my-kit.dev', repo: 'someone/my-kit' });
		expect('repo' in buildEntry('showcase', home, 'native', ph)).toBe(false);
		expect(readApps({ apps: [withRepo] })[0].repo).toBe('someone/my-kit');
		expect(() => readApps({ apps: [{ ...withRepo, repo: 'https://github.com/someone/my-kit' }] })).toThrow(/repo must be owner\/name/);
		expect(entryProblem('showcase', { ...home, repo: '' })).toBeUndefined();
		expect(entryProblem('showcase', { ...home, repo: 'https://gitlab.com/someone/my-kit' })).toMatch(/GitHub repository/);
	});

	it('links the source of an app only when its homepage is not that repository already', () => {
		expect(appSource({ url: 'https://my-kit.dev', repo: 'someone/my-kit' })).toBe('https://github.com/someone/my-kit');
		expect(appSource({ url: 'https://github.com/Someone/My-Kit/', repo: 'someone/my-kit' })).toBeUndefined();
		expect(appSource({ url: 'https://my-kit.dev' })).toBeUndefined();
	});

	it('reads a pasted entry, and says when the text is not one', () => {
		expect(parseEntryJson('{"name":"x"}')).toEqual({ entry: { name: 'x' } });
		expect(parseEntryJson('{"name":')).toEqual({ error: 'json' });
		expect(parseEntryJson('[{"name":"x"}]')).toEqual({ error: 'object' });
		expect(parseEntryJson('null')).toEqual({ error: 'object' });
	});

	it('finds the one category whose file takes a pasted entry, for every category', () => {
		for (const cat of SUBMIT_CATS) {
			const entry = buildEntry(cat, draft, 'native', ph);
			expect(entryCats(entry), cat).toEqual([cat]);
			expect(pastedEntryProblem(cat, entry), cat).toBeUndefined();
		}
		expect(entryCats({ name: 'x' })).toEqual([]);
	});

	it('keeps what the form cannot write, such as translations, and names the field of a mistake', () => {
		const pail = { slug: 'pail', name: 'Pail', author: 'DejavuMoe', kind: 'native', url: 'https://github.com/DejavuMoe/Pail', summary: { en: 'S3 manager.', 'zh-CN': 'S3 管理器。' }, description: { en: 'A desktop S3 manager.' } };
		expect(pastedEntryProblem('showcase', pail)).toBeUndefined();
		expect(pastedEntryProblem('showcase', { ...pail, kind: 'tui' })).toMatch(/kind/);
		expect(pastedEntryProblem('showcase', { ...pail, extra: 1 })).toMatch(/extra/);
		expect(pastedEntryProblem('ui', pail)).toBeDefined();
	});

	it('refuses images a visitor cannot add, and names that are not one short line', () => {
		const pail = { slug: 'pail', name: 'Pail', author: 'DejavuMoe', kind: 'native', url: 'https://github.com/DejavuMoe/Pail', summary: { en: 'S3 manager.' }, description: { en: 'S3 manager.' } };
		expect(pastedEntryProblem('showcase', { ...pail, screenshot: 'pail.webp' })).toMatch(/screenshot/);
		expect(pastedEntryProblem('showcase', { ...pail, icon: { file: 'pail.webp' } })).toMatch(/icon/);
		expect(pastedEntryProblem('showcase', { ...pail, icon: { ailogo: 'abc' } })).toBeUndefined();
		expect(pastedEntryProblem('showcase', { ...pail, name: 'a\nb' })).toMatch(/single line/);
		expect(pastedEntryProblem('showcase', { ...pail, name: 'x'.repeat(81) })).toMatch(/80/);
		expect(pastedName({ title: ' An article ' })).toBe('An article');
	});

	it('rejects an entry the file already has, or one that breaks its check, naming the field', () => {
		const text = dataText('apps.json');
		const first = JSON.parse(text).apps[0];
		expect(() => appendEntry('showcase', text, first)).toThrow(/slug/);
		expect(() => appendEntry('showcase', text, { ...first, slug: 'fresh-slug', summary: { ja: 'x' } })).toThrow(CatalogError);
		expect(() => appendEntry('showcase', text, { ...first, slug: 'fresh-slug', summary: { ja: 'x' } })).toThrow(/summary\.en/);
	});
});
