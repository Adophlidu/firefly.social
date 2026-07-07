import { LAMPORTS_PER_SOL } from '@dimensiondev/web3/constants';
import { multipliedBy } from '@dimensiondev/web3/numbers';

// Note: if the latest version has been changed, please update packages/mask/content-script/components/CompositionDialog/useSubmit.ts
/**
 * !! Change this key cause a breaking change in the red packet plugin.
 * !! Please make sure it also be able to recognize the old key.
 */

const RedPacketPluginID = 'com.maskbook.red_packet';

export const RedPacketMetaKey = `${RedPacketPluginID}:1`;
export const SolanaRedPacketMetaKey = `${RedPacketPluginID}_solana:1`;

export const MESSAGE_MAX_LENGTH = 40;
export const MESSAGE_MAX_LENGTH_SOLANA = 40;

export const RED_PACKET_DEFAULT_SHARES = 5;
export const RED_PACKET_MIN_SHARES = 1;
export const RED_PACKET_MAX_SHARES = 500;
export const RED_PACKET_MAX_SHARES_SOLANA = 200;
export const RED_PACKET_DURATION = 60 * 60 * 24;
export const RED_PACKET_CONTRACT_VERSION = 4;
export const DEFAULT_THEME_ID = 'e171b936-b5f5-415c-8938-fa1b74d1d612';
export const SOLANA_REDPACKET_CREATE_GAS = multipliedBy(0.0072, LAMPORTS_PER_SOL);
export const SOLANA_REDPACKET_CLAIM_GAS = multipliedBy(0.00175, LAMPORTS_PER_SOL);

export const DEFAULT_THEME = {
    tid: DEFAULT_THEME_ID,
    cover: {
        title1: {
            color: '#FFE4A6',
            font_size: 50,
            font_family: 'Inter',
            font_weight: 700,
            line_height: 57.5,
        },
        title2: {
            color: '#FFE4A6',
            font_size: 37.5,
            font_family: 'Inter',
            font_weight: 400,
            line_height: 43.125,
        },
        title3: {
            color: '#FFE4A6',
            font_size: 30,
            font_family: 'Inter',
            font_weight: 700,
            line_height: 34.5,
        },
        title4: {
            color: '#FFE4A6',
            font_size: 30,
            font_family: 'Inter',
            font_weight: 700,
            line_height: 34.5,
        },
        bg_color: '#FFE4A6',
        bg_image: 'https://s3.amazonaws.com/redpacket.firefly.land/redpacket-template/reapacket-bg-red-follower.jpeg',
        logo_image: '',
    },
    normal: {
        title1: {
            color: '#FFE4A6',
            font_size: 50,
            font_family: 'Inter',
            font_weight: 700,
            line_height: 57.5,
        },
        title2: {
            color: '#FFE4A6',
            font_size: 37.5,
            font_family: 'Inter',
            font_weight: 400,
            line_height: 43.125,
        },
        title3: {
            color: '#FFE4A6',
            font_size: 30,
            font_family: 'Inter',
            font_weight: 700,
            line_height: 34.5,
        },
        title4: {
            color: '#FFE4A6',
            font_size: 30,
            font_family: 'Inter',
            font_weight: 700,
            line_height: 34.5,
        },
        bg_color: '#FFE4A6',
        bg_image: 'https://s3.amazonaws.com/redpacket.firefly.land/redpacket-template/reapacket-bg-red-follower.jpeg',
        logo_image: '',
    },
    is_default: true,
};
