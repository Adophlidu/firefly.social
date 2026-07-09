import { parseAsStringEnum, useQueryState } from 'nuqs';

export enum BetsEventInfoTab {
    Comments = 'comments',
    TopHolders = 'top-holders',
    Trades = 'trades',
    Info = 'info',
    Resolution = 'resolution',
}

export function useBetsEventInfoTab(showResolution = false) {
    const [tab, setTab] = useQueryState<BetsEventInfoTab>(
        'infoTab',
        parseAsStringEnum([
            BetsEventInfoTab.Comments,
            BetsEventInfoTab.TopHolders,
            BetsEventInfoTab.Trades,
            BetsEventInfoTab.Info,
            BetsEventInfoTab.Resolution,
        ]).withDefault(BetsEventInfoTab.TopHolders),
    );

    return [showResolution || tab !== BetsEventInfoTab.Resolution ? tab : BetsEventInfoTab.Info, setTab] as const;
}
