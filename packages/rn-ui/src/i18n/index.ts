import { type I18n, type Messages, setupI18n } from '@lingui/core';

import { messages as en } from '../locales/en/messages';
import { messages as ja } from '../locales/ja/messages';
import { messages as ko } from '../locales/ko/messages';
import { messages as zhHans } from '../locales/zh-Hans/messages';
import { messages as zhHant } from '../locales/zh-Hant/messages';

export type RnUiLocale = 'en' | 'ko' | 'ja' | 'zh-Hans' | 'zh-Hant';

const SUPPORTED_LOCALES: readonly RnUiLocale[] = ['en', 'ko', 'ja', 'zh-Hans', 'zh-Hant'];

const CATALOGS: Record<RnUiLocale, Messages> = {
    en,
    ko,
    ja,
    'zh-Hans': zhHans,
    'zh-Hant': zhHant,
};

declare const __DEV__: boolean | undefined;

const isSupported = (locale: string): locale is RnUiLocale => (SUPPORTED_LOCALES as readonly string[]).includes(locale);

function isDevEnvironment(): boolean {
    // React Native exposes the global __DEV__ boolean. Web bundlers replace
    // `process.env.NODE_ENV` at build time. Check both, defensively, so this
    // module works in both runtimes without pulling in @types/node.
    if (typeof __DEV__ !== 'undefined') return __DEV__ === true;
    if (typeof globalThis !== 'undefined') {
        const proc = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process;
        if (proc?.env?.NODE_ENV) return proc.env.NODE_ENV !== 'production';
    }
    return false;
}

function resolveLocale(locale: string | null | undefined): RnUiLocale {
    if (locale === null || locale === undefined || locale === '') return 'en';
    if (isSupported(locale)) return locale;
    if (isDevEnvironment()) {
        console.warn(
            `[rn-ui] Unknown locale "${locale}". Falling back to "en". ` +
                `Supported: ${SUPPORTED_LOCALES.join(', ')}.`,
        );
    }
    return 'en';
}

/**
 * Create a fresh, instance-scoped Lingui i18n for rn-ui.
 *
 * The instance is NOT registered with `@lingui/core`'s global `i18n` singleton
 * (no `i18n.loadAndActivate` calls here). This is load-bearing: rn-ui ships
 * inside apps that have their own Lingui setup; sharing the global would race
 * with the consumer's locale activation. Macros inside rn-ui must read this
 * instance via the React context that the Provider wraps the subtree with.
 */
export function setupRnUiI18n(locale: string | null | undefined): I18n {
    const resolved = resolveLocale(locale);
    return setupI18n({
        locale: resolved,
        locales: SUPPORTED_LOCALES as unknown as string[],
        messages: { [resolved]: CATALOGS[resolved] },
    });
}

export { SUPPORTED_LOCALES };
