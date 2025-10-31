import { nativeBridgeProvider, SupportedMethod } from '@firefly/native-bridge';
import { safeUnreachable } from '@firefly/utils';
import { IS_IOS } from '@lexical/utils';
import urlcat from 'urlcat';

import { type SocialSource, Source, STATUS, WalletSource } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { NotImplementedError } from '@/constants/error.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { formatFireflyConnections } from '@/helpers/formatFireflyConnections.js';
import { formatWalletConnections } from '@/helpers/formatWalletConnection.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type {
    CheckBuyResponse,
    CheckOrderResponse,
    CheckPriceResponse,
    CheckResponse,
    ClaimTaskResponse,
    CommitOrderResponse,
    MintActivitySBTResponse,
    Provider,
    SearchQrcodeResponse,
    TaskResponse,
} from '@/providers/types/Activity.js';
import type {
    ActivityInfoResponse,
    ActivityListItem,
    ActivityListResponse,
    FriendshipResponse,
    GetAllConnectionsResponse,
    VotingResultResponse,
} from '@/providers/types/Firefly.js';
import type { Friendship } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

class FireflyActivity implements Provider {
    async fetch<T>(url: string, init?: RequestInit) {
        const authToken = nativeBridgeProvider.supported
            ? await runInSafeAsync(() => nativeBridgeProvider.request(SupportedMethod.GET_AUTHORIZATION, {}))
            : undefined;
        return authToken
            ? await fireflySessionHolder.fetchWithSession<T>(url, init)
            : await fireflySessionHolder.fetch<T>(url, init);
    }

    async getActivityClaimCondition(
        name: string,
        address = '0x',
        options?: {
            premiumAddress?: string;
        },
    ) {
        const params: Partial<{
            solAddress: string;
            evmAddress: string;
            address: string;
        }> & {
            name: string;
        } = {
            name,
            ...options,
        };
        if (['trump', 'pengu'].includes(name)) {
            params.solAddress = address || '0x';
            params.evmAddress = options?.premiumAddress || '0x';
        } else if (['buttrfly', 'socialfrens'].includes(name)) {
            params.evmAddress = address || '0x';
        } else {
            params.address = address || '0x';
        }
        const url = urlcat(settings.FIREFLY_ROOT_URL, `/v1/activity/check/:name`, params);
        const response = await fireflySessionHolder.fetchWithSession<CheckResponse>(url);
        return resolveFireflyResponseData(response);
    }

