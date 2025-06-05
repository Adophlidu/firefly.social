import { t } from '@lingui/core/macro';
import { useAsyncFn } from 'react-use';
import type { Address, Hex } from 'viem';
import { sendTransaction, waitForTransactionReceipt } from 'wagmi/actions';

import { config } from '@/configs/wagmiClient.js';
import { MintStatus } from '@/constants/enum.js';
import { enqueueMessageFromError, enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { captureMintNFTEvent } from '@/providers/telemetry/captureMintEvent.js';
import type { SponsorMintOptions } from '@/providers/types/Firefly.js';

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
            const latestParams = await FireflyEndpointProvider.getSponsorMintStatus(options);
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
            if (latestParams.gasStatus) {
                try {
                    await FireflyEndpointProvider.mintNFTBySponsor(options);
                    captureMintNFTEvent(
                        options.walletAddress,
                        mintTarget.chainId.toString(),
                        mintTarget.contractAddress,
                        true,
                    );
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
                const hash = await sendTransaction(config, {
                    data: latestParams.txData.inputData as Hex,
                    to: latestParams.txData.to as Address,
                    value: BigInt(latestParams.txData.value),
                });
                await waitForTransactionReceipt(config, { hash });
                captureMintNFTEvent(
                    options.walletAddress,
                    mintTarget.chainId.toString(),
                    mintTarget.contractAddress,
                    true,
                );
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
