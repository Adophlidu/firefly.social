import { SITE_URL_OFFICIAL } from '@dimensiondev/constants/static';
import { Source } from '@dimensiondev/enums';
import type {
    PolymarketShareBridgeParams,
    PolymarketSharePositionBridgeParams,
    PolymarketShareWinningsBridgeParams,
} from '@dimensiondev/iframe-bridge';
import { isSameEthereumAddress } from '@dimensiondev/web3/utils';
import { BigNumber } from 'bignumber.js';
import { first } from 'lodash-es';

import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import type { PolymarketPosition, WalletProfileInfoListResponse, WalletProfiles } from '@/providers/types/Firefly.js';

/**
 * FW-7810 — wallet-side builders for the Polymarket share image. The image is rendered by the host
 * (firefly.social web) via the iframe bridge, reusing its client-side satori renderer; these builders
 * just assemble the params. The param shapes mirror apps/web/src/helpers/polymarketShareImage.ts (kept
 * in sync through the bridge package's structural types).
 */

export interface PolymarketShareIdentity {
    displayName: string;
    avatarUrl?: string;
}

export interface PolymarketShareImagePayload {
    params: PolymarketShareBridgeParams;
    /** The firefly detail link carried as the compose text — used only if `resolveLink` is absent. */
    link: string;
    /**
     * Lazily resolves the (possibly short) link at share time instead of upfront, so opening the
     * share sheet never kicks off the shortlink network request. Falls back to `link` if absent.
     */
    resolveLink?: () => Promise<string>;
}

function appendSid(url: string, sharerUid?: string) {
    return sharerUid ? `${url}?sid=${encodeURIComponent(sharerUid)}` : url;
}

export function buildPolymarketEventShareUrl(eventSlug: string, sharerUid?: string): string {
    return appendSid(`${SITE_URL_OFFICIAL}/polymarket/event/${encodeURIComponent(eventSlug)}`, sharerUid);
}

export function buildPolymarketProfileShareUrl(proxyAddress: string, sharerUid?: string): string {
    return appendSid(`${SITE_URL_OFFICIAL}/polymarket/profile/${encodeURIComponent(proxyAddress)}`, sharerUid);
}

function shortenAddress(address: string) {
    return address.length > 10 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
}

export function fallbackShareIdentity(address: string): PolymarketShareIdentity {
    return { displayName: shortenAddress(address) };
}

type WalletProfileInfoListData = NonNullable<WalletProfileInfoListResponse['data']>;

/**
 * Picks the social profiles of `proxyAddress` from a `/v2/wallet/profileinfo/list` response. The
 * response keys each wallet's entry by its resolved on-chain address, so we match the proxy address
 * against those keys. Mirrors apps/web's `useProxyWalletInfo`.
 */
function pickWalletProfile(
    data: WalletProfileInfoListData | null | undefined,
    proxyAddress: string,
): WalletProfiles | null {
    const firstEntry = first(data?.walletAddress);
    if (!firstEntry) return null;

    for (const key in firstEntry) {
        if (isSameEthereumAddress(key, proxyAddress)) return firstEntry[key];
    }

    return null;
}

/**
 * Extracts the holder's display identity from their social profiles, following the same source
 * priority as apps/web's `usePredictionProfileData`: Twitter > Lens > Farcaster > Bsky > Wallet.
 */
function extractShareIdentity(profile: WalletProfiles): { displayName?: string; avatarUrl?: string } {
    if (profile.account?.displayName) {
        return { displayName: profile.account.displayName, avatarUrl: profile.account.avatar || '' };
    }

    const twitter = first(profile.twitterProfiles);
    if (twitter) {
        return {
            displayName: twitter.handle,
            avatarUrl: getStampAvatarByProfileId(Source.Twitter, twitter.twitter_id),
        };
    }

    const lens = first(profile.lensProfilesV3);
    if (lens) {
        return {
            displayName: lens.localName || lens.fullHandle,
            avatarUrl: getStampAvatarByProfileId(Source.Lens, lens.id),
        };
    }

    const farcaster = first(profile.farcasterProfiles);
    if (farcaster) {
        return { displayName: farcaster.display_name || farcaster.username, avatarUrl: farcaster.avatar?.url };
    }

    const bsky = first(profile.bskyProfiles);
    if (bsky) {
        return { displayName: bsky.handle, avatarUrl: getStampAvatarByProfileId(Source.Bsky, bsky.did) };
    }

    const wallet = first(profile.walletProfiles);
    if (wallet) {
        return { displayName: wallet.primary_ens || first(wallet.ens), avatarUrl: wallet.avatar };
    }

    return {};
}

