import { bom } from '@dimensiondev/utils';
import { useQuery } from '@tanstack/react-query';
import urlcat from 'urlcat';

import { formatSenderName } from '@/components/RedPacket/helpers.js';
import { DEFAULT_THEME } from '@/constants/rp.js';
import { minus, toFixed } from '@/helpers/number.js';
import { FireflyRedPacketEndpoint } from '@/providers/firefly/RedPacketEndpoint.js';
import type { FireflyRedPacketAPI, RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
/** pass rpid or themeId */
export interface RedPacketCoverOptions {
    rpid?: RedPacketJSONPayload['rpid'];
    themeId?: string;
    token: RedPacketJSONPayload['token'];
    shares: RedPacketJSONPayload['shares'];
    total: RedPacketJSONPayload['total'];
    /** sender.name */
    sender: string;
    message: string;
    claimedAmount?: string;
    claimed?: string;
    usage?: 'cover' | 'payload';
    type?: string;
}

export function useRedPacketCover({
    rpid,
    themeId,
    token,
    shares,
    total,
    sender,
    message,
    claimed = '0',
    claimedAmount = '0',
    usage = 'cover',
    type = 'fungible',
}: RedPacketCoverOptions) {
    return useQuery({
        enabled: !!rpid || !!themeId,
        queryKey: ['red-packet', 'theme', rpid, themeId],
        queryFn: async () => {
            if (!rpid && !themeId) return null;
            const theme = await FireflyRedPacketEndpoint.getTheme({
                rpid,
                themeId,
            } as FireflyRedPacketAPI.ThemeByIdOptions);
            return theme ?? (DEFAULT_THEME as FireflyRedPacketAPI.ThemeGroupSettings);
        },
        select(theme) {
            if (!theme) return null;
            const SITE_URL = bom.location?.origin ?? '';
            const remainingAmount = toFixed(minus(total, claimedAmount ?? '0'));
            return {
                theme,
                themeId: theme.tid,
                backgroundImageUrl: theme.normal.bg_image,
                backgroundColor: theme.normal.bg_color,
                url: urlcat(SITE_URL, '/api/rp', {
                    'theme-id': theme.tid,
                    usage,
                    type,
                    symbol: token?.symbol ?? '--',
                    decimals: token?.decimals ?? 1,
                    shares,
                    amount: toFixed(total),
                    from: formatSenderName(sender),
                    message,
                    'remaining-amount': remainingAmount,
                    'remaining-shares': toFixed(minus(shares, claimed || 0)),
                }),
            };
        },
    });
}
