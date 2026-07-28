import { RestrictionType, Source } from '@dimensiondev/enums';
import { describe, expect, it, vi } from 'vitest';

import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import type { CompositePost } from '@/types/compose.js';

const mocks = vi.hoisted(() => ({
    createLensPostMetadata: vi.fn(() => ({ lens: { id: 'metadata-id' } })),
    createPayloadAttachments: vi.fn(),
    uploadJson: vi.fn(async () => ({ uri: 'lens://metadata' })),
}));

vi.mock('@/helpers/chars.js', () => ({
    readChars: () => 'scheduled club post',
}));

vi.mock('@/helpers/getCurrentProfileFromStorage.js', () => ({
    getCurrentProfileFromStorage: () => ({
        profileId: '0x1111111111111111111111111111111111111111',
        handle: 'jack',
    }),
}));

vi.mock('@/providers/lens/Grove.js', () => ({
    GroveStorageProvider: {
        uploadJson: mocks.uploadJson,
    },
}));

vi.mock('@/providers/lens/postToLens.js', () => ({
    createLensPostMetadata: mocks.createLensPostMetadata,
    createPayloadAttachments: mocks.createPayloadAttachments,
}));

const { createLensSchedulePostPayload } = await import('@/providers/lens/createLensSchedulePostPayload.js');

const GROUP_ADDRESS = '0x2222222222222222222222222222222222222222';
const FEED_ADDRESS = '0x3333333333333333333333333333333333333333';

function createCompositePost(): CompositePost {
    return {
        id: 'post',
        postId: {
            [Source.Farcaster]: null,
            [Source.Lens]: null,
            [Source.Twitter]: null,
            [Source.Bsky]: null,
        },
        postContentURI: {
            [Source.Farcaster]: null,
            [Source.Lens]: null,
            [Source.Twitter]: null,
            [Source.Bsky]: null,
        },
        parentPost: {
            [Source.Farcaster]: null,
            [Source.Lens]: null,
            [Source.Twitter]: null,
            [Source.Bsky]: null,
        },
        postError: {
            [Source.Farcaster]: null,
            [Source.Lens]: null,
            [Source.Twitter]: null,
            [Source.Bsky]: null,
        },
        chars: 'scheduled club post',
        restriction: RestrictionType.Everyone,
        availableSources: [Source.Lens],
        channel: {
            [Source.Farcaster]: null,
            [Source.Lens]: {
                source: Source.Lens,
                id: GROUP_ADDRESS,
                feedId: FEED_ADDRESS,
                name: 'Club',
                imageUrl: '',
                url: '',
                parentUrl: '',
                followerCount: 1,
                timestamp: 0,
            },
            [Source.Twitter]: null,
            [Source.Bsky]: null,
        },
        isAnonymous: false,
        videos: [],
        images: [],
        urls: [],
        poll: null,
        rpPayload: null,
        frames: [],
        openGraphs: [],
    };
}

describe('createLensSchedulePostPayload', () => {
    it('includes the selected Lens club feed in the scheduled CreatePost request', async () => {
        const payload = await createLensSchedulePostPayload('compose', createCompositePost());

        expect(payload.variables.request).toMatchObject({
            contentUri: 'lens://metadata',
            feed: safeEvmAddress(FEED_ADDRESS),
        });
        expect(mocks.uploadJson).toHaveBeenCalledOnce();
    });

    it('omits feed for a scheduled Lens post without a club', async () => {
        const post = createCompositePost();
        post.channel[Source.Lens] = null;

        const payload = await createLensSchedulePostPayload('compose', post);

        expect(payload.variables.request.feed).toBeUndefined();
    });
});
