'use client';

import type { ProfileSource, SocialSource } from '@dimensiondev/enums';
import {
    type EvmRpcResult,
    IframeBridgeMethod,
    iframeBridgeProvider,
    type IframeBridgeRequestArguments,
    type IframeBridgeResponseResult,
} from '@dimensiondev/iframe-bridge';
import { NotImplementedError, safeUnreachable } from '@dimensiondev/utils';
import { memo, useEffect } from 'react';
import { type Address, isHex, toHex, type WalletClient } from 'viem';
import { getWalletClient } from 'wagmi/actions';

import { loadWagmiClient } from '@/configs/wagmiClientLoader.js';
import { IS_MOBILE_DEVICE } from '@/constants/browser.js';
import { FIREFLY_WALLET_IFRAME_ID } from '@/constants/fireflyWallet.js';
import { FIREFLY_MENTION } from '@/constants/mentions.js';
import { openAndWaitForCloseComposeModal } from '@/controllers/openComposeModal.js';
import { openDownloadMobileAppModal } from '@/controllers/openDownloadMobileAppModal.js';
import { openLoginModalWithGuard } from '@/controllers/openLoginModal.js';
import { useRouter } from '@/esm/navigation.js';
import { confettiWithRealistic } from '@/helpers/confetti.js';
import {
    enqueueErrorMessage,
    enqueueInfoMessage,
    enqueueSuccessMessage,
    enqueueWarningMessage,
} from '@/helpers/enqueueMessage.js';
import { fetchImageAsMediaObject } from '@/helpers/fetchImageAsMediaObject.js';
import { getProfileState } from '@/helpers/getProfileState.js';
import type { PolymarketShareImageParams } from '@/helpers/polymarketShareImage.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useWalletTelemetrySubscriber } from '@/hooks/useWalletTelemetrySubscriber.js';
import { logger } from '@/libs/Logger.js';
import { mergeMetrics } from '@/services/metrics.js';
import { verifyAndGetPassword } from '@/services/verifyAndGetPassword.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
import type { Chars } from '@/types/chars.js';

interface FollowAccountsData {
    accounts: Array<{ source: SocialSource; handle: string; profileId: string }>;
}

// The wagmi config (chains + AppKit adapter + Privy connector) is imported on
// demand inside the wallet RPC handlers so it stays out of the iframe-bridge
// chunk, which mounts on every page.
async function resolveHostEvmConnector(walletAddress?: string) {
    if (!walletAddress) return undefined;

    const { wagmiConfig } = await loadWagmiClient();
    for (const connector of wagmiConfig.connectors) {
        const accounts = await connector.getAccounts().catch(() => []);
        if (accounts.some((account) => account.toLowerCase() === walletAddress.toLowerCase())) {
            return connector;
        }
    }

    return undefined;
}

async function handleHostEvmRpc(args: IframeBridgeRequestArguments[IframeBridgeMethod.FIREFLY_WALLET_EVM_RPC]) {
    const connector = await resolveHostEvmConnector(args.walletAddress);
    if (args.walletAddress && !connector) {
        throw new Error('Selected host EVM wallet is not available for signing');
    }

    const { wagmiConfig } = await loadWagmiClient();
    switch (args.method) {
        case 'wallet_switchEthereumChain': {
            if (
                Array.isArray(args.params) &&
                args.params[0] &&
                'chainId' in args.params[0] &&
                isHex(args.params[0].chainId)
            ) {
                const chainId = Number.parseInt(args.params[0].chainId, 16);
                if (!connector?.switchChain)
                    throw new Error('Selected host EVM wallet does not support chain switching');
                await connector.switchChain({ chainId });
            }
            return null;
        }
        case 'eth_chainId': {
            const chainId = connector ? await connector.getChainId() : wagmiConfig.state.chainId;
            return toHex(chainId);
        }
        default: {
            const walletClient = await getWalletClient(wagmiConfig, {
                account: args.walletAddress as Address | undefined,
                connector,
            });
            const { requestOrigin: _requestOrigin, walletAddress: _walletAddress, ...rpcPayload } = args;
            const params = Array.isArray(rpcPayload.params)
                ? rpcPayload.params
                : rpcPayload.params !== undefined
                  ? [rpcPayload.params]
                  : undefined;
            // Method/params come from the wallet iframe at runtime; viem's request overloads are method-specific.
            return walletClient.request({
                method: rpcPayload.method,
                params,
            } as Parameters<WalletClient['request']>[0]) as Promise<EvmRpcResult>;
        }
    }
}

const FIREFLY_MENTION_IN_TEXT_RE = /@firefly(?![A-Za-z0-9_./-])/gi;

function transformComposeTextToChars(text: string): Chars {
    const matches = Array.from(text.matchAll(FIREFLY_MENTION_IN_TEXT_RE));
    if (!matches.length) return text;

    const result: Array<string | typeof FIREFLY_MENTION> = [];
    let lastIndex = 0;

    for (const match of matches) {
        if (match.index === undefined) continue;
        if (match.index > lastIndex) {
            result.push(text.slice(lastIndex, match.index));
        }
        result.push({
            ...FIREFLY_MENTION,
            content: match[0],
        });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        result.push(text.slice(lastIndex));
    }

    return result;
}

