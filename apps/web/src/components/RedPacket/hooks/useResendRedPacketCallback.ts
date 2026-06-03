import type { NetworkType } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import { toFixed } from '@dimensiondev/web3/numbers';
import { t } from '@lingui/core/macro';
import { useAsyncFn } from 'react-use';
import urlcat from 'urlcat';

import { formatSenderName } from '@/components/RedPacket/helpers.js';
import { DEFAULT_THEME_ID } from '@/constants/rp.js';
import { closeRedPacketModal } from '@/controllers/openRedPacketModal.js';
import { getMaskTypedMessage } from '@/providers/firefly/red-packet/getMaskTypedMessage.js';
import type { ClaimStrategy } from '@/providers/types/FireflyRedPacket.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

export interface ResendRedPacketInfo {
    rpid: string;
    message: string;
    shareFrom: string;
    themeId: string;
    tokenSymbol: string;
    tokenDecimal: number;
    totalAmounts: string;
    totalNumbers: string;
    claimStrategy: ClaimStrategy[];
    chainId: number;
    networkType: NetworkType;
}

export function useResendRedPacketCallback(info: ResendRedPacketInfo) {
    const { updateRpPayload } = useComposeStateStore();

    return useAsyncFn(async () => {
        const {
            rpid,
            message,
            shareFrom,
            themeId,
            tokenSymbol,
            tokenDecimal,
            totalAmounts,
            totalNumbers,
            claimStrategy,
            chainId,
        } = info;

        const payloadImageUrl = urlcat(SITE_URL, '/api/rp', {
            'theme-id': themeId || DEFAULT_THEME_ID,
            usage: 'payload',
            from: formatSenderName(shareFrom),
            amount: toFixed(totalAmounts),
            type: 'fungible',
            symbol: tokenSymbol,
            decimals: tokenDecimal,
            message: message || t`Hope this sparks a smile.`,
        });

        updateRpPayload({
            payloadImage: payloadImageUrl,
            claimRequirements: claimStrategy,
            metadata: {
                // just for update claim strategy
                rpid,
                contract_address: '',
                contract_version: 0,
                creation_time: 0,
                duration: 0,
                is_random: false,
                network: '',
                password: '',
                sender: { address: '', name: shareFrom, message },
                shares: Number(totalNumbers),
                token: {
                    decimals: tokenDecimal,
                    symbol: tokenSymbol,
                    address: '',
                    chainId,
                },
                total: totalAmounts,
            },
        });

        const { coverImageUrl } = await getMaskTypedMessage(rpid);

        closeRedPacketModal(coverImageUrl);
    }, [info, updateRpPayload]);
}