/**
 * Resolves the share-image holder identity from the `/v2/wallet/profileinfo/list` response — the same
 * source and priority the web profile page uses (`usePredictionProfileData`). Falls back to the
 * shortened address when no social profile resolves (e.g. while loading or for a brand-new account).
 */
export function resolveShareIdentityFromProfile(
    data: WalletProfileInfoListData | null | undefined,
    proxyAddress: string,
): PolymarketShareIdentity {
    const profile = pickWalletProfile(data, proxyAddress);
    const identity = profile ? extractShareIdentity(profile) : {};
    return {
        displayName: identity.displayName?.trim() || shortenAddress(proxyAddress),
        avatarUrl: identity.avatarUrl?.trim() || undefined,
    };
}

/** Builds the share payload for a wallet position cell (active or closed). */
export function getPositionShareImagePayload(
    position: PolymarketPosition,
    identity: PolymarketShareIdentity,
): PolymarketShareImagePayload | null {
    const eventSlug = position.event_slugs?.[0] || position.marketSlug;
    if (!eventSlug || !position.title || !identity.displayName) return null;

    const link = buildPolymarketEventShareUrl(eventSlug);

    if (position.is_closed) {
        const totalBought = position.total_buy || position.shares;
        const totalTrade = BigNumber(position.avg_price).times(totalBought);
        const pnlRate = totalTrade.gt(0)
            ? Math.max(BigNumber(position.pnl).div(totalTrade).toNumber(), -1) * 100
            : position.pnl_rate * 100;
        const params: PolymarketSharePositionBridgeParams = {
            type: 'position',
            title: position.title,
            outcome: position.vote_status,
            status: position.pnl > 0 ? 'won' : 'lost',
            pnlRate,
            totalCost: totalTrade.toNumber(),
            avgPrice: position.avg_price,
            currentPnl: position.pnl,
            identity,
            imageUrl: position.image || undefined,
            eventSlug,
        };
        return { link, params };
    }

    const params: PolymarketSharePositionBridgeParams = {
        type: 'position',
        title: position.title,
        outcome: position.vote_status,
        status: 'active',
        pnlRate: position.pnl_rate * 100,
        totalCost: BigNumber(position.avg_price).times(position.shares).toNumber(),
        avgPrice: position.avg_price,
        currentPnl: position.pnl,
        identity,
        imageUrl: position.image || undefined,
        eventSlug,
    };
    return { link, params };
}

/**
 * Builds the share payload for the "Claim all the winnings" dialog. A single winning renders the
 * closed-position card; multiple render the TOTAL WON summary card.
 */
export function getWinningsShareImagePayload(
    winningItems: PolymarketPosition[],
    totalWinAmount: number,
    proxyAddress: string,
    identity: PolymarketShareIdentity,
): PolymarketShareImagePayload | null {
    if (!winningItems.length || !identity.displayName) return null;

    if (winningItems.length === 1) {
        return getPositionShareImagePayload({ ...winningItems[0], is_closed: true }, identity);
    }

    const link = buildPolymarketProfileShareUrl(proxyAddress);
    const params: PolymarketShareWinningsBridgeParams = {
        type: 'winnings',
        totalWon: totalWinAmount,
        items: winningItems.map((item) => ({
            title: item.title,
            cost: BigNumber(item.shares ?? 0)
                .times(item.avg_price ?? 0)
                .toNumber(),
            // resolved winning shares pay out $1 each
            won: item.shares ?? 0,
            pnlRate: (item.pnl_rate ?? 0) * 100,
            image: item.image || undefined,
        })),
        identity,
    };
    return { link, params };
}
