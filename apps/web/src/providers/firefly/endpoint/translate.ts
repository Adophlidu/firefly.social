/* cspell:disable */

import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { settings } from '@/settings/index.js';
import type { Language } from '@/types/language.js';

interface Translation {
    text: string;
    to: Language;
}

interface TranslationResponse {
    data: Array<{
        detectedLanguage: {
            language: Language;
            score: number;
        };
        translations: Translation[];
    }>;
}

/**
 * Translates the provided text to the specified target language.
 *
 * @param {Language} to - The target language code to which the text should be translated.
 * @param {string} text - The text to be translated.
 * @returns - A promise that resolves to an object containing the detected language and translations.
 *
 */
export async function translate(
    to: Language,
    text: string,
): Promise<{
    detectedLanguage: Language | null;
    translations: Translation[];
}> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/misc/translate');
    const { data } = await fetchJson<TranslationResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            toLanguage: to,
            text,
        }),
    });
    const detectedLanguage = data[0].detectedLanguage;

    return {
        detectedLanguage: detectedLanguage.score > 0.8 ? detectedLanguage.language : null,
        translations: data[0].translations,
    };
}
