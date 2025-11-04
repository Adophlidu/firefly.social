import { t } from '@lingui/core/macro';
import { useAsyncFn } from 'react-use';
import type { Address, Hex } from 'viem';
import { sendTransaction, waitForTransactionReceipt } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { MintStatus } from '@/constants/enum.js';
import { enqueueMessageFromError, enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { fireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { captureMintNFTEvent } from '@/providers/telemetry/captureMintEvent.js';
import type { SponsorMintOptions } from '@/providers/types/Firefly.js';
import { EventId } from '@/providers/types/Telemetry.js';

export function useSponsorMintNFT(mintTarget: SponsorMintOptions, mintCount: number, onSuccess?: () => void) {
    return useAsyncFn(async () => {
        try {
            const options = {
                walletAddress: mintTarget.walletAddress,
                contractAddress: mintTarget.contractAddress,
                tokenId: mintTarget.tokenId,
                chainId: mintTarget.chainId,
                buyCount: mintCount,
            };
            const latestParams = await fireflyEndpointProvider.getSponsorMintStatus(options);
            const mintStatus = latestParams.mintStatus;
            if (mintStatus === MintStatus.NotSupported) {
                enqueueWarningMessage(t`So sorry, we are not able to mint this NFT at the moment.`);
                return;
            }
            if (![MintStatus.Mintable, MintStatus.MintAgain].includes(mintStatus)) {
                enqueueWarningMessage(t`So sorry, we cant mint this NFT. Please try again later.`);
                return;
            }

            let hasBalance = true;
            const eventOptions = [
                options.walletAddress,
                mintTarget.chainId.toString(),
                mintTarget.contractAddress,
                true,
            ] as const;
            if (latestParams.gasStatus) {
                try {
                    captureMintNFTEvent(EventId.MINT_NFT_SUBMIT, ...eventOptions);
                    await fireflyEndpointProvider.mintNFTBySponsor(options);
                    captureMintNFTEvent(EventId.MINT_NFT_SUCCESS, ...eventOptions);
                } catch (error) {
                    if (error instanceof Error && error.message.includes('insufficient funds')) {
                        hasBalance = false;
                        enqueueWarningMessage(t`Sorry, today's free mint quota has been reached.`);
                    } else {
                        throw error;
                    }
                }
            }
            if (!latestParams.gasStatus || !hasBalance) {
                captureMintNFTEvent(EventId.MINT_NFT_SUBMIT, ...eventOptions);
                const hash = await sendTransaction(wagmiConfig, {
                    data: latestParams.txData.inputData as Hex,
                    to: latestParams.txData.to as Address,
                    value: BigInt(latestParams.txData.value),
                });
                await waitForTransactionReceipt(wagmiConfig, { hash });
                captureMintNFTEvent(EventId.MINT_NFT_SUCCESS, ...eventOptions);
            }

            enqueueSuccessMessage(t`NFT minted successfully!`);
            onSuccess?.();
        } catch (error) {
            enqueueMessageFromError(error, t`Failed to mint NFT.`);
            throw error;
        }
    }, [
        mintTarget.walletAddress,
        mintTarget.contractAddress,
        mintTarget.tokenId,
        mintTarget.chainId,
        mintCount,
        onSuccess,
    ]);
}
