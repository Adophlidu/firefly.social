import { Locale } from '@dimensiondev/enums';
import { bom, isValidEnumValue } from '@dimensiondev/utils';

export function resolveLanguageLocale(language: string | undefined) {
    if (!language) return Locale.en;
    if (language.startsWith('en')) return Locale.en;
    if (language.startsWith('es')) return Locale.es;
    if (language.startsWith('ja')) return Locale.ja;
    if (language.startsWith('ko')) return Locale.ko;
    if (language.startsWith('zh'))
        return ['zh', 'zh-CN', 'zh-SG'].includes(language) || language.startsWith('zh-Hans')
            ? Locale.zhHans
            : Locale.zhHant;
    return Locale.en;
}

export function resolveLocale(locale: string): Locale {
    return isValidEnumValue(locale, Locale) ? (locale as Locale) : resolveLanguageLocale(bom.navigator?.language);
}
