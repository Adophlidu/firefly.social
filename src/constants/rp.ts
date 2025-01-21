import { web3 } from '@coral-xyz/anchor';
import { PluginID } from '@masknet/shared-base';

import { multipliedBy } from '@/helpers/number.js';

// Note: if the latest version has been changed, please update packages/mask/content-script/components/CompositionDialog/useSubmit.ts
/**
 * !! Change this key cause a breaking change in the red packet plugin.
 * !! Please make sure it also be able to recognize the old key.
 */
export const RedPacketMetaKey = `${PluginID.RedPacket}:1`;
export const SolanaRedPacketMetaKey = `${PluginID.RedPacket}_solana:1`;
export const RedPacketEncryptedKey = `${RedPacketMetaKey}:encrypted`;

export const SupportedMetaKeys = [RedPacketMetaKey, SolanaRedPacketMetaKey];

export const MESSAGE_MAX_LENGTH = 100;
export const MESSAGE_MAX_LENGTH_SOLANA = 100;

export const RED_PACKET_DEFAULT_SHARES = 5;
export const RED_PACKET_MIN_SHARES = 1;
export const RED_PACKET_MAX_SHARES = 255;
export const RED_PACKET_MAX_SHARES_SOLANA = 200;
export const RED_PACKET_DURATION = 60 * 60 * 24;
export const RED_PACKET_CONTRACT_VERSION = 4;
export const DEFAULT_THEME_ID = 'e171b936-b5f5-415c-8938-fa1b74d1d612';
export const SOLANA_PREFIX = 'solana-';
export const SOLANA_DEFAULT_CREATE_GAS = multipliedBy(0.01, web3.LAMPORTS_PER_SOL);
