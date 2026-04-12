import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { LoginResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function loginTelegram(telegramToken: string) {
    const response = await fetchJson<LoginResponse>(urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/telegram/login'), {
        method: 'POST',
        body: JSON.stringify({ telegramToken }),
    });

    const data = resolveFireflyResponseData(response);
    return data;
}
