/// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { dmKeys, flattenMessages, useSendDmMessage } from '@/hooks/useDirectMessages.js';
import type * as OrbChatApi from '@/providers/orb/chat/api.js';
import { ChatApiError } from '@/providers/orb/chat/api.js';
import type { ChatMessage, UserMetadata } from '@/providers/orb/chat/types.js';

const { enqueueErrorMessageMock, generateVideoCoverMock, sendMessageMock, uploadToS3Mock } = vi.hoisted(() => ({
    enqueueErrorMessageMock: vi.fn(),
    generateVideoCoverMock: vi.fn(),
    sendMessageMock: vi.fn(),
    uploadToS3Mock: vi.fn(),
}));

vi.mock('@/helpers/enqueueMessage.js', () => ({
    enqueueErrorMessage: (...args: unknown[]) => enqueueErrorMessageMock(...args),
}));
vi.mock('@/helpers/generateVideoCover.js', () => ({
    generateVideoCover: (...args: unknown[]) => generateVideoCoverMock(...args),
}));
vi.mock('@/providers/orb/chat/api.js', async (importOriginal) => ({
    ...(await importOriginal<typeof OrbChatApi>()),
    sendMessage: (...args: unknown[]) => sendMessageMock(...args),
}));
vi.mock('@/services/uploadToS3.js', () => ({
    uploadToS3: (...args: unknown[]) => uploadToS3Mock(...args),
}));

afterEach(() => {
    cleanup();
    enqueueErrorMessageMock.mockReset();
    generateVideoCoverMock.mockReset();
    sendMessageMock.mockReset();
    uploadToS3Mock.mockReset();
});

describe('useSendDmMessage', () => {
    test('keeps a failed optimistic message and shows an error notification', async () => {
        const account = '0x1234';
        const channelId = 'channel-1';
        const author: UserMetadata = { address: account, name: null, handle: null };
        const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
        const wrapper = ({ children }: { children: ReactNode }) =>
            createElement(QueryClientProvider, { client: queryClient }, children);
        sendMessageMock.mockRejectedValue(new Error('Failed to send message'));

        const { result } = renderHook(() => useSendDmMessage(account, channelId, author), { wrapper });
        await act(async () => {
            await expect(
                result.current.mutateAsync({ content: '', attachments: [], messageId: 'message-1' }),
            ).rejects.toThrow('Failed to send message');
        });

        const data = queryClient.getQueryData<{ pages: ChatMessage[][] }>(dmKeys.messages(account, channelId));
        expect(flattenMessages(data?.pages)[0]).toMatchObject({ id: 'message-1', send_status: 'failed' });
        expect(enqueueErrorMessageMock).toHaveBeenCalledOnce();
    });

    test('uploads a local video and cover before sending a MediaVideo attachment', async () => {
        const account = '0x1234';
        const channelId = 'channel-1';
        const author: UserMetadata = { address: account, name: null, handle: null };
        const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
        const wrapper = ({ children }: { children: ReactNode }) =>
            createElement(QueryClientProvider, { client: queryClient }, children);
        const file = new File(['video'], 'clip.mp4', { type: 'video/mp4' });
        Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
        generateVideoCoverMock.mockResolvedValue([new Blob(['cover'], { type: 'image/jpeg' })]);
        uploadToS3Mock
            .mockResolvedValueOnce('https://s3.example/clip.mp4')
            .mockResolvedValueOnce('https://s3.example/clip-cover.jpg');
        sendMessageMock.mockResolvedValue(null);

        const { result } = renderHook(() => useSendDmMessage(account, channelId, author), { wrapper });
        await act(async () => {
            await result.current.mutateAsync({
                content: '',
                messageId: 'message-video',
                attachments: [
                    {
                        id: 'video-1',
                        file,
                        url: 'blob:video-preview',
                        type: 'video/mp4',
                        width: 1920,
                        height: 1080,
                        duration: 12,
                    },
                ],
            });
        });

        expect(sendMessageMock).toHaveBeenCalledWith(
            account,
            expect.objectContaining({
                channelId,
                messageId: 'message-video',
                attachments: [
                    expect.objectContaining({
                        __typename: 'MediaVideo',
                        item: 'https://s3.example/clip.mp4',
                        cover: 'https://s3.example/clip-cover.jpg',
                        type: 'video/mp4',
                    }),
                ],
            }),
        );
        expect(uploadToS3Mock).toHaveBeenCalledTimes(2);
        Reflect.deleteProperty(URL, 'revokeObjectURL');
    });

    test('retries an Orb-rejected video with the minimal MediaVideo payload', async () => {
        const account = '0x1234';
        const channelId = 'channel-1';
        const author: UserMetadata = { address: account, name: null, handle: null };
        const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
        const wrapper = ({ children }: { children: ReactNode }) =>
            createElement(QueryClientProvider, { client: queryClient }, children);
        const file = new File(['video'], 'clip.mp4', { type: 'video/mp4' });
        Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
        generateVideoCoverMock.mockResolvedValue([new Blob(['cover'], { type: 'image/jpeg' })]);
        uploadToS3Mock
            .mockResolvedValueOnce('https://s3.example/clip.mp4')
            .mockResolvedValueOnce('https://s3.example/clip-cover.jpg');
        sendMessageMock
            .mockRejectedValueOnce(new ChatApiError('send-message failed', 'send-message'))
            .mockResolvedValueOnce(null);

        const { result } = renderHook(() => useSendDmMessage(account, channelId, author), { wrapper });
        await act(async () => {
            await result.current.mutateAsync({
                content: '',
                messageId: 'message-video',
                attachments: [
                    {
                        id: 'video-1',
                        file,
                        url: 'blob:video-preview',
                        type: 'video/mp4',
                        width: 480,
                        height: 270,
                        duration: 199.5625,
                    },
                ],
            });
        });

        expect(sendMessageMock).toHaveBeenCalledTimes(2);
        expect(sendMessageMock).toHaveBeenLastCalledWith(account, {
            channelId,
            content: undefined,
            messageId: 'message-video',
            attachments: [
                {
                    __typename: 'MediaVideo',
                    id: 'video-1',
                    index: 0,
                    item: 'https://s3.example/clip.mp4',
                    cover: 'https://s3.example/clip-cover.jpg',
                    type: 'video/mp4',
                },
            ],
        });
        const data = queryClient.getQueryData<{ pages: ChatMessage[][] }>(dmKeys.messages(account, channelId));
        expect(flattenMessages(data?.pages)[0]?.attachments).toEqual([
            expect.objectContaining({ width: 480, height: 270, aspectRatio: 16 / 9 }),
        ]);
        expect(uploadToS3Mock).toHaveBeenCalledTimes(2);
        Reflect.deleteProperty(URL, 'revokeObjectURL');
    });
});
