import { formatCoinName } from '@/helpers/formatCoinName';

export function resolveMetaAvatar(name: string) {
    return `https://uni.onekey-asset.com/static/hyperliquid/${formatCoinName(name)}.png`;
}
