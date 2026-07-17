import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    createChat,
    DmAuthenticationError,
    getChatChannel,
    getChatChannelByUser,
    getChatChannels,
    getChatMessages,
    getInteractiveAction,
    searchProfiles,
    sendMessage,
} from '@/providers/orb/chat/api.js';

const { fetchJsonMock, getSessionMock, refreshLensSessionMock, updateSessionMock } = vi.hoisted(() => ({
    fetchJsonMock: vi.fn(),
    getSessionMock: vi.fn(),
    refreshLensSessionMock: vi.fn(),
    updateSessionMock: vi.fn(),
}));

vi.mock('@/helpers/fetchJson.js', () => ({ fetchJson: (...args: unknown[]) => fetchJsonMock(...args) }));
vi.mock('@/helpers/getSessionFromStorage.js', () => ({
    getSessionFromStorage: (...args: unknown[]) => getSessionMock(...args),
}));
vi.mock('@/helpers/updateCurrentSessionToStorage.js', () => ({
    updateCurrentSessionToStorage: (...args: unknown[]) => updateSessionMock(...args),
}));
vi.mock('@/providers/lens/refreshLensSession.js', () => ({
    refreshLensSession: (...args: unknown[]) => refreshLensSessionMock(...args),
}));

const identity = { account: '0x1234' };

// A LensSession-shaped stub — DM reads the token straight from the active Lens session in storage.
let currentSession: { address: string; token: string; refreshToken: string };

