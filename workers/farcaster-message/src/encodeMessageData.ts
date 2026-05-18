// Import types only - no runtime code
import { FarcasterNetwork } from '@dimensiondev/enums';
import type { PartialWith } from '@dimensiondev/workers-shared/types/utils.js';
import type { MessageData } from '@farcaster/core';
import { blake3 } from '@noble/hashes/blake3';
import { bytesToHex, hexToBytes } from 'viem';

import { getPublicKeyInHexFromPrivateKey, signMessageWithPrivateKey } from '@/farcaster-message/src/ed25519.js';
import { HashScheme, SignatureScheme } from '@/farcaster-message/src/enums.js';
import { processMessageData } from '@/farcaster-message/src/processMessageData.js';
import { toFarcasterTime } from '@/farcaster-message/src/toFarcasterTime.js';

export type MessageDataPatch = PartialWith<MessageData, 'type' | 'fid' | 'timestamp' | 'network'>;

export async function encodeMessageData(profileId: string, token: string, patch: MessageDataPatch) {
    // Lazy-load @farcaster/core to avoid global scope initialization
    const { Message, MessageData } = await import('@farcaster/core');

    // token is the private key of signer
    const fid = Number.parseInt(profileId, 10);

    const messageData = {
        fid,
        network: FarcasterNetwork.MAINNET,
        timestamp: toFarcasterTime(Date.now()),
        ...processMessageData(patch),
    } as MessageData;
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
        messageBytes: bytesToHex(Message.encode(message).finish()),
        messageDataHash: bytesToHex(messageDataHash),
        messageDataSignature: signatureInHex,
    } as const;
}
