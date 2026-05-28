'use client';

import { SearchType } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { uniqBy } from 'lodash-es';
import { memo, type PropsWithChildren } from 'react';

import {
    type SearchPredictionContentPagedData,
    useSearchPredictionContent,
} from '@/app/[locale]/(normal)/search/[...slug]/pages/useSearchPredictionContent.js';
import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { SEARCH_PREDICTION_EVENT_STATUS_OPTIONS } from '@/components/Search/SearchPredictionEventStatusTabs.js';
import type { PredictionSearchTag } from '@/providers/firefly/prediction/searchPrediction.js';
import {
    type SearchPredictionEventStatus,
    useSearchPredictionFilterStore,
} from '@/store/useSearchPredictionFilterStore.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';

const TopicPill = memo(function TopicPill({ topic, onClick }: { topic: PredictionSearchTag; onClick: () => void }) {
    return (
        <ClickableButton
            className="rounded-full bg-primaryBottom px-4 py-1.5 text-sm font-medium text-main shadow-sm transition-colors hover:bg-bg"
            onClick={onClick}
        >
            {topic.label}
        </ClickableButton>
    );
});

const StatusRow = memo(function StatusRow({
    value,
    selected,
    children,
}: PropsWithChildren<{
    value: SearchPredictionEventStatus;
    selected?: SearchPredictionEventStatus;
}>) {
    const setEventStatus = useSearchPredictionFilterStore.use.setEventStatus();
    const checked = selected === value;

    return (
        <ClickableButton
            className="flex w-full items-center justify-between py-2 text-base text-main"
            onClick={() => setEventStatus(value)}
        >
            <span>{children}</span>
            <CircleCheckboxIcon checked={checked} />
        </ClickableButton>
    );
});

function selector(data: SearchPredictionContentPagedData) {
    return uniqBy(
        [
            ...data.pages.flatMap((x) => x?.data?.tags || []),
            ...data.pages.flatMap((x) => x?.data.events.flatMap((event) => event.tags || [])),
        ],
        (tag) => tag.id || tag.label.toLowerCase(),
    ).filter((tag) => {
        const label = tag.label.trim();
        if (!label || ('forceHide' in tag && tag.forceHide)) return false;
        if (['Hide From New', 'Recurring'].includes(label)) return false;
        return !label.toLowerCase().startsWith('rewards');
    });
}

export const SearchPredictionFilterSidebar = memo(function SearchPredictionFilterSidebar() {
    const { searchKeyword, searchType, updateState, source } = useSearchStateStore();
    const eventStatus = useSearchPredictionFilterStore.use.eventStatus();
    const selectedStatus = eventStatus ?? 'active';
    const keyword = searchKeyword.trim();

    const result = useSearchPredictionContent(keyword, source, eventStatus, selector);

    if (searchType !== SearchType.Prediction) return null;

    return (
        <div className="mt-2.5 flex flex-col gap-4">
            <div className="rounded-lg bg-bg px-4 py-3 text-base font-bold text-main">
                <Trans>Search Filter</Trans>
            </div>
            <div className="rounded-lg bg-bg px-4 py-5">
                {result.data.length ? (
                    <section>
                        <h2 className="text-base font-bold text-main">
                            <Trans>Topics</Trans>
                        </h2>
                        <div className="mt-5 flex flex-wrap gap-3">
                            {result.data.slice(0, 12).map((topic) => (
                                <TopicPill
                                    key={topic.id || topic.label}
                                    topic={topic}
                                    onClick={() =>
                                        updateState({
                                            q: topic.label,
                                            type: SearchType.Prediction,
                                        })
                                    }
                                />
                            ))}
                        </div>
                    </section>
                ) : null}
                <section className={classNames({ 'mt-7': result.data.length > 0 })}>
                    <h2 className="text-base font-bold text-main">
                        <Trans>Event Status</Trans>
                    </h2>
                    <div className="mt-4 flex flex-col gap-1">
                        {SEARCH_PREDICTION_EVENT_STATUS_OPTIONS.map((option) => (
                            <StatusRow key={option.value} value={option.value} selected={eventStatus}>
                                {option.label}
                            </StatusRow>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
});
