import { find } from 'lodash-es';

import { Language } from '@/types/language.js';

export function getLangNameFromLocal(locale: string) {
    const matchedLang = find(Object.entries(Language), ([_, value]) => {
        return `${value}`.startsWith(locale);
    });
    return matchedLang ? matchedLang[0].split('_')[0] : undefined;
}
