import { first } from 'lodash-es';
import urlcat from 'urlcat';
import { type Hex } from 'viem';

import { OTPExceededMaximumLimit } from '@/constants/error.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import {
    type GenerateFarcasterSignatureResponse,
    type GenerateOTPResponse,
    type LoginResponse,
    type TelegramLoginBotResponse,
} from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

class FireflyAuth {
    async generateFarcasterSignatures(key: Hex, deadline: number, jwt: string, signal?: AbortSignal) {
        const response = await fetchJson<GenerateFarcasterSignatureResponse>(
            urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/v1/farcaster/generate-signatures'),
            {
                method: 'POST',
                body: JSON.stringify({ key, deadline }),
                headers: {
                    authorization: `Bearer ${jwt}`,
                },
                signal,
            },
        );
        return resolveFireflyResponseData(response);
    }

    async getTelegramLoginUrl() {
        const response = await fetchJson<TelegramLoginBotResponse>(
            urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/get/telegram/bot/url', { os: 'web' }),
        );
        const data = resolveFireflyResponseData(response);
        return data.url;
    }

    async loginTelegram(telegramToken: string) {
        const response = await fetchJson<LoginResponse>(urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/telegram/login'), {
            method: 'POST',
            body: JSON.stringify({ telegramToken }),
        });

        const data = resolveFireflyResponseData(response);
        return data;
    }

    async generateEmailOTP(email: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/email/generateOTP');
        const response = await fetchJson<GenerateOTPResponse>(
            url,
            {
                method: 'POST',
                body: JSON.stringify({
                    email,
                }),
            },
            {
                noStrictOK: true,
            },
        );

        if (response.code === 1642) throw new OTPExceededMaximumLimit(first(response.error));

        return resolveFireflyResponseData(response);
    }

    async deleteAccount() {
        await fireflySessionHolder.fetchWithSession(urlcat(settings.FIREFLY_ROOT_URL, `/v3/auth/account/delete`), {
            method: 'DELETE',
        });
    }
}

export { FireflyAuth };
export const fireflyAuthProvider = new FireflyAuth();
