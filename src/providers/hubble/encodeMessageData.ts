import { Message, MessageData } from '@farcaster/core';
import { blake3 } from '@noble/hashes/blake3';
import { bytesToHex, hexToBytes } from 'viem';

import { FarcasterNetwork, HashScheme, SignatureScheme } from '@/constants/farcaster.js';
import { toFarcasterTime } from '@/helpers/toFarcasterTime.js';
import { getPublicKeyInHexFromPrivateKey, signMessageWithPrivateKey } from '@/providers/farcaster/ed25519.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import type { PartialWith } from '@/types/utility.js';

export type WithMessageData = (fid: number) => PartialWith<MessageData, 'type' | 'fid' | 'timestamp' | 'network'>;

export async function encodeMessageData(withMessageData: WithMessageData) {
    const { token, profileId } = farcasterSessionHolder.sessionRequired;

    // token is the private key of signer
    const fid = Number.parseInt(profileId, 10);

    // @ts-expect-error timestamp is not needed
    const messageData: MessageData = {
        fid,
        network: FarcasterNetwork.MAINNET,
        timestamp: toFarcasterTime(Date.now()),
        ...withMessageData(fid),
    };
    const messageDataBytes = MessageData.encode(messageData).finish();
    const messageDataHash = blake3(messageDataBytes, { dkLen: 20 });

    const publicKey = await getPublicKeyInHexFromPrivateKey(token);
    const signature = await signMessageWithPrivateKey(token, messageDataHash);

    if (!publicKey || !signature) {
        throw new Error('Invalid signer key or signature.');
    }

    const signatureInHex = bytesToHex(signature);
    const message = Message.create({
        data: messageData,
        hash: messageDataHash,
        hashScheme: HashScheme.BLAKE3,
        signature: hexToBytes(signatureInHex),
        signatureScheme: SignatureScheme.ED25519,
        signer: hexToBytes(publicKey),
        dataBytes: messageDataBytes,
    });

    return {
        signer: publicKey,
        messageData,
        messageJson: Message.toJSON(message),
        messageBytes: Message.encode(message).finish(),
        messageDataHash: bytesToHex(messageDataHash),
        messageDataSignature: signatureInHex,
    } as const;
}
