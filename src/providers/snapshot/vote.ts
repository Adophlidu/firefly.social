import { omit } from 'lodash-es';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { SNAPSHOT_RELAY_URL, SNAPSHOT_SEQ_URL } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { SNAPSHOT_NAME, SNAPSHOT_VERSION } from '@/providers/snapshot/constants.js';
import type { SnapshotChoice } from '@/providers/snapshot/type.js';
import {
    vote2Types,
    voteArray2Types,
    voteArrayTypes,
    voteString2Types,
    voteStringTypes,
    voteTypes,
} from '@/providers/snapshot/type.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

export async function vote(payload: {
    from: string;
    space: string;
    proposal: string;
    type: string;
    choice: SnapshotChoice;
    privacy?: string;
    reason?: string;
    app?: string;
    metadata?: string;
}) {
    const isShutter = payload.privacy === 'shutter';

    const isType2 = payload.proposal.startsWith('0x');

    let types = isType2 ? vote2Types : voteTypes;
    if (['approval', 'ranked-choice'].includes(payload.type)) types = isType2 ? voteArray2Types : voteArrayTypes;
    if (!isShutter && ['quadratic', 'weighted'].includes(payload.type)) {
        types = isType2 ? voteString2Types : voteStringTypes;
        payload.choice = JSON.stringify(payload.choice);
    }

    if (isShutter) types = isType2 ? voteString2Types : voteStringTypes;

    const message = omit(payload, 'privacy', 'type');

    const messageData = {
        timestamp: Number.parseInt((Date.now() / 1e3).toFixed(), 10),
        ...message,
        choice:
            isShutter && ['quadratic', 'weighted'].includes(payload.type)
                ? JSON.stringify(payload.choice)
                : payload.choice,
        reason: message.reason ?? '',
        app: message.app ?? '',
        metadata: message.metadata ?? '{}',
    };
    const client = await getWalletClientRequired(wagmiConfig, { chainId: EthereumChainId.Mainnet });
    const signedTypedData = await client.signTypedData({
        domain: {
            name: SNAPSHOT_NAME,
            version: SNAPSHOT_VERSION,
        },
        types,
        primaryType: 'Vote',
        message: messageData,
    });

    const response = await fetchJson<{ id?: string; ipfs?: string; error_description?: string }>(
        signedTypedData === '0x' ? SNAPSHOT_RELAY_URL : SNAPSHOT_SEQ_URL,
        {
            method: 'POST',
            headers: {
                Accept: 'application/json',
            },
            body: JSON.stringify({
                address: payload.from,
                sig: signedTypedData,
                data: {
                    domain: {
                        name: SNAPSHOT_NAME,
                        version: SNAPSHOT_VERSION,
                    },
                    message: messageData,
                    types,
                },
            }),
        },
    );
    if (!response.ipfs) throw new Error(`Failed to vote. ${response.error_description}`);

    return response.ipfs;
}
