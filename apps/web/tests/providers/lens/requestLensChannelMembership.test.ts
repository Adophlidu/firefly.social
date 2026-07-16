import { Source } from '@dimensiondev/enums';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Channel } from '@/providers/types/SocialMedia.js';

const mocks = vi.hoisted(() => ({
    requestGroupMembership: vi.fn(),
    ensureLensResult: vi.fn(),
    handleOperationWithLensChain: vi.fn(),
    joinChannel: vi.fn(),
    leaveChannel: vi.fn(),
    markJoined: vi.fn(),
    markLeft: vi.fn(),
    setQueriesData: vi.fn(),
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
}));

vi.mock('@lens-protocol/client/actions', () => ({
    requestGroupMembership: mocks.requestGroupMembership,
}));
vi.mock('@/configs/queryClient.js', () => ({
    queryClient: {
        setQueriesData: mocks.setQueriesData,
        setQueryData: mocks.setQueryData,
        invalidateQueries: mocks.invalidateQueries,
    },
}));
vi.mock('@/helpers/resolveSocialMediaProvider.js', () => ({
    resolveSocialMediaProvider: () => ({ joinChannel: mocks.joinChannel, leaveChannel: mocks.leaveChannel }),
}));
vi.mock('@/providers/lens/ensureLensResult.js', () => ({
    ensureLensResult: mocks.ensureLensResult,
}));
vi.mock('@/providers/lens/handleOperationWithLensChain.js', () => ({
    handleOperationWithLensChain: mocks.handleOperationWithLensChain,
}));
vi.mock('@/providers/lens/LensSessionClientHolder.js', () => ({
    lensSessionClientHolder: { sessionClient: 'session-client' },
}));
vi.mock('@/store/useJoinedChannelStore.js', () => ({
    useJoinedChannelStore: { getState: () => ({ markJoined: mocks.markJoined, markLeft: mocks.markLeft }) },
}));

const { joinOrRequestLensChannel, leaveLensChannelMembership } =
    await import('@/providers/lens/requestLensChannelMembership.js');

const PROFILE_ID = '0xprofile';

function channel(membershipStatus: Channel['membershipStatus']): Channel {
    return {
        source: Source.Lens,
        id: '0x1234567890123456789012345678901234567890',
        name: 'Club',
        imageUrl: '',
        url: '',
        parentUrl: '',
        followerCount: 1,
        timestamp: 0,
        membershipStatus,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    mocks.requestGroupMembership.mockReturnValue('request-result');
    mocks.ensureLensResult.mockResolvedValue('operation');
    mocks.handleOperationWithLensChain.mockResolvedValue(undefined);
    mocks.joinChannel.mockResolvedValue(true);
    mocks.leaveChannel.mockResolvedValue(true);
    mocks.invalidateQueries.mockResolvedValue(undefined);
});

describe('joinOrRequestLensChannel', () => {
    it('requests approval and caches pending without marking the profile as joined', async () => {
        const club = channel('requestToJoin');

        await expect(joinOrRequestLensChannel(club, PROFILE_ID)).resolves.toBe('pending');

        expect(mocks.requestGroupMembership).toHaveBeenCalledWith('session-client', { group: club.id });
        expect(mocks.handleOperationWithLensChain).toHaveBeenCalledWith('operation');
        expect(mocks.joinChannel).not.toHaveBeenCalled();
        expect(mocks.markJoined).not.toHaveBeenCalled();
        expect(mocks.setQueryData).toHaveBeenCalledWith(
            ['channel', Source.Lens, club.id, PROFILE_ID],
            expect.any(Function),
        );
        const update = mocks.setQueryData.mock.calls[0][1];
        expect(update(undefined)).toMatchObject({
            membershipStatus: 'pendingRequest',
            isMember: false,
            canJoin: false,
        });
    });

    it('re-requests approval after a rejection', async () => {
        await expect(joinOrRequestLensChannel(channel('pendingRequestRejected'), PROFILE_ID)).resolves.toBe('pending');
        expect(mocks.requestGroupMembership).toHaveBeenCalledOnce();
        expect(mocks.joinChannel).not.toHaveBeenCalled();
    });

    it('uses the existing join provider and caches joined membership for an open club', async () => {
        const club = channel('join');

        await expect(joinOrRequestLensChannel(club, PROFILE_ID)).resolves.toBe('joined');

        expect(mocks.joinChannel).toHaveBeenCalledWith(club);
        expect(mocks.requestGroupMembership).not.toHaveBeenCalled();
        expect(mocks.markJoined).toHaveBeenCalledWith(PROFILE_ID, club.id);
        expect(mocks.invalidateQueries).toHaveBeenCalledWith({
            queryKey: ['channel', Source.Lens, club.id],
        });
        expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['search-channels', Source.Lens] });
        const update = mocks.setQueryData.mock.calls[0][1];
        expect(update(undefined)).toMatchObject({ membershipStatus: 'joined', isMember: true, canLeave: true });
        expect(mocks.setQueryData).toHaveBeenCalledTimes(2);
    });

    it('does not update caches when an approval request fails', async () => {
        mocks.ensureLensResult.mockRejectedValue(new Error('request failed'));

        await expect(joinOrRequestLensChannel(channel('requestToJoin'), PROFILE_ID)).rejects.toThrow('request failed');

        expect(mocks.setQueryData).not.toHaveBeenCalled();
        expect(mocks.setQueriesData).not.toHaveBeenCalled();
        expect(mocks.markJoined).not.toHaveBeenCalled();
        expect(mocks.invalidateQueries).not.toHaveBeenCalled();
    });

    it('clears the local membership override after a successful leave', async () => {
        const club = channel('joined');

        await expect(leaveLensChannelMembership(club, PROFILE_ID)).resolves.toBe(true);

        expect(mocks.leaveChannel).toHaveBeenCalledWith(club);
        expect(mocks.markLeft).toHaveBeenCalledWith(PROFILE_ID, club.id);
    });

    it('preserves the local membership override when leave is not confirmed', async () => {
        mocks.leaveChannel.mockResolvedValue(false);

        await expect(leaveLensChannelMembership(channel('joined'), PROFILE_ID)).resolves.toBe(false);

        expect(mocks.markLeft).not.toHaveBeenCalled();
    });
});