    async getFireflyActivityInfo(name: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/activity/info', {
            name,
        });
        const response = await fetchJson<ActivityInfoResponse>(url);
        return resolveFireflyResponseData(response);
    }

    async getFireflyActivityList({ indicator, size }: { indicator?: PageIndicator; size?: number } = {}) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/activity/list', {
            cursor: indicator?.id,
            size,
        });
        const response = await fetchJson<ActivityListResponse>(url);
        const data = resolveFireflyResponseData(response);
        if (!data.list) {
            return createPageable(EMPTY_LIST, createIndicator(indicator));
        }
        return createPageable(
            data.list,
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
        );
    }

    async claimActivitySBT(address: string, activityName: string, claimApiExtraParams?: Record<string, unknown>) {
        let claimPlatform: 'web' | 'ios' | 'android' = 'web';
        if (nativeBridgeProvider.supported) claimPlatform = IS_IOS ? 'ios' : 'android';
        const response = await fireflySessionHolder.fetchWithSession<MintActivitySBTResponse>(
            urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet_transaction/mint/activity/sbt'),
            {
                method: 'POST',
                body: JSON.stringify({
                    walletAddress: address,
                    claimPlatform,
                    activityName,
                    ...claimApiExtraParams,
                }),
            },
        );
        const data = resolveFireflyResponseData(response);
        if (data.errormessage) {
            throw new Error(data.errormessage);
        }
        return data;
    }

    async getActivityInfo(name: string): Promise<ActivityInfoResponse['data']> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/activity/info', {
            name,
        });
        const response = await fetchJson<ActivityInfoResponse>(url);
        return resolveFireflyResponseData(response);
    }

    async getActivityList(
        indicator?: PageIndicator,
        size?: number,
    ): Promise<Pageable<ActivityListItem, PageIndicator>> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/activity/list', {
            cursor: indicator?.id,
            size,
        });
        const response = await fetchJson<ActivityListResponse>(url);
        const data = resolveFireflyResponseData(response);
        if (!data.list) {
            return createPageable(EMPTY_LIST, createIndicator(indicator));
        }
        return createPageable<ActivityListItem>(
            data.list,
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
        );
    }

    async getAllConnections() {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/accountConnection');
        const response = await fireflySessionHolder.fetchWithSession<GetAllConnectionsResponse>(url, {
            method: 'GET',
        });
        const connections = formatFireflyConnections(response);
        if (env.external.NEXT_PUBLIC_ACTIVITY_PARTICLE === STATUS.Disabled) {
            connections.wallet.connected = connections.wallet.connected.filter(
                (x) => x.source !== WalletSource.Particle,
            );
        }
        return {
            connected: formatWalletConnections(connections.wallet.connected, connections),
            related: formatWalletConnections(connections.wallet.unconnected, connections),
            rawConnections: connections,
        };
    }

    async getVotingResults() {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet_transaction/elex24/activity/ratio');

        const response = await fetchJson<VotingResultResponse>(url);
        return resolveFireflyResponseData(response);
    }

    async follow(
        source: SocialSource,
        profileId: string,
        options?: {
            sourceFarcasterProfileId?: number;
        },
    ) {
        if (nativeBridgeProvider.supported) {
            switch (source) {
                case Source.Farcaster:
                    await fireflySessionHolder.fetchWithSession(
                        urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/follow'),
                        {
                            method: 'POST',
                            body: JSON.stringify({
                                targetFid: Number.parseInt(profileId, 10),
                                sourceFid: options?.sourceFarcasterProfileId,
                            }),
                        },
                    );
                    return;
                case Source.Lens:
                    throw new NotImplementedError();
                case Source.Twitter:
                    await nativeBridgeProvider.request(SupportedMethod.FOLLOW_TWITTER_USER, {
                        id: profileId,
                    });
                    return;
                case Source.Bsky:
                    throw new NotImplementedError();
                default:
                    safeUnreachable(source);
                    return;
            }
        }
        await resolveSocialMediaProvider(source).follow(profileId);
    }

    async isFollowed(
        source: SocialSource,
        profileId: string,
        options?: {
            sourceFarcasterProfileId?: number;
        },
    ) {
        switch (source) {
            case Source.Lens: {
                const profile = await resolveSocialMediaProvider(source).getProfileByIdOrHandle(profileId);
                return profile?.viewerContext?.following ?? false;
            }
            case Source.Farcaster: {
                return farcasterSessionHolder.withSession(async (session) => {
                    const response = await fireflySessionHolder.fetchWithSession<FriendshipResponse>(
                        urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/user/friendship', {
                            sourceFid: options?.sourceFarcasterProfileId ?? session?.profileId,
                            destFid: profileId,
                        }),
                        {
                            method: 'GET',
                        },
                    );
                    return resolveFireflyResponseData<Friendship>(response)?.isFollowing;
                });
            }
            case Source.Twitter: {
                if (nativeBridgeProvider.supported) {
                    return (
                        (await nativeBridgeProvider.request(SupportedMethod.IS_TWITTER_USER_FOLLOWING, {
                            id: profileId,
                        })) === 'true'
                    );
                }
                const profile = await resolveSocialMediaProvider(source).getProfileByIdOrHandle(profileId);
                return profile?.viewerContext?.following ?? false;
            }
            case Source.Bsky: {
                return false;
            }
        }
    }

    async getTasks(name: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, urlcat(`/v1/:name/tasks`, { name }), {
            activity_name: name,
        });

        const response = await this.fetch<TaskResponse>(url);
        return resolveFireflyResponseData(response);
    }

    async claimTask(name: string, task_id: number) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, urlcat(`/v1/:name/tasks/claim`, { name }));
        const response = await fireflySessionHolder.fetchWithSession<ClaimTaskResponse>(url, {
            method: 'POST',
            body: JSON.stringify({ task_id, activity_name: name }),
        });
        return resolveFireflyResponseData(response);
    }

    async checkPrice(name: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, urlcat(`/v1/:name/coupon/checkPrice`, { name }));
        const response = await fireflySessionHolder.fetchWithSession<CheckPriceResponse>(url, {
            method: 'POST',
        });
        return resolveFireflyResponseData(response);
    }

    async orderCommit(
        name: string,
        body: {
            productId: string;
        },
    ) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, urlcat(`/v1/:name/coupon/orderCommit`, { name }));
        const response = await fireflySessionHolder.fetchWithSession<CommitOrderResponse>(url, {
            method: 'POST',
            body: JSON.stringify(body),
        });
        return resolveFireflyResponseData(response);
    }

    async checkOrder(name: string, orderNo: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, urlcat(`/v1/:name/coupon/ordercheck`, { name }));
        const response = await fireflySessionHolder.fetchWithSession<CheckOrderResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                orderNo,
            }),
        });
        return resolveFireflyResponseData(response);
    }

    async checkBuy(name: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, urlcat(`/v1/:name/coupon/checkBuy`, { name }));
        const response = await fireflySessionHolder.fetchWithSession<CheckBuyResponse>(url, {
            method: 'POST',
        });
        return resolveFireflyResponseData(response);
    }

    async searchQrcode(name: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, urlcat(`/v1/:name/searchQrcode`, { name }));
        const response = await fireflySessionHolder.fetchWithSession<SearchQrcodeResponse>(url, {
            method: 'POST',
        });
        return resolveFireflyResponseData(response);
    }

    async reportOrderPaid(name: string, orderNo: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, urlcat(`/v1/:name/coupon/orderPayReport`, { name }));
        await fireflySessionHolder.fetchWithSession(url, {
            method: 'POST',
            body: JSON.stringify({
                orderNo,
            }),
        });
    }
}

export const FireflyActivityProvider = new FireflyActivity();
