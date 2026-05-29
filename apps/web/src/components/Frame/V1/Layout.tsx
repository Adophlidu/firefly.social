'use client';

import { FIREFLY_WORKER_HOST } from '@dimensiondev/constants/static';
import type { SocialSource } from '@dimensiondev/enums';
import { ActionType, SessionType, Source } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { isValidAddressEthereum, parseCAIP10 } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { memo, type ReactNode, useState } from 'react';
import { useAsyncFn } from 'react-use';
import urlcat from 'urlcat';
import { encodePacked, type Hex, type SignTypedDataParameters } from 'viem';
import { getAccount } from 'wagmi/actions';
import { z } from 'zod';

import { Card } from '@/components/Frame/V1/Card.js';
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { enqueueErrorMessage, enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getSessionFromStorage, getSessionFromStorageBySource } from '@/helpers/getSessionFromStorage.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { interceptExternalUrl } from '@/helpers/interceptExternalUrl.js';
import { openLoginModalWithGuard } from '@/helpers/openLoginModal.js';
import { openWindow } from '@/helpers/openWindow.js';
import { untilImageUrlLoaded } from '@/helpers/untilImageLoaded.js';
import { ConfirmLeavingModalRef } from '@/modals/ConfirmLeavingModal/refs.js';
import { LensFrameProvider } from '@/providers/lens/Frame.js';
import { NeynarFrameProvider } from '@/providers/neynar/Frame.js';
import { captureFrameActionEvent } from '@/providers/telemetry/captureFrameActionEvent.js';
import type { Additional } from '@/providers/types/Frame.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { getFrameMintTransaction } from '@/services/getFrameMintTransaction.js';
import {
    type FrameButton,
    type FrameV1,
    type LinkDigestedResponse,
    MethodType,
    type RedirectUrlResponse,
} from '@/types/frame.js';
import type { ResponseJson } from '@/types/utility.js';

const TransactionSchema = z.object({
    // a CAIP-2 chain ID to identify the tx network
    chainId: z.string().refine((x) => x.startsWith('eip155:'), { message: 'Invalid chain ID format.' }),
    method: z.literal(MethodType.ETH_SEND_TRANSACTION),
    // identifying client in calldata
    // learn more: https://www.notion.so/warpcast/Frame-Transactions-Public-9d9f9f4f527249519a41bd8d16165f73?pvs=4#c1c3182208ce4ae4a7ffa72129b9795a
    attribution: z.boolean().optional(),
    params: z.object({
        // JSON ABI which must include encoded function type and should include potential error types. Can be empty.
        abi: z.union([z.object({}), z.array(z.object({})), z.string()]).optional(),
        to: z.string().refine((x) => isValidAddressEthereum(x), { message: 'Invalid address format.' }),
        value: z.string().optional(),
        data: z.string().optional(),
    }),
});

const SignTypedDataV4Schema = z.object({
    // a CAIP-2 chain ID to identify the tx network
    chainId: z.string().refine((x) => x.startsWith('eip155:'), { message: 'Invalid chain ID format.' }),
    method: z.literal(MethodType.ETH_SIGN_TYPED_DATA_V4),
    params: z.object({
        domain: z.object({
            name: z.string().optional(),
            version: z.string().optional(),
            chainId: z.union([z.number(), z.string()]).optional(),
            verifyingContract: z.string().optional(),
        }),
        types: z.record(z.unknown()),
        primaryType: z.string(),
        message: z.record(z.unknown()),
    }),
});

const WalletActionSchema = z.union([TransactionSchema, SignTypedDataV4Schema]);