/**
 * Handle ENABLE_SYNC_SESSION request from mystery-box iframe.
 * If passcode is not set, open the password setup modal.
 * If passcode is already set, verify it and merge metrics.
 * Fire-and-forget — the mystery-box backend polls to verify task completion.
 */
async function handleEnableSyncSession() {
    const password = await verifyAndGetPassword({
        requireSetPassword: true,
        skipCheck: true,
        autoUploadMetrics: false,
    });
    if (password) {
        await mergeMetrics(password);
    }
}

/**
 * Handle FOLLOW_ACCOUNTS notification from mystery-box iframe.
 * For each target account, if the user is logged in on that platform, follow the target.
 * Fire-and-forget — the mystery-box backend polls to verify follow status.
 */
async function handleFollowAccounts({ accounts }: FollowAccountsData) {
    if (!Array.isArray(accounts) || !accounts.length) return;

    const results = await Promise.allSettled(
        accounts.map(async (account) => {
            if (!account.source || !account.profileId) return;

            const { currentProfile } = getProfileState(account.source);
            if (!currentProfile?.profileId) return;

            const provider = resolveSocialMediaProvider(account.source);
            await provider.follow(account.profileId);
        }),
    );

    for (const result of results) {
        if (result.status === 'rejected') {
            console.error('[IframeBridge] Failed to follow account:', result.reason);
        }
    }
}

function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error ?? new Error('Failed to read image blob'));
        reader.readAsDataURL(blob);
    });
}

