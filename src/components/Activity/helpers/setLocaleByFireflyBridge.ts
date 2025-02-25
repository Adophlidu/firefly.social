import { Locale } from '@/constants/enum.js';
import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';
import { setLocale } from '@/i18n/index.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import { SupportedMethod } from '@/types/bridge.js';

const resolveLocale = createLookupTableResolver<'en' | 'zh', Locale>(
    {
        en: Locale.en,
        zh: Locale.zhHans,
    },
    Locale.en,
);

export async function setLocaleByFireflyBridge() {
    if (!fireflyBridgeProvider.supported) return;

    const language = await fireflyBridgeProvider.request(SupportedMethod.GET_LANGUAGE, {});
    setLocale(resolveLocale(language as 'en' | 'zh'));
}
