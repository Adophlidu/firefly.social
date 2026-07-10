import { parseAsStringEnum, useQueryState } from 'nuqs';

export enum BetsEventInfoTab {
    Comments = 'comments',
    TopHolders = 'top-holders',
    Trades = 'trades',
    Info = 'info',
    Resolution = 'resolution',
}

export function useBetsEventInfoTab(showResolution = false, showComments = true) {
    // Default to the Comments tab on events that have it (FIFA), else Top Holders.
    // Only applies when the URL has no `infoTab` — an explicit selection always wins.
    const defaultTab = showComments ? BetsEventInfoTab.Comments : BetsEventInfoTab.TopHolders;
    const [tab, setTab] = useQueryState<BetsEventInfoTab>(
        'infoTab',
        parseAsStringEnum([
            BetsEventInfoTab.Comments,
            BetsEventInfoTab.TopHolders,
            BetsEventInfoTab.Trades,
            BetsEventInfoTab.Info,
            BetsEventInfoTab.Resolution,
        ]).withDefault(defaultTab),
    );

    // Resolve unsupported tabs to a safe default so a direct URL (e.g. ?infoTab=comments
    // on a non-FIFA event, or ?infoTab=resolution when hidden) never renders a hidden tab.
    let resolved = tab;
    if (!showResolution && tab === BetsEventInfoTab.Resolution) resolved = BetsEventInfoTab.Info;
    if (!showComments && tab === BetsEventInfoTab.Comments) resolved = BetsEventInfoTab.TopHolders;

    return [resolved, setTab] as const;
}
