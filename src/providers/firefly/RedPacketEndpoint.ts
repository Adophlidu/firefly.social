import urlcat from 'urlcat';
import type { Hex } from 'viem';

import { EMPTY_LIST, FIREFLY_DEV_ROOT_URL } from '@/constants/index.js';
import { RedPacketMetaKey } from '@/constants/rp.js';
import { bom } from '@/helpers/bom.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { toFixed } from '@/helpers/number.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';
import type { RedPacketMetadata } from '@/types/rp.js';
import type { EthereumChainId } from '@/web3-shared/evm/types.js';

const SITE_URL = bom.location?.origin ?? '';

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class FireflyRedPacketEndpoint {
    static async createCover(metadata: RedPacketMetadata) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/misc/maskTypedMessage/create');
        const { data } = await fireflySessionHolder.fetch<FireflyRedPacketAPI.CreateCoverResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                meta: JSON.stringify({
                    [RedPacketMetaKey]: metadata,
                }),
                type: 'text',
                content: '',
            }),
        });
        return data;
    }
    static async parse(options: FireflyRedPacketAPI.ParseOptions) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/misc/redpacket/parse');
        const { data } = await fireflySessionHolder.fetch<FireflyRedPacketAPI.ParseResponse>(url, {
            method: 'POST',
            body: JSON.stringify(options),
        });
        return data;
    }

    static async getThemes() {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/redpacket/themeList');
        const { data } = await fetchJson<FireflyRedPacketAPI.ThemeListResponse>(url);
        return data.list;
    }

    static async getPayloadUrls(
        from: string,
        amount?: string,
        type?: string,
        symbol?: string,
        decimals?: number,
        message?: string,
    ) {
        const themes = await FireflyRedPacketEndpoint.getThemes();

        return themes.map((theme) => ({
            themeId: theme.tid,
            backgroundImageUrl: theme.cover.bg_image,
            backgroundColor: theme.cover.bg_color,
            url: urlcat(SITE_URL, '/api/rp', {
                'theme-id': theme.tid,
                usage: 'payload',
                from,
                amount: toFixed(amount),
                type,
                symbol,
                decimals,
                message,
            }),
        }));
    }

    static async getPayloadUrlByThemeId(
        themeId: string,
        from: string,
        amount?: string,
        type?: string,
        symbol?: string,
        decimals?: number,
    ) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, 'v1/redpacket/themeById', {
            themeId,
        });
        const { data } = await fetchJson<FireflyRedPacketAPI.ThemeByIdResponse>(url);

        return {
            themeId,
            url: urlcat(SITE_URL, '/api/rp', {
                'theme-id': themeId,
                usage: 'payload',
                from,
                amount,
                type,
                symbol,
                decimals,
            }),
            backgroundImageUrl: data.cover.bg_image,
            backgroundColor: data.cover.bg_color,
        };
    }

    static async getTheme(options: FireflyRedPacketAPI.ThemeByIdOptions) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, 'v1/redpacket/themeById', options);
        const { data } = await fetchJson<FireflyRedPacketAPI.ThemeByIdResponse>(url);
        return data;
    }

    static async createTheme(options: FireflyRedPacketAPI.CreateThemeOptions) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/redpacket/createTheme');
        const res = await fetchJson<FireflyRedPacketAPI.CreateThemeResponse>(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(options),
        });
        return res.data.tid;
    }

    static async getCoverUrlByRpid(
        rpid: string,
        symbol?: string,
        decimals?: number,
        shares?: number,
        amount?: string,
        from?: string,
        message?: string,
        remainingAmount?: string,
        remainingShares?: string,
    ) {
        const theme = await FireflyRedPacketEndpoint.getTheme({ rpid });

        return {
            themeId: theme.tid,
            backgroundImageUrl: theme.normal.bg_image,
            backgroundColor: theme.normal.bg_color,
            url: urlcat(SITE_URL, '/api/rp', {
                'theme-id': theme.tid,
                usage: 'cover',
                symbol,
                decimals,
                shares,
                amount: toFixed(amount),
                from,
                message,
                'remaining-amount': toFixed(remainingAmount),
                'remaining-shares': toFixed(remainingShares),
            }),
        };
    }

    static async createPublicKey(
        themeId: string,
        shareFrom: string,
        strategies: FireflyRedPacketAPI.ClaimStrategy[],
    ): Promise<Hex> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/redpacket/createPublicKey');
        const { data } = await fetchJson<FireflyRedPacketAPI.PublicKeyResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                themeId,
                shareFrom,
                claimFrom: FireflyRedPacketAPI.SourceType.FireflyPC,
                claimStrategy: JSON.stringify(strategies),
            }),
        });
        return data.publicKey;
    }

    static async updateClaimStrategy(
        rpid: string,
        reactions: FireflyRedPacketAPI.PostReaction[],
        claimPlatform: FireflyRedPacketAPI.ClaimPlatform[],
        postOn: FireflyRedPacketAPI.PostOn[],
        publicKey: string,
    ): Promise<void> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/redpacket/updateClaimStrategy');
        await fetchJson(url, {
            method: 'POST',
            body: JSON.stringify({
                publicKey,
                rpid,
                postReaction: reactions,
                postOn,
                claimPlatform,
            }),
        });
    }

    static async createClaimSignature(options: FireflyRedPacketAPI.CheckClaimStrategyStatusOptions): Promise<Hex> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/redpacket/claim');
        const { data } = await fetchJson<FireflyRedPacketAPI.ClaimResponse>(url, {
            method: 'POST',
            body: JSON.stringify(options),
        });
        return data.signedMessage;
    }

    static async getHistory<
        T extends FireflyRedPacketAPI.ActionType,
        R = T extends FireflyRedPacketAPI.ActionType.Claim
            ? FireflyRedPacketAPI.RedPacketClaimedInfo
            : FireflyRedPacketAPI.RedPacketSentInfo,
    >(
        actionType: T,
        from: Hex,
        platform: FireflyRedPacketAPI.SourceType,
        indicator?: PageIndicator,
    ): Promise<Pageable<R, PageIndicator>> {
        if (!from) {
            return createPageable(EMPTY_LIST, createIndicator(indicator));
        }
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/redpacket/history', {
            address: from,
            redpacketType: actionType,
            claimFrom: platform,
            cursor: indicator?.id,
            size: 20,
        });
        const { data } = await fetchJson<FireflyRedPacketAPI.HistoryResponse>(url, {
            method: 'GET',
        });
        return createPageable(
            data.list.map((v) => ({ ...v, chain_id: Number(v.chain_id) })) as R[],
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, data.cursor.toString()) : undefined,
        );
    }

    static async getClaimHistory(
        redpacket_id: string,
        indicator?: PageIndicator,
    ): Promise<FireflyRedPacketAPI.RedPacketClaimListInfo> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/redpacket/claimHistory', {
            redpacketId: redpacket_id,
            cursor: indicator?.id,
            size: 20,
        });
        const { data } = await fetchJson<FireflyRedPacketAPI.ClaimHistoryResponse>(url, {
            method: 'GET',
        });
        return { ...data, chain_id: Number(data.chain_id) };
    }

    static async checkClaimStrategyStatus(options: FireflyRedPacketAPI.CheckClaimStrategyStatusOptions) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/redpacket/checkClaimStrategyStatus');
        return fetchJson<FireflyRedPacketAPI.CheckClaimStrategyStatusResponse>(url, {
            method: 'POST',
            body: JSON.stringify(options),
        });
    }
    static async finishClaiming(
        rpid: string,
        platform: FireflyRedPacketAPI.PlatformType,
        profileId: string,
        handle: string,
        txHash: string,
    ) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/redpacket/finishClaiming');
        const session = getSessionFromStorage(SessionType.Firefly);
        const accountId = session?.profileId
            ? `${settings.FIREFLY_ROOT_URL === FIREFLY_DEV_ROOT_URL ? 'dev' : 'prod'}:${session.profileId}`
            : undefined;
        return fireflySessionHolder.fetch<FireflyRedPacketAPI.Response<string>>(url, {
            method: 'POST',
            body: JSON.stringify({
                rpid,
                claimPlatform: platform,
                claimProfileId: profileId,
                claimHandle: handle,
                txHash,
                accountId,
            }),
        });
    }

    static async checkGasFreeStatus(chainId: EthereumChainId, wallet: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/redpacket/checkGasFreeRedPacketClaimStatus', {
            wallet,
            chainId,
        });
        const { data } = await fetchJson<
            FireflyRedPacketAPI.Response<{
                substituteGasStatus: boolean;
            }>
        >(url);
        return data.substituteGasStatus;
    }

    static async claimForGasFree(
        rpid: string,
        address: string,
        profile: (
            | {
                  platform: FireflyRedPacketAPI.PlatformType.Farcaster;
                  profileId: string;
                  farcasterSignature: string;
                  farcasterSigner: string;
                  farcasterMessage: string;
              }
            | {
                  platform: FireflyRedPacketAPI.PlatformType.Lens;
                  profileId: string;
                  lensToken?: string;
              }
            | {
                  platform: FireflyRedPacketAPI.PlatformType.Twitter;
                  profileId: string;
              }
            | {
                  platform: FireflyRedPacketAPI.PlatformType.Bsky;
                  profileId: string;
              }
        ) & {
            needLensAndFarcasterHandle: boolean;
            handle?: string;
        },
    ) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/redpacket/gasFreeClaimRedPacket');
        const { data } = await fireflySessionHolder.fetchWithSession<
            FireflyRedPacketAPI.Response<{
                hash: string;
            }>
        >(url, {
            method: 'POST',
            body: JSON.stringify({
                rpid,
                wallet: {
                    address,
                },
                profile,
            }),
        });
        return data.hash;
    }
}