describe('Orb chat API', () => {
    beforeEach(() => {
        fetchJsonMock.mockReset();
        currentSession = { address: identity.account, token: 'lens-access-token', refreshToken: 'lens-refresh-token' };
        getSessionMock.mockReset().mockImplementation(() => currentSession);
        // The refresh path persists the new session; mirror that so a retried request reads the new token.
        refreshLensSessionMock.mockReset().mockResolvedValue({ ...currentSession, token: 'refreshed-token' });
        updateSessionMock.mockReset().mockImplementation((_source: unknown, session: typeof currentSession) => {
            currentSession = session;
        });
    });

    it('uses the active Orb DM token and unwraps channel items', async () => {
        const channel = { id: 'channel-1', name: 'Alice' };
        fetchJsonMock.mockResolvedValueOnce({ status: 'SUCCESS', data: { items: [channel] } });

        await expect(getChatChannels(identity.account, { cursor: 20, limit: 10, type: 'dm' })).resolves.toMatchObject([
            channel,
        ]);
        expect(fetchJsonMock).toHaveBeenCalledWith('/api/orb/chat/get-chat-channels', {
            method: 'POST',
            headers: { 'x-access-token': 'Bearer lens-access-token' },
            body: JSON.stringify({ cursor: 20, limit: 10, type: 'dm' }),
        });
    });

    it('backfills a missing channel_membership so downstream reads never crash', async () => {
        fetchJsonMock.mockResolvedValueOnce({ status: 'SUCCESS', data: { id: 'channel-3', name: 'Bob' } });

        const channel = await getChatChannel(identity.account, 'channel-3');

        expect(channel?.channel_membership).toMatchObject({
            unread_count: 0,
            is_muted: false,
            is_pinned: false,
            last_read_message_id: null,
        });
    });

    it('gets an existing DM channel by the other Lens account', async () => {
        fetchJsonMock.mockResolvedValueOnce({ status: 'SUCCESS', data: { id: 'channel-4', name: 'Alice' } });

        await expect(getChatChannelByUser(identity.account, ' 0xAbCd ')).resolves.toMatchObject({ id: 'channel-4' });
        expect(fetchJsonMock).toHaveBeenCalledWith('/api/orb/chat/get-chat-channel', {
            method: 'POST',
            headers: { 'x-access-token': 'Bearer lens-access-token' },
            body: JSON.stringify({ otherUserId: '0xabcd' }),
        });
    });

    it('returns null when the other Lens account has no DM channel', async () => {
        fetchJsonMock.mockResolvedValueOnce({ status: 'SUCCESS', data: null });

        await expect(getChatChannelByUser(identity.account, '0xabcd')).resolves.toBeNull();
    });

    it('rejects a request when its query account is no longer active', async () => {
        await expect(getChatChannels('0xdifferent')).rejects.toBeInstanceOf(DmAuthenticationError);
        expect(fetchJsonMock).not.toHaveBeenCalled();
    });

    it('accepts the channel id returned at the top level', async () => {
        fetchJsonMock.mockResolvedValueOnce({ status: 'SUCCESS', channelId: 'channel-2' });

        await expect(createChat(identity.account, ' 0xC5B11b782856bd04B1441fF11C9f5B564C077c97 ')).resolves.toBe(
            'channel-2',
        );
        expect(fetchJsonMock).toHaveBeenCalledWith('/api/orb/chat/create-chat', {
            method: 'POST',
            headers: { 'x-access-token': 'Bearer lens-access-token' },
            body: JSON.stringify({ targetUserId: '0xc5b11b782856bd04b1441ff11c9f5b564c077c97' }),
        });
    });

    it('normalizes the legacy author field in messages', async () => {
        const author = { address: '0xabcd', name: 'Alice', handle: 'alice' };
        fetchJsonMock.mockResolvedValueOnce({
            status: 'SUCCESS',
            data: {
                items: [
                    {
                        id: 'message-1',
                        channel_id: 'channel-1',
                        author_id: '0xabcd',
                        author,
                        content: 'Hello',
                        attachments: [],
                    },
                ],
            },
        });

        const [message] = await getChatMessages(identity.account, { channelId: 'channel-1' });
        expect(message?.author_profile).toEqual(author);
    });

    it('normalizes the latest message returned with a channel', async () => {
        fetchJsonMock.mockResolvedValueOnce({
            status: 'SUCCESS',
            data: {
                items: [
                    {
                        id: 'channel-1',
                        last_message: {
                            id: 'message-1',
                            author: { address: '0xabcd', name: 'Alice', handle: 'alice' },
                            attachments: undefined,
                        },
                    },
                ],
            },
        });

        const [channel] = await getChatChannels(identity.account);

        expect(channel?.last_message?.author_profile).toMatchObject({ address: '0xabcd' });
        expect(channel?.last_message?.attachments).toEqual([]);
    });

    it('normalizes missing attachments in a sent message', async () => {
        fetchJsonMock.mockResolvedValueOnce({
            status: 'SUCCESS',
            data: {
                id: 'message-2',
                channel_id: 'channel-1',
                author_id: identity.account,
                content: 'Hello',
            },
        });

        const message = await sendMessage(identity.account, {
            channelId: 'channel-1',
            content: 'Hello',
            messageId: 'message-2',
        });

        expect(message?.attachments).toEqual([]);
    });

    it('loads an interactive action through the authenticated DM proxy', async () => {
        const detail = { amount: 1, currencySymbol: 'GHO', status: 'PENDING', message: null };
        fetchJsonMock.mockResolvedValueOnce({ status: 'SUCCESS', data: detail });

        await expect(getInteractiveAction(identity.account, 'tip-1')).resolves.toEqual(detail);
        expect(fetchJsonMock).toHaveBeenCalledWith('/api/orb/chat/get-interactive-action', {
            method: 'POST',
            headers: { 'x-access-token': 'Bearer lens-access-token' },
            body: JSON.stringify({ interactiveActionId: 'tip-1' }),
        });
    });

    it('forwards media attachments when sending a message', async () => {
        const attachment = {
            __typename: 'MediaImage' as const,
            id: 'image-1',
            index: 0,
            item: 'https://s3.example/image.png',
            raw: 'https://s3.example/image.png',
            type: 'image/png',
        };
        fetchJsonMock.mockResolvedValueOnce({
            status: 'SUCCESS',
            data: {
                id: 'message-with-image',
                channel_id: 'channel-1',
                author_id: identity.account,
                attachments: [attachment],
            },
        });

        await sendMessage(identity.account, {
            channelId: 'channel-1',
            messageId: 'message-with-image',
            attachments: [attachment],
        });

        expect(fetchJsonMock).toHaveBeenCalledWith('/api/orb/chat/send-message', {
            method: 'POST',
            headers: { 'x-access-token': 'Bearer lens-access-token' },
            body: JSON.stringify({
                sendFcm: true,
                channelId: 'channel-1',
                messageId: 'message-with-image',
                attachments: [attachment],
            }),
        });
    });

    it('refreshes the Lens token and retries once when Orb reports expired auth', async () => {
        fetchJsonMock
            .mockResolvedValueOnce({ status: 'FAILED', msg: 'Expired auth token' })
            .mockResolvedValueOnce({ status: 'SUCCESS', data: { items: [] } });

        await expect(getChatChannels(identity.account)).resolves.toEqual([]);
        expect(refreshLensSessionMock).toHaveBeenCalledOnce();
        expect(fetchJsonMock).toHaveBeenLastCalledWith(
            '/api/orb/chat/get-chat-channels',
            expect.objectContaining({ headers: { 'x-access-token': 'Bearer refreshed-token' } }),
        );
    });

    it('raises an auth error when Orb reports expired auth and the Lens refresh fails', async () => {
        fetchJsonMock.mockResolvedValue({ status: 'FAILED', msg: 'Expired auth token' });
        refreshLensSessionMock.mockRejectedValue(new Error('refresh failed'));

        await expect(getChatChannels(identity.account)).rejects.toBeInstanceOf(DmAuthenticationError);
        expect(refreshLensSessionMock).toHaveBeenCalledOnce();
        // No retry request is issued because the refresh produced no session.
        expect(fetchJsonMock).toHaveBeenCalledOnce();
    });

    it('raises an auth error when a retried request still returns expired auth', async () => {
        fetchJsonMock.mockResolvedValue({ status: 'FAILED', msg: 'Expired auth token' });

        await expect(getChatChannels(identity.account)).rejects.toBeInstanceOf(DmAuthenticationError);
        // Initial request plus one retry, then the auth error surfaces instead of a generic failure.
        expect(fetchJsonMock).toHaveBeenCalledTimes(2);
    });

    it('normalizes Orb profile search results', async () => {
        fetchJsonMock.mockResolvedValueOnce({
            status: 'SUCCESS',
            data: {
                items: [
                    {
                        // Orb's search returns the wallet address as both `id` and `metadata.address`.
                        id: '0xc5b11b782856bd04b1441ff11c9f5b564c077c97',
                        metadata: {
                            handle: 'alice',
                            name: 'Alice',
                            address: '0xc5b11b782856bd04b1441ff11c9f5b564c077c97',
                            picture: { url: 'https://images.example/alice.png' },
                        },
                    },
                    { id: '0x0000000000000000000000000000000000000000', metadata: { name: 'Ignored' } },
                ],
            },
        });

        await expect(searchProfiles(identity.account, 'ali')).resolves.toEqual([
            {
                id: '0xc5b11b782856bd04b1441ff11c9f5b564c077c97',
                handle: 'alice',
                name: 'Alice',
                avatar: 'https://images.example/alice.png',
            },
        ]);
    });
});
