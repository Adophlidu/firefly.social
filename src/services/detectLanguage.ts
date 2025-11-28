/* cspell:disable */

import { franc } from 'franc-min';

import { MIN_CHAR_LENGTH_TO_TRANSLATE } from '@/constants/index.js';
import { Language } from '@/types/language.js';

function getLanguageFromCode(code: string): Language | null {
    switch (code) {
        case 'cmn':
            return Language.Chinese_Simplified;
        case 'spa':
            return Language.Spanish;
        case 'eng':
            return Language.English;
        case 'rus':
            return Language.Russian;
        case 'arb':
            return Language.Arabic;
        case 'ben':
            return null;
        case 'hin':
            return Language.Hindi;
        case 'por':
            return Language.Portuguese_Portugal;
        case 'ind':
            return Language.Indonesian;
        case 'jpn':
            return Language.Japanese;
        case 'fra':
            return Language.French;
        case 'deu':
            return Language.German;
        case 'kor':
            return Language.Korean;
        case 'tel':
            return Language.Telugu;
        case 'vie':
            return Language.Vietnamese;
        case 'mar':
            return Language.Marathi;
        case 'ita':
            return Language.Italian;
        case 'tam':
            return Language.Tamil;
        case 'tur':
            return Language.Turkish;
        case 'urd':
            return Language.Urdu;
        case 'guj':
            return Language.Gujarati;
        case 'pol':
            return Language.Polish;
        case 'ukr':
            return Language.Ukrainian;
        case 'kan':
            return Language.Kannada;
        case 'mai':
            return Language.Maithili;
        case 'mal':
            return Language.Malayalam;
        case 'pes':
            return Language.Persian;
        case 'swh':
            return Language.Swahili;
        case 'ron':
            return Language.Romanian;
        case 'pan':
            return Language.Punjabi;
        case 'bho':
            return Language.Bhojpuri;
        case 'hau':
            return Language.Hausa;
        case 'bos':
            return Language.Bosnian;
        case 'hrv':
            return Language.Croatian;
        case 'nld':
            return Language.Dutch;
        case 'tha':
            return Language.Thai;
        case 'ckb':
            return Language.Kurdish_Central;
        case 'yor':
            return Language.Yoruba;
        case 'zlm':
            return Language.Malay;
        case 'ibo':
            return Language.Igbo;
        default:
            return null;
    }
}

export async function detectLanguage(text: string): Promise<Language | null> {
    const langCode = franc(text, { minLength: MIN_CHAR_LENGTH_TO_TRANSLATE });
    return getLanguageFromCode(langCode) || null;
}
