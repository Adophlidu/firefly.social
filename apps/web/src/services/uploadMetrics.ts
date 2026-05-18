import { Source } from '@dimensiondev/enums';
import { compact } from 'lodash-es';
import { sha256, toHex } from 'viem';

import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { uploadMetrics } from '@/providers/firefly/metrics/uploadMetrics.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import type { MetricsData, MetricsItemToUpload, MetricsUploadResponseData } from '@/providers/types/Firefly.js';
import { encryptPasscode } from '@/services/crypto.js';
import type { ResponseJson } from '@/types/utility.js';

async function uploadTwitterMetricsInServer(passcode: string, metricsItem: MetricsItemToUpload) {
    if (metricsItem.source !== Source.Twitter) throw new Error('Invalid source for Twitter metrics upload');
    if (!metricsItem.session) throw new Error('Twitter session is required for Twitter metrics upload');

    const response = await fireflySessionHolder.fetchWithSession<ResponseJson<MetricsUploadResponseData>>(
        '/api/firefly/upload-twitter-metrics',
        {
            method: 'POST',
            body: JSON.stringify({
                encryptKey: sha256(toHex(passcode)).replace(/^0x/, ''),
                encryptedPasscode: encryptPasscode(passcode),
                metaInfo: metricsItem.metrics.metaInfo,
            }),
            headers: TwitterSession.payloadToHeaders(metricsItem.session.payload),
        },
    );
    return resolveResponseData(response);
}

export async function uploadMetricsToFirefly(passcode: string, metrics: MetricsItemToUpload[]) {
    const validMetrics: MetricsData[] = []; // upload to firefly directly
    const twitterMetrics: MetricsItemToUpload[] = []; // upload in server side
    metrics.forEach((item) => {
        if (item.metrics.ciphertext) {
            validMetrics.push({
                metaInfo: item.metrics.metaInfo,
                ciphertext: item.metrics.ciphertext,
            });
        } else if (item.source === Source.Twitter && item.session) {
            twitterMetrics.push(item);
        }
    });

    if (!validMetrics.length && !twitterMetrics.length) throw new Error('No valid metrics to upload');

    const results = await Promise.allSettled(
        compact([
            validMetrics.length ? uploadMetrics(passcode, validMetrics) : null,
            ...twitterMetrics.map((item) => uploadTwitterMetricsInServer(passcode, item)),
        ]),
    );
    return results.flatMap((result) => (result.status === 'fulfilled' ? result.value.metrics : []));
}
