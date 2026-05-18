import { Source } from '@dimensiondev/enums';
import { AuthenticationError, NotImplementedError, runInSafeAsync } from '@dimensiondev/utils';
import { sendCustomEip712Transaction, waitForEthereumTransaction } from '@dimensiondev/web3/actions';
import { isSameEthereumAddress } from '@dimensiondev/web3/utils';
import { first, sumBy } from 'lodash-es';
import { getAddress } from 'viem';
import { lens } from 'viem/chains';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { WalletAddressMismatchError } from '@/constants/error.js';
import { SetQueryDataForVote } from '@/decorators/SetQueryDataForVote.js';
import { createPrivyWalletClient } from '@/helpers/createPrivyWalletClient.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { memoizePromiseWithTime } from '@/helpers/memoizePromise.js';
import { getPollDurationSeconds } from '@/helpers/polls.js';
import { withSkipWalletAuth } from '@/helpers/withSkipWalletAuth.js';
import { commitPoll } from '@/providers/firefly/poll/commitPoll.js';
import { ensureLensResultSync } from '@/providers/lens/ensureLensResultSync.js';
import { isLensOwnerOrManager } from '@/providers/lens/isLensOwnerOrManager.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';
import { vote } from '@/providers/orb/vote.js';
import type { CompositePoll, Poll, PollOption, Provider, VoteResponseData } from '@/providers/types/Poll.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';

const getWalletTypeToVote = memoizePromiseWithTime(
    async (profile: Profile, address: string, privyAddress: string | null) => {
        const user = ensureLensResultSync(lensSessionClientHolder.sessionClient.getAuthenticatedUser());
        if (user && privyAddress && isSameEthereumAddress(user.signer, privyAddress)) return 'privy';

        const currentIsManager = await isLensOwnerOrManager(address, profile);
        if (currentIsManager) return 'current';

        return;
    },
    (profile: Profile, address: string, privyAddress: string | null) =>
        [profile.profileId, address.toLowerCase(), privyAddress ? privyAddress.toLowerCase() : '-'].join('_'),
    { cacheTime: 60 * 5 }, // 5 minutes
);

@SetQueryDataForVote(Source.Lens)
class LensPoll implements Provider {
    async createPoll(poll: CompositePoll, text = ''): Promise<Poll> {
        return {
            id: poll.pollIds?.Lens || (await commitPoll(poll, text)),
            options: poll.options,
            durationSeconds: getPollDurationSeconds(poll.duration),
            source: Source.Lens,
            type: poll.type,
            strategies: poll.strategies,
            multiple_count: poll.multiple_count,
        };
    }

    async vote({
        postId,
        options,
        allOptions,
    }: {
        postId: string;
        pollId: string;
        frameUrl: string;
        options: PollOption[];
        allOptions?: PollOption[];
    }): Promise<VoteResponseData> {
        return withSkipWalletAuth(async () => {
            const currentProfile = getCurrentProfileFromStorage(Source.Lens) as Profile;
            if (!currentProfile?.profileId) throw new AuthenticationError('No profile found, please login first.');

            const walletClient = await getWalletClientRequired(wagmiConfig, {
                chainId: lens.id,
            });
            const privyEvm = first(useFireflyWalletStore.getState().wallets.ethereum)?.address ?? null;
            const currentAddress = walletClient.account.address;

            const walletType = await runInSafeAsync(() =>
                getWalletTypeToVote(currentProfile, currentAddress, privyEvm),
            );
            if (!walletType) {
                throw new WalletAddressMismatchError();
            }

            const result = await vote(
                postId,
                options.map((x) => +x.id),
            );
            const firstTransaction = first(result.transactions);
            if (!firstTransaction) {
                throw new Error('No transaction found.');
            }

            const isPrivy = walletType === 'privy';
            const accountForTx = isPrivy ? privyEvm : currentAddress;
            // Use silent Privy client whenever the signing address is the Firefly wallet
            const useSilentPrivy = !!privyEvm && !!accountForTx && isSameEthereumAddress(accountForTx, privyEvm);
            await Promise.all(
                result.transactions.map(async (transaction) => {
                    const options = {
                        account: accountForTx ? getAddress(accountForTx) : null,
                        data: transaction.data,
                        gas: BigInt(transaction.gasLimit),
                        gasPerPubdata: BigInt(transaction.gasPerPubdata),
                        maxFeePerGas: BigInt(transaction.maxFeePerGas),
                        maxPriorityFeePerGas: BigInt(transaction.maxPriorityFeePerGas),
                        nonce: transaction.nonce,
                        paymaster: transaction.paymaster,
                        paymasterInput: transaction.paymasterInput,
                        to: transaction.to,
                        value: BigInt(transaction.amount),
                    };

                    const hash = await sendCustomEip712Transaction(wagmiConfig, lens.id, options, {
                        client: useSilentPrivy
                            ? await createPrivyWalletClient({
                                  chainId: lens.id,
                              })
                            : undefined,
                        rpcUrl: transaction.RPC,
                        skipPrepare: true,
                    });
                    await waitForEthereumTransaction(wagmiConfig, transaction.chainId, hash);
                }),
            );

            if (allOptions?.length) {
                const selectedIds = options.map((option) => option.id);
                const voteCount = sumBy(allOptions, (x) => x.votes || 0) + options.length;
                return {
                    is_success: true,
                    choice_detail: allOptions.map((option) => {
                        const isSelected = selectedIds.includes(option.id);
                        const votes = isSelected ? (option.votes || 0) + 1 : option.votes || 0;
                        return {
                            id: +option.id,
                            name: option.label,
                            count: votes,
                            is_select: isSelected,
                            percent: (votes / voteCount) * 100,
                        };
                    }),
                };
            }

            return {
                is_success: true,
                choice_detail: options.map((option) => ({
                    id: +option.id,
                    name: option.label,
                    count: (option.votes || 0) + 1,
                    is_select: true,
                    percent: null,
                })),
            };
        });
    }

    getPollById(pollId: string): Promise<Poll> {
        throw new NotImplementedError();
    }
}

export const LensPollProvider = new LensPoll();
