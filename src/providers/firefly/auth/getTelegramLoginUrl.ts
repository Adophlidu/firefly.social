import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { type TelegramLoginBotResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getTelegramLoginUrl() {
    const response = await fetchJson<TelegramLoginBotResponse>(
        urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/get/telegram/bot/url', { os: 'web' }),
    );
    const data = resolveFireflyResponseData(response);
    return data.url;
}