const createAllEvents = (router: ReturnType<typeof useRouter>) => {
    const allEvents: {
        [K in IframeBridgeMethod]: (params: IframeBridgeRequestArguments[K]) => Promise<IframeBridgeResponseResult[K]>;
    } = {
        [IframeBridgeMethod.LOGIN]: async (params: IframeBridgeRequestArguments[IframeBridgeMethod.LOGIN]) => {
            openLoginModalWithGuard(
                {
                    source: params.source as ProfileSource | undefined,
                },
                params.forceOpen,
            );
        },
        [IframeBridgeMethod.COMPOSE]: async (params: IframeBridgeRequestArguments[IframeBridgeMethod.COMPOSE]) => {
            const chars = transformComposeTextToChars(params.text);
            const images = params.imageUrls?.length
                ? await Promise.all(params.imageUrls.slice(0, 4).map((url) => fetchImageAsMediaObject(url)))
                : undefined;
            const result = await openAndWaitForCloseComposeModal({ type: 'compose', chars, images });
            if (result) return result.post?.postId;
            return undefined;
        },
        [IframeBridgeMethod.ENQUEUE_MESSAGE]: async (
            params: IframeBridgeRequestArguments[IframeBridgeMethod.ENQUEUE_MESSAGE],
        ) => {
            switch (params.type) {
                case 'success':
                    enqueueSuccessMessage(params.message, { duration: params.duration });
                    break;
                case 'error':
                    enqueueErrorMessage(params.message, { duration: params.duration });
                    break;
                case 'info':
                    enqueueInfoMessage(params.message, { duration: params.duration });
                    break;
                case 'warning':
                    enqueueWarningMessage(params.message, { duration: params.duration });
                    break;
                default:
                    safeUnreachable(params.type);
                    break;
            }
        },
        [IframeBridgeMethod.DOWNLOAD_APP]: async (
            params: IframeBridgeRequestArguments[IframeBridgeMethod.DOWNLOAD_APP],
        ) => {
            IS_MOBILE_DEVICE
                ? (window.location.href = 'https://5euxu.app.link/PHvNiyVemIb')
                : openDownloadMobileAppModal();
        },
        [IframeBridgeMethod.FIREFLY_WALLET_NAVIGATE]: async (
            params: IframeBridgeRequestArguments[IframeBridgeMethod.FIREFLY_WALLET_NAVIGATE],
        ) => {
            // Open wallet panel and forward navigation to wallet iframe
            // (same pattern as useOpenFireflyWallet hook)
            useGlobalState.getState().updateFireflyWalletIsOpen(true);
            iframeBridgeProvider.request(
                IframeBridgeMethod.NAVIGATE,
                {
                    path: params.path,
                    replace: params.replace,
                },
                { targetIframeId: FIREFLY_WALLET_IFRAME_ID },
            );
        },
        [IframeBridgeMethod.FIREFLY_WALLET_OPEN]: async () => {
            useGlobalState.getState().updateFireflyWalletIsOpen(true);
        },
        [IframeBridgeMethod.FIREFLY_WALLET_CLOSE]: async () => {
            useGlobalState.getState().updateFireflyWalletIsOpen(false);
        },
        [IframeBridgeMethod.FIREFLY_WALLET_EVM_RPC]: async (args) => {
            return handleHostEvmRpc(args);
        },
        [IframeBridgeMethod.FIREFLY_WALLET_SOLANA_RPC]: () => {
            throw new NotImplementedError();
        },
        [IframeBridgeMethod.FIREFLY_WALLET_AUTHORIZED]: async () => {
            useFireflyWalletStore.getState().setIsAuthorized(true);
            // This notification is retried by the iframe, so the bridge response should not wait
            // on connector recovery work that can be slower than the message round trip.
            void import('@/helpers/reconnectPrivyWallet.js')
                .then(({ reconnectPrivyWallet }) => reconnectPrivyWallet())
                .catch((error) => logger.error('[iframe bridge] failed to reconnect the privy wallet:', error));
        },
        [IframeBridgeMethod.NAVIGATE]: async (params: IframeBridgeRequestArguments[IframeBridgeMethod.NAVIGATE]) => {
            if (params.external) {
                window.open(params.path, '_blank', 'noopener');
            } else if (params.replace) {
                router.replace(params.path);
            } else {
                router.push(params.path);
            }
            return Promise.resolve(undefined) as Promise<IframeBridgeResponseResult[IframeBridgeMethod.NAVIGATE]>;
        },
        [IframeBridgeMethod.FIREFLY_WALLET_VISIBILITY]: async () => {
            throw new NotImplementedError();
        },
        [IframeBridgeMethod.FIREFLY_WALLET_SKIP_WALLET_AUTH]: async () => {
            throw new NotImplementedError();
        },
        [IframeBridgeMethod.FIREFLY_WALLET_SIGN_MESSAGE]: async () => {
            throw new NotImplementedError();
        },
        [IframeBridgeMethod.FIREFLY_WALLET_ADD_SESSION_SIGNER]: async () => {
            throw new NotImplementedError();
        },
        [IframeBridgeMethod.FIREFLY_WALLET_NOTIFY]: async (
            params: IframeBridgeRequestArguments[IframeBridgeMethod.FIREFLY_WALLET_NOTIFY],
        ) => {
            // Handle mystery-box FOLLOW_ACCOUNTS request
            if (params.type === 'FOLLOW_ACCOUNTS') {
                await handleFollowAccounts(params.data as FollowAccountsData);
                return;
            }
            // Default: forward to wallet event pub/sub system
            useGlobalState.getState().publishWalletEvent(params.type, params.data);
        },
        [IframeBridgeMethod.FIREFLY_WALLET_REFRESH]: async () => {
            throw new NotImplementedError();
        },
        [IframeBridgeMethod.MASKO_PLAY_ANIMATION]: async () => {
            throw new NotImplementedError();
        },
        [IframeBridgeMethod.MASKO_SHOW_TEXT]: async () => {
            throw new NotImplementedError();
        },
        [IframeBridgeMethod.ENABLE_SYNC_SESSION]: async () => {
            await handleEnableSyncSession();
        },
        [IframeBridgeMethod.FIREFLY_WALLET_CONFETTI]: async () => {
            // Render confetti from the host document so it spans the full viewport;
            // a canvas drawn inside the wallet iframe is clipped to the iframe's box.
            confettiWithRealistic();
        },
        [IframeBridgeMethod.FIREFLY_WALLET_GENERATE_SHARE_IMAGE]: async (params) => {
            // The wallet iframe can't run the satori renderer (fonts + the same-origin image proxy),
            // so generate the share image here on the host and hand back a PNG data URL.
            const bridgeParams = params.params;
            let shareParams = bridgeParams as PolymarketShareImageParams;

            // The wallet can't build the sports matchup itself; when it shares a sports position it
            // passes the event slug and the host resolves the sports card context here. Best-effort:
            // an event-detail fetch failure must degrade to the plain event card, not fail the whole
            // share image (the slug is sent for every position, sports or not).
            if (bridgeParams.type === 'position' && bridgeParams.eventSlug && !bridgeParams.sport) {
                try {
                    const { resolveShareSportInfo } =
                        await import('@/components/Prediction/getPolymarketSharePayload.js');
                    const sport = await resolveShareSportInfo({
                        eventSlug: bridgeParams.eventSlug,
                        outcomeIndex: undefined,
                        outcome: bridgeParams.outcome,
                        title: bridgeParams.title,
                    });
                    if (sport) shareParams = { ...shareParams, sport } as PolymarketShareImageParams;
                } catch {
                    // fall through to the plain event card
                }
            }

            const { createPolymarketShareImage } = await import('@/services/polymarketShareImage/index.js');
            const blob = await createPolymarketShareImage(shareParams);
            return { dataUrl: await blobToDataUrl(blob) };
        },
    };
    return allEvents;
};

export const IframeBridge = memo(function IframeBridge() {
    const router = useRouter();

    useWalletTelemetrySubscriber();

    useEffect(() => {
        const allEvents = createAllEvents(router);
        const cleanup = iframeBridgeProvider.onRequest(
            <T extends IframeBridgeMethod>(
                method: T,
                params: IframeBridgeRequestArguments[T],
            ): Promise<IframeBridgeResponseResult[T]> => {
                return allEvents[method](params);
            },
        );
        return cleanup;
    }, [router]);

    return null;
});
