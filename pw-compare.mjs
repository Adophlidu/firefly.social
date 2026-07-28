import { chromium } from '@playwright/test';

const STAGING = 'https://firefly-web-staging.adolph-office.workers.dev';
const PROD = 'https://firefly.social';

const urls = [
    '/',
    '/posts',
    '/activities',
    '/prediction',
    '/world-cup-feed',
    '/events',
    '/event/fifa',
    '/messages',
    '/bookmarks',
    '/bookmarks/lens',
    '/notifications',
    '/explore/posts/trending',
    '/explore/users/x',
    '/explore/prediction/trending',
    '/explore/clubs/trending',
    '/search',
    '/search?q=bitcoin',
    '/intent/compose',
    '/post/lens/1148336xac4bpv9fv9j',
    '/profile/lens/binrui',
    '/profile/lens/binrui/relation/followers',
    '/prediction/category/trending',
    '/prediction/leaderboard',
    '/token/dex/101/Fw2aagAnwEex2ko7n9QW3ks3Tvfdx2s3SsfsFzErpump',
    '/perpetuals',
    '/settings',
    '/settings/general',
    '/settings/connected',
    '/settings/wallets',
    '/settings/notification-settings',
    '/settings/preference',
    '/settings/privacy-and-security',
    '/settings/more',
    '/settings/mutes',
    '/signup',
    '/login/desktop',
    '/world-cup',
];

async function probe(browser, base, url) {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message.slice(0, 120)));
    try {
        const resp = await page.goto(base + url, { waitUntil: 'domcontentloaded', timeout: 40000 });
        await page.waitForTimeout(5000);
        const info = await page.evaluate(() => {
            const main = document.querySelector('main');
            const aside = document.querySelector('aside');
            const nav = document.querySelector('nav');
            const rect = main?.getBoundingClientRect();
            return {
                title: document.title,
                mainWidth: rect ? Math.round(rect.width) : null,
                mainX: rect ? Math.round(rect.x) : null,
                hasAside: !!aside && aside.getBoundingClientRect().width > 0,
                hasNav: !!nav,
                text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 500),
                bodyChildren: document.body.children.length,
            };
        });
        return { status: resp?.status() ?? 0, errors, ...info };
    } catch (e) {
        return {
            status: -1,
            errors: [e.message.slice(0, 120)],
            title: '',
            mainWidth: null,
            mainX: null,
            hasAside: null,
            text: '',
            bodyChildren: 0,
        };
    } finally {
        await page.close();
    }
}

const browser = await chromium.launch({ channel: 'chrome' });
let issues = 0;
for (const url of urls) {
    const [s, p] = await Promise.all([probe(browser, STAGING, url), probe(browser, PROD, url)]);
    const problems = [];
    if (s.status >= 500 || s.status === -1) problems.push(`staging ${s.status}`);
    if (s.errors.length) problems.push(`jserr:${s.errors[0].slice(0, 60)}`);
    if (p.status === 200 && s.status !== p.status && s.status !== 308 && p.status !== 308) {
        problems.push(`status ${s.status}≠${p.status}`);
    }
    if (s.mainWidth && p.mainWidth && Math.abs(s.mainWidth - p.mainWidth) > 60) {
        problems.push(`mainWidth ${s.mainWidth}≠${p.mainWidth}`);
    }
    if (p.hasAside !== s.hasAside && p.status === 200) problems.push(`aside ${s.hasAside}≠${p.hasAside}`);
    if (problems.length) {
        issues++;
        console.log(`DIFF ${url} — ${problems.join(' | ')}`);
        console.log(`  staging: [${s.status}] w=${s.mainWidth}@${s.mainX} aside=${s.hasAside} | ${s.text.slice(0, 90)}`);
        console.log(`  prod   : [${p.status}] w=${p.mainWidth}@${p.mainX} aside=${p.hasAside} | ${p.text.slice(0, 90)}`);
    } else {
        console.log(`OK   ${url}`);
    }
}
await browser.close();
console.log(issues ? `\n${issues} pages differ` : '\nALL MATCH');
