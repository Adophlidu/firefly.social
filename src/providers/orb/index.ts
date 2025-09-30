import dayjs from 'dayjs';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { formatOrbPoll } from '@/helpers/formatOrbPoll.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { ensureLensResultSync } from '@/providers/lens/ensureLensResultSync.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import type {
    CreatePollResult,
    OrbPoll,
    ORBPollSignInResponseData,
    ORBSignInResponseData,
    VoteResult,
} from '@/providers/orb/type.js';
import { captureCreateOrbPollEvent } from '@/providers/telemetry/capturePollEvent.js';
import type { CompositePoll } from '@/providers/types/Poll.js';
import type { ResponseJson } from '@/types/utility.js';

class Orb {
    async initSignIn() {
        const response = await fetchJson<ResponseJson<ORBSignInResponseData>>('/api/orb/init-sign-in');
        const data = resolveResponseData(response, 'Failed to init sign in orb');
        return data;
    }

    async pollSignIn(secret: string, signal?: AbortSignal) {
        const response = await fetchJson<ResponseJson<ORBPollSignInResponseData>>('/api/orb/poll-sign-in', {
            method: 'POST',
            body: JSON.stringify({ secret }),
            signal,
        });
        const data = resolveResponseData(response, 'Failed to poll sign in orb');
        return data;
    }

    async getPoll(postId: string, profileId?: string) {
        const url = urlcat('/api/orb/poll/get', { postId, profileId });
        const response = await fetchJson<ResponseJson<OrbPoll>>(url);
        const data = resolveResponseData(response, 'Failed to get poll.');

        return formatOrbPoll(data);
    }

    async vote(postId: string, pollOptions: number[]) {
        const credentials = ensureLensResultSync(lensSessionHolder.sessionClient.getCredentials());
        if (!credentials?.accessToken) {
            throw new Error('No lens access token.');
        }

        const response = await fetchJson<ResponseJson<VoteResult>>('/api/orb/poll/vote', {
            method: 'POST',
            body: JSON.stringify({
                postId,
                pollOptions,
            }),
            headers: {
                'x-access-token': `Bearer ${credentials.accessToken}`,
            },
        });
        return resolveResponseData(response, 'Failed to get poll.');
    }

    async createPollPost(pollTitle: string, draftPoll: CompositePoll) {
        const credentials = ensureLensResultSync(lensSessionHolder.sessionClient.getCredentials());
        if (!credentials?.accessToken) {
            throw new Error('No lens access token.');
        }

        const response = await fetchJson<ResponseJson<CreatePollResult>>('/api/orb/poll/create', {
            method: 'POST',
            body: JSON.stringify({
                content: pollTitle,
                poll: {
                    allowMultipleAnswers: false,
                    questions: draftPoll.options.map((x) => x.label),
                    endTimestamp: dayjs().add(dayjs.duration(draftPoll.duration)).valueOf(),
                },
            }),
            headers: {
                'x-access-token': `Bearer ${credentials.accessToken}`,
            },
        });
        const { hash } = resolveResponseData(response, 'Failed to create poll.');
        const post = await LensSocialMediaProvider.getPostByTxHashWithPolling(hash);
        if (!post) {
            throw new Error('Post not found');
        }

        captureCreateOrbPollEvent(post.postId);

        return { postId: post.postId };
    }
}

export const OrbProvider = new Orb();
