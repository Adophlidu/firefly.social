import { fetchAccount } from '@lens-protocol/client/actions';
import { first, sumBy } from 'lodash-es';
import type { Address } from 'viem';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { Source } from '@/constants/enum.js';
import { AuthenticationError, NotImplementedError, WalletAddressMismatchError } from '@/constants/error.js';
import { LENS_CHAIN_ID } from '@/constants/index.js';
import { SetQueryDataForVote } from '@/decorators/SetQueryDataForVote.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';
import { getPollDurationSeconds } from '@/helpers/polls.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { sendCustomEip712Transaction } from '@/helpers/sendCustomEip712Transaction.js';
import { waitForEthereumTransaction } from '@/helpers/waitForEthereumTransaction.js';
import { commitPoll } from '@/providers/firefly/poll/commitPoll.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { isLensOwnerOrManager } from '@/providers/lens/isLensOwnerOrManager.js';
import { lensClientHolder } from '@/providers/lens/LensClientHolder.js';
import { vote } from '@/providers/orb/vote.js';
import type { CompositePoll, Poll, PollOption, Provider, VoteResponseData } from '@/providers/types/Poll.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

const fetchAccountOwner = memoizePromise(
    async (address: string) => {
        const account = await ensureLensResult(
            fetchAccount(lensClientHolder.client, { address: safeEvmAddress(address) }),
        );
        return (account?.owner as Address) || null;
    },
    (address) => address.toLowerCase(),
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
        pollId,
        frameUrl,
        options,
        allOptions,
    }: {
        postId: string;
        pollId: string;
        frameUrl: string;
        options: PollOption[];
        allOptions?: PollOption[];
    }): Promise<VoteResponseData> {
        const currentProfile = getCurrentProfileFromStorage(Source.Lens) as Profile;
        if (!currentProfile?.profileId) throw new AuthenticationError('No profile found, please login first.');

        const walletClient = await getWalletClientRequired(wagmiConfig, {
            chainId: LENS_CHAIN_ID,
        });
        const addressType = await isLensOwnerOrManager(walletClient.account.address, currentProfile);
        if (!addressType) {
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

        await Promise.all(
            result.transactions.map(async (transaction) => {
                const hash = await sendCustomEip712Transaction(LENS_CHAIN_ID, {
                    account: walletClient.account,
                    data: transaction.data,
                    gas: BigInt(transaction.gasLimit),
                    maxFeePerGas: BigInt(transaction.maxFeePerGas),
                    maxPriorityFeePerGas: BigInt(transaction.maxPriorityFeePerGas),
                    paymaster: transaction.paymaster,
                    paymasterInput: transaction.paymasterInput,
                    to: transaction.to,
                    value: BigInt(transaction.amount),
                });
                await waitForEthereumTransaction(transaction.chainId, hash);
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
    }

    getPollById(pollId: string): Promise<Poll> {
        throw new NotImplementedError();
    }
}

export const LensPollProvider = new LensPoll();
