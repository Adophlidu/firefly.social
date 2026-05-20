import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

export function resolveCategorySlugIcon(item: PolymarketEventSlugListData, isDarkMode: boolean): string | undefined {
    const icon = isDarkMode ? item.icon_night : item.icon_day;
    if (!icon) return undefined;
    const trimmed = icon.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

export function hasTertiaryCategories(item: PolymarketEventSlugListData): boolean {
    return (item.sub_slug?.length ?? 0) > 0;
}
