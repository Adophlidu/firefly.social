/* cspell:disable */

import type { Hex } from 'viem';

import type { FarcasterNetwork } from '@/constants/farcaster.js';

export type Response<T> =
    | {
          name: string;
          code: number;
          errCode: string;
          presentable: boolean;
          details: string;
          metadata: {
              errcode: string[];
          };
      }
    | T;

export interface SignaturePacket {
    signer: Hex;
    messageHash: Hex;
    messageSignature: Hex;
}

export interface FrameSignaturePacket {
    untrustedData: {
        fid: number;
        url: string;
        messageHash: string;
        timestamp: number;
        network: FarcasterNetwork;
        buttonIndex: number;
        inputText?: string;
        transactionId?: string;
        castId: {
            fid: number;
            hash: string;
        };
        state?: string;
    };
    trustedData: {
        messageBytes: string;
    };
}

export interface CastResponse {
    hash: {
        data: number[];
        type: 'Buffer';
    };
}
