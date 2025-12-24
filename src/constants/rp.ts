import { web3 } from '@coral-xyz/anchor';

import { multipliedBy } from '@/helpers/number.js';
import { EthereumChainId as ChainId } from '@/web3-shared/evm/types.js';

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
export const SOLANA_DEFAULT_CREATE_GAS = multipliedBy(0.00175, web3.LAMPORTS_PER_SOL);

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

export const RED_PACKETS: Partial<Record<ChainId, string>> = {
    [ChainId.Mainnet]: '0xaBBe1101FD8fa5847c452A6D70C8655532B03C33',
    [ChainId.BSC]: '0x0ca42C178e14c618c81B8438043F27d9D38145f6',
    [ChainId.Base]: '0x8D03d9b43e98Cc2f790Be4E96503fD0CcFd04a2D',
    [ChainId.Polygon]: '0x93e0b87A0aD0C991dc1B5176ddCD850c9a78aabb',
    [ChainId.Arbitrum]: '0x83D6b366f21e413f214EB077D5378478e71a5eD2',
    [ChainId.xDai]: '0x54a0A221C25Fc0a347EC929cFC5db0be17fA2a2B',
    [ChainId.Optimism]: '0x981be454a930479d92C91a0092D204b64845A5D6',
    [ChainId.Avalanche]: '0xF9F7C1496c21bC0180f4B64daBE0754ebFc8A8c0',
    [ChainId.Celo]: '0xAb7B1bE4233A04e5C43a810E75657ECED8E5463B',
    [ChainId.Fantom]: '0x578a7Fee5f0D8CEc7d00578Bf37374C5b95C4b98',
    [ChainId.Aurora]: '0x19f179D7e0D7d9F9d5386afFF64271D98A91615B',
    [ChainId.Conflux]: '0x96c7d011cdfd467f551605f0f5fce279f86f4186',
    [ChainId.Scroll]: '0x16f61cb37169523635B6761f3C946892fb3c18fB',
    [ChainId.Metis]: '0x2cf91AD8C175305EBe6970Bd8f81231585EFbd77',
    [ChainId.XLayer]: '0xDb847f1D8099C5b15519ECfd0b0C981d719bccE6',
    [ChainId.Lens]: '0x2CB304F176775Fcb4D9763f488c486B0Af9A6Bf8',
    [ChainId.ZksyncEra]: '0x5916FEE647A7f0aC234D6828Fe76636bd730B40A',
    [ChainId.Linea]: '0xB349AC5E5C037C2ecb2AE9fCDc8F122b5f384620',
};
