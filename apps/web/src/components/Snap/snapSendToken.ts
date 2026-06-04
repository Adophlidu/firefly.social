import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { parseCAIP19 } from '@dimensiondev/web3/utils';
import urlcat from 'urlcat';

import { FIREFLY_WALLET_IFRAME_ID } from '@/components/FireflyWallet.js';
import { logger } from '@/libs/Logger.js';
import { getProfileById } from '@/providers/firefly/farcaster-hub/getProfileById.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
import type { SnapSendTokenAction } from '@/types/snap.js';

/**
 * Opens Firefly Wallet send flow with optional deep link (chain / token / recipient / amount).
 * EVM (eip155) only for now — matches in-app swap/send expectations.
 */
export async function snapOpenSendToken(params: SnapSendTokenAction['params']): Promise<void> {
    let parsed: ReturnType<typeof parseCAIP19>;
    try {
        parsed = parseCAIP19(params.token);
    } catch (error) {
        logger.warn('[snap] send_token: invalid CAIP-19 token', error);
        return;
    }

    if (parsed.chainNamespace !== 'eip155') {
        logger.warn('[snap] send_token: only eip155 (EVM) chains are supported', parsed.chainNamespace);
        return;
    }

    const chainId = Number.parseInt(parsed.chainReference, 10);
    const tokenAddr = parsed.reference.toLowerCase();

    let to = params.recipientAddress;
    if (!to && params.recipientFid !== undefined) {
        try {
            const profile = await getProfileById(String(params.recipientFid));
            to = profile?.ownedBy?.address ?? profile?.address;
        } catch (error) {
            logger.warn('[snap] send_token: failed to resolve recipient FID', error);
        }
    }

    const path = urlcat('/send/tokens', {
        chain: chainId,
        token: tokenAddr,
        ...(to ? { to } : {}),
        ...(params.amount ? { amount: params.amount } : {}),
    });

    useGlobalState.getState().updateFireflyWalletIsOpen(true);
    iframeBridgeProvider.request(IframeBridgeMethod.NAVIGATE, { path }, { targetIframeId: FIREFLY_WALLET_IFRAME_ID });
}
