import { fetchAccount } from '@lens-protocol/client/actions';
import { first } from 'lodash-es';
import type { Address } from 'viem';
import { sendEip712Transaction } from 'viem/zksync';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { Source } from '@/constants/enum.js';
import { NotImplementedError } from '@/constants/error.js';
import { LENS_CHAIN_ID } from '@/constants/index.js';
import { SetQueryDataForVote } from '@/decorators/SetQueryDataForVote.js';
import { getProfileFromStorage } from '@/helpers/getProfileFromStorage.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';
import { getPollDurationSeconds } from '@/helpers/polls.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { waitForEthereumTransaction } from '@/helpers/waitForEthereumTransaction.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { OrbProvider } from '@/providers/orb/index.js';
import type { CompositePoll, Poll, PollOption, Provider, VoteResponseData } from '@/providers/types/Poll.js';
import { commitPoll } from '@/services/poll.js';

const fetchAccountOwner = memoizePromise(
    async (address: string) => {
        const account = await ensureLensResult(
            fetchAccount(lensSessionHolder.sdk, { address: safeEvmAddress(address) }),
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
    }: {
        postId: string;
        pollId: string;
        frameUrl: string;
        options: PollOption[];
    }): Promise<VoteResponseData> {
        const currentProfile = getProfileFromStorage(Source.Lens);
        if (!currentProfile?.profileId) throw new Error('No profile found, please login first.');

        const accountOwner = currentProfile.ownedBy?.address || (await fetchAccountOwner(currentProfile.profileId));
        if (!accountOwner) throw new Error('No owner found for the current profile.');

        const walletClient = await getWalletClientRequired(wagmiConfig, {
            chainId: LENS_CHAIN_ID,
        });
        if (!isSameEthereumAddress(walletClient.account.address, accountOwner)) {
            throw new Error('Please use the owner wallet of the current profile to execute this action.');
        }

        const result = await OrbProvider.vote(
            postId,
            options.map((x) => +x.id),
        );
        const firstTransaction = first(result.transactions);
        if (!firstTransaction) {
            throw new Error('No transaction found.');
        }

        await Promise.all(
            result.transactions.map(async (transaction) => {
                const hash = await sendEip712Transaction(walletClient, {
                    account: walletClient.account,
                    data: transaction.data,
                    gas: BigInt(transaction.gasLimit),
                    maxFeePerGas: BigInt(transaction.maxFeePerGas),
                    maxPriorityFeePerGas: BigInt(transaction.maxPriorityFeePerGas),
                    nonce: transaction.nonce,
                    paymaster: transaction.paymaster,
                    paymasterInput: transaction.paymasterInput,
                    to: transaction.to,
                    value: BigInt(transaction.amount),
                });
                await waitForEthereumTransaction(transaction.chainId, hash);
            }),
        );
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
