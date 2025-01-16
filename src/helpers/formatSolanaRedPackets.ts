import { BN } from '@coral-xyz/anchor';
import { isSameAddress } from '@masknet/web3-shared-base';
import { ChainId } from '@masknet/web3-shared-solana';

import { NetworkType } from '@/constants/enum.js';
import { DEFAULT_THEME_ID } from '@/constants/rp.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getAllSolanaTokens } from '@/providers/solana/getTokenList.js';
import { SolanaRedPacket } from '@/providers/solana/RedPacket.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

type SolanaRedPacket = Awaited<ReturnType<typeof SolanaRedPacket.getRedPacketsByCreator>>[number];
const RpStatus = FireflyRedPacketAPI.RedPacketStatus;

export async function formatSolanaRedPackets(
    packets: SolanaRedPacket[],
    address: string,
): Promise<FireflyRedPacketAPI.RedPacketSentInfo[]> {
    const allTokens = await runInSafeAsync(() => getAllSolanaTokens());

    return packets.map(({ account: redPacket, publicKey }) => {
        const token = allTokens?.find((x) => isSameAddress(x.address, redPacket.tokenAddress.toBase58()));
        const isExpired = redPacket.duration.add(redPacket.createTime).muln(1000).lt(new BN(Date.now()));
        const isEmpty = redPacket.claimedAmount.gte(redPacket.totalAmount) || redPacket.totalAmount.lte(new BN(0));
        const isCreator = isSameAddress(redPacket.creator.toBase58(), address);
        const canRefund = isExpired && !isEmpty && isCreator;
        const isRefunded = isEmpty && redPacket.claimedNumber < redPacket.totalNumber;

        const status = isRefunded
            ? RpStatus.Refund
            : canRefund
              ? RpStatus.Refunding
              : isExpired
                ? RpStatus.Expired
                : isEmpty
                  ? RpStatus.Empty
                  : RpStatus.View;

        return {
            create_time: redPacket.createTime.toNumber(),
            total_numbers: redPacket.totalNumber.toString(),
            total_amounts: redPacket.totalAmount.toString(),
            rp_msg: redPacket.message,
            claim_numbers: redPacket.claimedNumber.toString(),
            claim_amounts: redPacket.claimedAmount.toString(),
            token_symbol: token?.symbol || '-',
            token_decimal: token?.decimals || 0,
            token_logo: token?.logoURI || '',
            redpacket_id: publicKey.toBase58(),
            trans_hash: '0x',
            log_idx: 0,
            chain_id: ChainId.Mainnet,
            redpacket_status: status as FireflyRedPacketAPI.RedPacketStatus,
            claim_strategy: [],
            theme_id: DEFAULT_THEME_ID,
            share_from: redPacket.creator.toBase58(),
            networkType: NetworkType.Solana,
            creator: redPacket.creator.toBase58(),
        } as FireflyRedPacketAPI.RedPacketSentInfo;
    });
}
