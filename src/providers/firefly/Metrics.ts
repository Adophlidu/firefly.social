import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type {
    MetricsDownloadMetaInfoResponse,
    MetricsDownloadResponse,
    MetricsItemToUpload,
    MetricsStatusResponse,
    Response,
} from '@/providers/types/Firefly.js';
import { encryptPasscode } from '@/services/crypto.js';
import { settings } from '@/settings/index.js';

class FireflyMetrics {
    async setPasscode(passcode: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/set-passcode');

        await fireflySessionHolder.fetchWithSession(url, {
            method: 'POST',
            body: JSON.stringify({ passcode: encryptPasscode(passcode) }),
        });
    }

    async checkPasscode(passcode: string, noStrictOK?: boolean) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/check-passcode');

        return await fireflySessionHolder.fetch<Response<{}>>(
            url,
            {
                method: 'POST',
                body: JSON.stringify({ passcode: encryptPasscode(passcode) }),
            },
            { noStrictOK },
        );
    }

    async updatePasscode(oldPasscode: string, newPasscode: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/update-passcode');

        await fireflySessionHolder.fetchWithSession(url, {
            method: 'POST',
            body: JSON.stringify({
                oldPasscode: encryptPasscode(oldPasscode),
                newPasscode: encryptPasscode(newPasscode),
            }),
        });
    }

    async resetPasscode() {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/reset-passcode');

        await fireflySessionHolder.fetchWithSession(url, {
            method: 'POST',
        });
    }

    async getMetricsStatus() {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/check-login-metrics');
        const response = await fireflySessionHolder.fetch<MetricsStatusResponse>(url);

        return resolveFireflyResponseData(response);
    }

    async uploadMetrics(passcode: string, metrics: MetricsItemToUpload[]) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/upload');

        const response = await fireflySessionHolder.fetch<Response<{}>>(url, {
            method: 'POST',
            body: JSON.stringify({
                metrics,
                passcode: encryptPasscode(passcode),
                client_os: 'web',
            }),
        });

        return resolveFireflyResponseData(response);
    }

    async deleteMetrics(passcode: string, identities: string[]) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/delete');
        const response = await fireflySessionHolder.fetch<Response<{}>>(url, {
            method: 'POST',
            body: JSON.stringify({
                passcode: encryptPasscode(passcode),
                metaInfoIds: identities,
            }),
        });

        return resolveFireflyResponseData(response);
    }

    async downloadMetaInfo() {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/download-meta-info');
        const response = await fireflySessionHolder.fetch<MetricsDownloadMetaInfoResponse>(url);

        return resolveFireflyResponseData(response);
    }

    async downloadMetrics(passcode: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/download', {
            passcode: encryptPasscode(passcode),
        });
        const response = await fireflySessionHolder.fetch<MetricsDownloadResponse>(url);

        return resolveFireflyResponseData(response);
    }
}

export { FireflyMetrics };
export const fireflyMetricsProvider = new FireflyMetrics();
