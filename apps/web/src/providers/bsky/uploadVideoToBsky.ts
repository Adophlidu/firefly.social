import type { BlobRef } from '@atproto/api';
import { SessionType } from '@dimensiondev/enums';
import { delay, parseUrl } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import type { FileMimeType } from '@/constants/enum.js';
import { BSKY_VIDEO_ENDPOINT } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { resolveExtFromMimeType } from '@/helpers/resolveExtFromMimeType.js';
import { getPdsServiceUrlFromSession } from '@/providers/bsky/getPdsServiceUrlFromSession.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

interface UploadLimits {
    canUpload: boolean;
    message: string;
    remainingDailyBytes: number;
    remainingDailyVideos: number;
    error?: string;
}
interface UploadJob {
    jobId: string;
    state: 'JOB_STATE_COMPLETED' | 'JOB_STATE_FAILED';
    message: string;
    error?: string;
}
interface UploadJobStatus {
    jobStatus: UploadJob & { blob: BlobRef };
}

function getServiceAuthAudFromUrl(url: URL | string) {
    const parsed = url instanceof URL ? url : parseUrl(url);

    return parsed ? `did:web:${parsed.hostname}` : null;
}

async function getServiceAuthToken(
    { aud, lxm, exp }: { aud?: string; lxm: string; exp?: number },
    signal?: AbortSignal,
) {
    const bskySession = getSessionFromStorage(SessionType.Bsky);
    if (!bskySession) throw new Error('No Bsky profile found');

    const dispatchUrl = getPdsServiceUrlFromSession(bskySession);

    const pdsAud = getServiceAuthAudFromUrl(dispatchUrl);
    if (!pdsAud) {
        throw new Error('Agent does not have a PDS URL');
    }

    const authToken = await bskySessionHolder.agent.com.atproto.server.getServiceAuth(
        {
            aud: aud || pdsAud,
            lxm,
            exp,
        },
        { signal },
    );
    if (!authToken.success || !authToken.data?.token) {
        throw new Error('Failed to get auth token');
    }

    return authToken.data.token;
}

async function checkUploadLimits(file: File, signal?: AbortSignal) {
    const getLimitsAuthToken = await getServiceAuthToken(
        {
            aud: 'did:web:video.bsky.app',
            lxm: 'app.bsky.video.getUploadLimits',
        },
        signal,
    );
    const limits = await fetchJson<UploadLimits>(urlcat(BSKY_VIDEO_ENDPOINT, '/app.bsky.video.getUploadLimits'), {
        headers: { Authorization: `Bearer ${getLimitsAuthToken}` },
        signal,
    });
    if (!limits?.canUpload) {
        throw new Error(limits?.error || limits?.message || 'Failed to get upload limits');
    }

    const { remainingDailyBytes = 0, remainingDailyVideos = 0 } = limits;
    if (remainingDailyBytes < file.size || remainingDailyVideos < 1) {
        throw new Error(
            `Daily upload limit reached: ${remainingDailyBytes} bytes remaining, ${remainingDailyVideos} videos remaining`,
        );
    }
}

async function setupUploadJob(profileId: string, file: File, signal?: AbortSignal) {
    const uploadAuthToken = await getServiceAuthToken(
        {
            lxm: 'com.atproto.repo.uploadBlob',
            exp: Date.now() / 1000 + 60 * 30, // 30 minutes
        },
        signal,
    );
    const job = await fetchJson<UploadJob>(
        urlcat(BSKY_VIDEO_ENDPOINT, '/app.bsky.video.uploadVideo', {
            did: profileId,
            name: `${crypto.randomUUID()}.${resolveExtFromMimeType(file.type as FileMimeType)}`,
        }),
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${uploadAuthToken}`,
                'Content-Type': file.type,
            },
            body: file,
            signal,
        },
        { noStrictOK: true },
    );
    if (!job.jobId || job.state === 'JOB_STATE_FAILED') {
        throw new Error(job.error || job.message || 'Failed to setup upload job');
    }

    return job.jobId;
}

async function waitForJobCompletion(jobId: string, signal?: AbortSignal) {
    let retryCount = 100;

    signal?.addEventListener('abort', () => {
        retryCount = 0;
    });

    while (retryCount > 0) {
        const { jobStatus } = await fetchJson<UploadJobStatus>(
            urlcat(BSKY_VIDEO_ENDPOINT, '/app.bsky.video.getJobStatus', { jobId }),
            { signal },
        );
        if (jobStatus.state === 'JOB_STATE_FAILED') {
            throw new Error(jobStatus.error || jobStatus.message || 'Failed to get job status');
        }
        if (jobStatus.state === 'JOB_STATE_COMPLETED' && jobStatus.blob) {
            return jobStatus.blob;
        }

        retryCount -= 1;
        await delay(1000);
    }

    throw new Error('Failed to upload video');
}

export async function uploadVideoToBsky(file: File, signal?: AbortSignal) {
    const session = getSessionFromStorage(SessionType.Bsky);
    if (!session) throw new Error('No Bsky profile found');

    await checkUploadLimits(file, signal);

    const jobId = await setupUploadJob(session.profileId, file, signal);
    return waitForJobCompletion(jobId, signal);
}