async function getNextFrame(
    source: SocialSource,
    postId: string,
    frame: FrameV1,
    latestFrame: FrameV1 | null,
    button: FrameButton,
    input?: string,
) {
    async function createPacket(additional?: Additional) {
        switch (source) {
            case Source.Lens:
                return LensFrameProvider.generateSignaturePacket(postId, frame.url, button.index, input, {
                    state: latestFrame && frame.state ? frame.state : undefined,
                    ...additional,
                });
            case Source.Farcaster:
                return NeynarFrameProvider.generateSignaturePacket(postId, frame.url, button.index, input, {
                    state: latestFrame && frame.state ? frame.state : undefined,
                    ...additional,
                });
            case Source.Twitter:
                return null;
            case Source.Bsky:
                return null;
            default:
                safeUnreachable(source);
                return null;
        }
    }

    async function postAction<T>(additional?: Additional) {
        const packet = await createPacket(additional);
        if (!packet) {
            enqueueErrorMessage(<Trans>Failed to generate signature packet with source = {source}.</Trans>);
            throw new Error('Failed to generate signature packet.');
        }
        const url = urlcat(FIREFLY_WORKER_HOST, '/frame', {
            url: frame.url,
            action: button.action,
            target: button.target,
            'post-url': button.postUrl || frame.postUrl,
        });
        return fetchJson<ResponseJson<T>>(url, {
            method: 'POST',
            body: JSON.stringify(packet),
        });
    }

    const address = getAccount(wagmiConfig)?.address;
    await captureFrameActionEvent('others', frame, address, true);

    try {
        switch (button.action) {
            case ActionType.Post: {
                const response = await postAction<LinkDigestedResponse<FrameV1>>();
                const nextFrame = response.success ? (response.data.frame as FrameV1) : null;

                if (!nextFrame) {
                    enqueueErrorMessage(<Trans>The frame server failed to process the request.</Trans>);
                    return null;
                }

                // in case the image loaded after loading state is set to false
                if (nextFrame.image.url) {
                    try {
                        await untilImageUrlLoaded(nextFrame.image.url, AbortSignal.timeout(3_000));
                    } catch {
                        // ignore
                    }
                }

                await captureFrameActionEvent('others', frame, address);
                return nextFrame;
            }
            case ActionType.PostRedirect: {
                const response = await postAction<RedirectUrlResponse>();
                const redirectUrl = response.success ? response.data.redirectUrl : null;
                if (!redirectUrl) {
                    enqueueErrorMessage(<Trans>The frame server failed to process the request.</Trans>);
                    return null;
                }

                if (await ConfirmLeavingModalRef.openAndWaitForClose(redirectUrl)) openWindow(redirectUrl, '_blank');
                await captureFrameActionEvent('others', frame, address);
                return null;
            }
            case ActionType.Link:
                if (!button.target) return null;

                const intercepted = await interceptExternalUrl(button.target);
                if (intercepted) return null;

                if (await ConfirmLeavingModalRef.openAndWaitForClose(button.target))
                    openWindow(button.target, '_blank');
                await captureFrameActionEvent('others', frame, address);
                return null;
            case ActionType.Mint: {
                const mintTx = await getFrameMintTransaction(frame, button);
                if (mintTx && button.target) {
                    const { chainId } = parseCAIP10(button.target);
                    const client = await getWalletClientRequired(wagmiConfig, {
                        chainId,
                    });
                    if (client.chain.id !== chainId) throw new Error('The chainId mismatch.');
                    await client.sendTransaction(mintTx);
                    await captureFrameActionEvent('others', frame, address);
                    return null;
                }

                if (await ConfirmLeavingModalRef.openAndWaitForClose(frame.url)) {
                    openWindow(frame.url, '_blank');
                }
                return null;
            }
            case ActionType.Transaction:
                if (!address) {
                    await getWalletClientRequired(wagmiConfig);
                    return null;
                }
                const walletAction = await postAction<z.infer<typeof WalletActionSchema>>({
                    address,
                });
                if (!walletAction.success) throw new Error('Failed to parse transaction.');

                const session = getSessionFromStorage(SessionType.Farcaster);
                if (!session) throw new Error('Profile not found');

                const action = WalletActionSchema.parse(walletAction.data);
                const { chainId } = parseCAIP10(action.chainId);
                const client = await getWalletClientRequired(wagmiConfig, {
                    chainId,
                });
                if (client.chain.id !== chainId) throw new Error('The chainId mismatch.');

                const method = action.method;
                switch (method) {
                    case MethodType.ETH_SEND_TRANSACTION: {
                        const params = {
                            to: action.params.to as Hex,
                            data: (action.params.data ||
                                (action.attribution !== false
                                    ? encodePacked(['byte1', 'uint32'], [0xfc, Number.parseInt(session.profileId, 10)])
                                    : undefined)) as Hex | undefined,
                            value: action.params.value ? BigInt(action.params.value) : BigInt(0),
                        };
                        const transactionId = await client.sendTransaction(params);
                        const response = await postAction<LinkDigestedResponse<FrameV1>>({
                            address,
                            transactionId,
                        });
                        await captureFrameActionEvent('others', frame, address);
                        return response.success ? response.data.frame : null;
                    }
                    case MethodType.ETH_SIGN_TYPED_DATA_V4: {
                        const signature = await client.signTypedData(action.params as SignTypedDataParameters);
                        const response = await postAction<LinkDigestedResponse<FrameV1>>({
                            address,
                            transactionId: signature,
                        });
                        await captureFrameActionEvent('others', frame, address);
                        return response.success ? response.data.frame : null;
                    }
                    default:
                        safeUnreachable(method);
                        enqueueErrorMessage(<Trans>Unknown transaction method: {method}.</Trans>);
                        return null;
                }
            default:
                safeUnreachable(button.action);
                return null;
        }
    } catch (error) {
        enqueueMessageFromError(error, <Trans>Something went wrong. Please try again.</Trans>);
        throw error;
    }
}

interface FrameLayoutProps {
    frame: FrameV1;
    post: Post;
    children?: ReactNode;
}

export const FrameLayout = memo<FrameLayoutProps>(function FrameLayout({ children, post, ...props }) {
    const { source, postId } = post;
    const [latestFrame, setLatestFrame] = useState<FrameV1 | null>(null);
    const frame = latestFrame ?? props.frame;

    const [{ loading: isLoadingNextFrame }, handleClick] = useAsyncFn(
        async (button: FrameButton, input?: string) => {
            if (!frame) return;

            if (![ActionType.Link, ActionType.Mint].includes(button.action) && !getSessionFromStorageBySource(source)) {
                openLoginModalWithGuard({
                    source,
                });
                return;
            }

            const nextFrame = await getNextFrame(source, postId, frame, latestFrame, button, input);
            if (nextFrame) setLatestFrame(nextFrame);
        },
        [source, frame, latestFrame, postId],
    );

    if (!frame) return children;

    return <Card frame={frame} source={source} loading={isLoadingNextFrame} onButtonClick={handleClick} />;
});
