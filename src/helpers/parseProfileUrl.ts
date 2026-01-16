import { PageRoute, Source, WalletProfileCategory } from '@/constants/enum.js';
import { isFollowCategory } from '@/helpers/isFollowCategory.js';
import { isSocialProfileCategory } from '@/helpers/isSocialProfileCategory.js';
import { isProfilePageSource, isSocialSource } from '@/helpers/isSource.js';
import { isWalletProfileCategory } from '@/helpers/isWalletProfileCategory.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';

export function parseProfileUrl(pathname: string) {
    if (!pathname.startsWith(PageRoute.Profile)) return null;
    const [, , sourceInUrl, id, category] = pathname.split('/');
    const source = resolveSourceFromUrlNoFallback(sourceInUrl);
    if (!source) return null;
    if (!category) {
        return {
            id,
            source,
        };
    }

    // Handle old /bets URL - convert to prediction
    const normalizedCategory = category === 'bets' ? WalletProfileCategory.Bets : category;

    const isSocialProfile = isSocialSource(source) && isSocialProfileCategory(source, normalizedCategory);
    const isWalletProfile =
        (source === Source.Wallet || source === Source.WalletMix) && isWalletProfileCategory(normalizedCategory);
    const isProfileFollowPage = isSocialSource(source) && isFollowCategory(normalizedCategory);
    if (isSocialProfile || isWalletProfile || isProfileFollowPage) {
        return {
            id,
            category: normalizedCategory,
            source,
        };
    }
    return null;
}

function fixWalletProfileCategory(category: WalletProfileCategory) {
    if (['articles', 'DAOs'].includes(category)) {
        return WalletProfileCategory.Activities;
    }
    if (['swap'].includes(category)) {
        return WalletProfileCategory.Transactions;
    }
    if (['polymarket', 'bets'].includes(category)) {
        return WalletProfileCategory.Bets;
    }

    return;
}

export function parseOldProfileUrl(url: URL) {
    if (!url.pathname.startsWith(PageRoute.Profile)) return null;

    if (!url.searchParams.size) {
        const [, , sourceInUrl, id, category] = url.pathname.split('/');
        const source = resolveSourceFromUrlNoFallback(sourceInUrl);
        const fixedCategory = fixWalletProfileCategory(category as WalletProfileCategory);
        if (
            source &&
            isProfilePageSource(source) &&
            [Source.Wallet, Source.WalletMix].includes(source) &&
            fixedCategory
        ) {
            return { source, id, category: fixedCategory };
        }
    }

    const source = resolveSourceFromUrlNoFallback(url.searchParams.get('source'));
    if (!source || !isProfilePageSource(source)) return null;
    const [, , id, ...end] = url.pathname.split('/');
    if (end.length) return null;
    if (!id) return null;

    if (source === Source.Wallet || source === Source.WalletMix) {
        const walletTab = url.searchParams.get('wallet_tab');
        if (!walletTab || !isWalletProfileCategory(walletTab)) return { source, id };
        return { source, id, category: fixWalletProfileCategory(walletTab) || walletTab };
    }

    const category = url.searchParams.get('profile_tab');
    if (!category || !isSocialProfileCategory(source, category)) return { source, id };

    return { source, id, category };
}
