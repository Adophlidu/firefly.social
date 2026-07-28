/// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { dmKeys, flattenMessages, useSendDmMessage, useSendDmTip } from '@/hooks/useDirectMessages.js';
import type * as OrbChatApi from '@/providers/orb/chat/api.js';
import { ChatApiError } from '@/providers/orb/chat/api.js';
import type { ChatMessage, UserMetadata } from '@/providers/orb/chat/types.js';

const {
    completeInteractiveActionMock,
    createDirectTipInteractiveActionMock,
    enqueueErrorMessageMock,
    generateVideoCoverMock,
    sendMessageMock,
    uploadToS3Mock,
} = vi.hoisted(() => ({
    completeInteractiveActionMock: vi.fn(),
    createDirectTipInteractiveActionMock: vi.fn(),
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
    completeInteractiveAction: (...args: unknown[]) => completeInteractiveActionMock(...args),
    createDirectTipInteractiveAction: (...args: unknown[]) => createDirectTipInteractiveActionMock(...args),
    sendMessage: (...args: unknown[]) => sendMessageMock(...args),
}));
vi.mock('@/services/uploadToS3.js', () => ({
    uploadToS3: (...args: unknown[]) => uploadToS3Mock(...args),
}));

afterEach(() => {
    cleanup();
    completeInteractiveActionMock.mockReset();
    createDirectTipInteractiveActionMock.mockReset();
    enqueueErrorMessageMock.mockReset();
    generateVideoCoverMock.mockReset();
    sendMessageMock.mockReset();
    uploadToS3Mock.mockReset();
});

describe('useSendDmTip', () => {
    const account = '0x1234';
    const channelId = 'channel-1';
    const author: UserMetadata = { address: account, name: null, handle: null };
    const tip = {
        targetUserId: '0x5678',
        amount: 1,
        currency: '0xtoken',
        currencySymbol: 'GHO',
        chainId: 232,
    };

    function createWrapper(queryClient: QueryClient) {
        return function Wrapper({ children }: { children: ReactNode }) {
            return createElement(QueryClientProvider, { client: queryClient }, children);
        };
    }

    test('shows a local pending card before the interactive action is created', async () => {
        const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
        let resolveCreate: (id: string) => void = () => undefined;
        createDirectTipInteractiveActionMock.mockReturnValue(
            new Promise<string>((resolve) => {
                resolveCreate = resolve;
            }),
        );
        completeInteractiveActionMock.mockResolvedValue(undefined);
        sendMessageMock.mockResolvedValue(null);

        const { result } = renderHook(() => useSendDmTip(account, channelId, author), {
            wrapper: createWrapper(queryClient),
        });
        let mutation: Promise<unknown> | undefined;
        act(() => {
            mutation = result.current.mutateAsync({ ...tip, messageId: 'message-tip' });
        });

        await waitFor(() => {
            const data = queryClient.getQueryData<{ pages: ChatMessage[][] }>(dmKeys.messages(account, channelId));
            expect(flattenMessages(data?.pages)[0]).toMatchObject({
                id: 'message-tip',
                interactive_action_id: null,
                send_status: 'pending',
                pending_tip: { ...tip, nextStep: 'create' },
            });
        });

        resolveCreate('action-1');
        await act(async () => mutation);

        expect(completeInteractiveActionMock).toHaveBeenCalledWith(account, 'action-1');
        expect(sendMessageMock).toHaveBeenCalledWith(account, {
            channelId,
            messageId: 'message-tip',
            attachments: [],
            interactiveActionId: 'action-1',
        });
        const data = queryClient.getQueryData<{ pages: ChatMessage[][] }>(dmKeys.messages(account, channelId));
        expect(flattenMessages(data?.pages)[0]).toMatchObject({
            id: 'message-tip',
            interactive_action_id: 'action-1',
            send_status: 'sent',
        });
    });

    test('retries from the failed step without creating another interactive action', async () => {
        const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
        createDirectTipInteractiveActionMock.mockResolvedValue('action-1');
        completeInteractiveActionMock.mockRejectedValueOnce(new Error('Failed to complete'));
        sendMessageMock.mockResolvedValue(null);

        const { result } = renderHook(() => useSendDmTip(account, channelId, author), {
            wrapper: createWrapper(queryClient),
        });
        await act(async () => {
            await expect(result.current.mutateAsync({ ...tip, messageId: 'message-tip' })).rejects.toThrow(
                'Failed to complete',
            );
        });

        const failedData = queryClient.getQueryData<{ pages: ChatMessage[][] }>(dmKeys.messages(account, channelId));
        expect(flattenMessages(failedData?.pages)[0]).toMatchObject({
            interactive_action_id: 'action-1',
            send_status: 'failed',
            pending_tip: { ...tip, nextStep: 'complete' },
        });

        queryClient.setQueryData(dmKeys.interactiveAction(account, 'action-1'), {
            amount: 1,
            currencySymbol: 'GHO',
            status: 'PENDING',
            message: null,
        });
        completeInteractiveActionMock.mockResolvedValue(undefined);
        await act(async () => {
            await result.current.mutateAsync({
                ...tip,
                messageId: 'message-tip',
                interactiveActionId: 'action-1',
                nextStep: 'complete',
            });
        });

        expect(createDirectTipInteractiveActionMock).toHaveBeenCalledOnce();
        expect(completeInteractiveActionMock).toHaveBeenCalledTimes(2);
        expect(sendMessageMock).toHaveBeenCalledOnce();
        expect(enqueueErrorMessageMock).not.toHaveBeenCalled();
        expect(queryClient.getQueryData(dmKeys.interactiveAction(account, 'action-1'))).toBeUndefined();
    });
});

describe('useSendDmMessage', () => {
    test('sends an interactive action and keeps it in the optimistic tip message', async () => {
        const account = '0x1234';
        const channelId = 'channel-1';
        const author: UserMetadata = { address: account, name: null, handle: null };
        const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
        const wrapper = ({ children }: { children: ReactNode }) =>
            createElement(QueryClientProvider, { client: queryClient }, children);
        sendMessageMock.mockResolvedValue(null);

        const { result } = renderHook(() => useSendDmMessage(account, channelId, author), { wrapper });
        await act(async () => {
            await result.current.mutateAsync({
                content: '',
                attachments: [],
                interactiveActionId: 'tip-1',
                messageId: 'message-tip',
            });
        });

        expect(sendMessageMock).toHaveBeenCalledWith(account, {
            channelId,
            content: undefined,
            messageId: 'message-tip',
            attachments: [],
            interactiveActionId: 'tip-1',
        });
        const data = queryClient.getQueryData<{ pages: ChatMessage[][] }>(dmKeys.messages(account, channelId));
        expect(flattenMessages(data?.pages)[0]).toMatchObject({
            id: 'message-tip',
            interactive_action_id: 'tip-1',
            send_status: 'sent',
        });
    });

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
