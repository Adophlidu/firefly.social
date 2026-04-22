import { runInSafeAsync } from '@dimensiondev/utils';
import { waitForEthereumTransaction } from '@dimensiondev/web3/actions';
import type { Address, Hex } from 'viem';
import { getChainId, switchChain, writeContract } from 'wagmi/actions';

import RED_PACKET_ABI from '@/abis/RedPacket.json' with { type: 'json' };
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { PRIVY_CONNECTOR_ID } from '@/connectors/PrivyConnector.js';
import { resolveRedPacketPlatformType } from '@/helpers/resolveRedPacketPlatformType.js';
import { getCurrentClaimProfile } from '@/providers/ethereum/getCurrentClaimProfile.js';
import { getRedPacketContractAddress } from '@/providers/ethereum/getRedPacketContract.js';
import type { ClaimRedPacketContext } from '@/providers/ethereum/red-packet/types.js';
import { signClaimMessage } from '@/providers/ethereum/signClaimMessage.js';
import { checkGasFreeStatus } from '@/providers/firefly/red-packet/checkGasFreeStatus.js';
import { claimForGasFree } from '@/providers/firefly/red-packet/claimForGasFree.js';
import { EthChainResolver } from '@/web3-providers/evm/ResolverAPI.js';

export async function claimRedPacket(context: ClaimRedPacketContext) {
    const rpid = context.payload.rpid;
    if (!rpid) return;

    const { account, source, contextChainId, payload } = context;
    const payloadChainId = payload.token?.chainId;
    const chainIdByName = EthChainResolver.chainId('network' in payload ? payload.network! : '');
    const chainId = payloadChainId || chainIdByName || contextChainId;

    const globalChainId = getChainId(wagmiConfig);
    if (globalChainId !== chainId) await switchChain(wagmiConfig, { chainId });

    const claimWithSponsorHash = await runInSafeAsync(async () => {
        const [me, sponsorable] = await Promise.all([
            getCurrentClaimProfile(source),
            checkGasFreeStatus(chainId, account),
        ]);
        if (!sponsorable || !me?.profileId) return;
        return claimForGasFree(rpid, account, {
            needLensAndFarcasterHandle: true,
            platform: resolveRedPacketPlatformType(source),
            profileId: me.profileId,
            handle: me.handle,
            lensToken: me.lensToken,
            farcasterMessage: me.farcasterMessage as Hex,
            farcasterSigner: me.farcasterSigner as Hex,
            farcasterSignature: me.farcasterSignature as Hex,
        });
    });
    if (claimWithSponsorHash) return claimWithSponsorHash;
    const signed = await signClaimMessage(context);

    const hash = await writeContract(wagmiConfig, {
        abi: RED_PACKET_ABI,
        functionName: 'claim',
        args: [payload.rpid, signed?.signedMessage, account],
        address: getRedPacketContractAddress(chainId),
        account: account as Address,
        // Claim with Firefly Wallet
        connector: wagmiConfig.connectors.find((x) => x.id === PRIVY_CONNECTOR_ID),
    });

    await waitForEthereumTransaction(wagmiConfig, chainId, hash);
    return hash;
}
