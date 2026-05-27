'use client';

import { EMPTY_LIST } from '@dimensiondev/constants';
import { SearchType } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { skipToken, useQuery } from '@tanstack/react-query';
import { uniqBy } from 'lodash-es';
import { memo, type PropsWithChildren, type ReactNode } from 'react';

import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { type PredictionSearchTag, searchPrediction } from '@/providers/firefly/prediction/searchPrediction.js';
import {
    type SearchPredictionEventStatus,
    useSearchPredictionFilterStore,
} from '@/store/useSearchPredictionFilterStore.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';

const STATUS_OPTIONS: Array<{
    value: SearchPredictionEventStatus;
    label: ReactNode;
}> = [
    {
        value: 'active',
        label: <Trans>Active</Trans>,
    },
    {
        value: 'resolved',
        label: <Trans>Resolved</Trans>,
    },
];

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
            onClick={() => setEventStatus(checked ? undefined : value)}
        >
            <span>{children}</span>
            <CircleCheckboxIcon checked={checked} />
        </ClickableButton>
    );
});

export const SearchPredictionFilterSidebar = memo(function SearchPredictionFilterSidebar() {
    const { searchKeyword, searchType, updateState } = useSearchStateStore();
    const eventStatus = useSearchPredictionFilterStore.use.eventStatus();
    const keyword = searchKeyword.trim();

    const { data: topics = [] } = useQuery({
        queryKey: ['search', SearchType.Prediction, 'filter-tags', keyword, eventStatus],
        queryFn: keyword
            ? async () => {
                  const result = await searchPrediction({
                      keyword,
                      limit: 10,
                      eventsStatus: eventStatus,
                      searchTags: true,
                  });
                  const eventTags = result.data.flatMap((event) => event.tags || EMPTY_LIST);
                  return uniqBy([...result.tags, ...eventTags], (tag) => tag.id || tag.label.toLowerCase())
                      .filter((tag) => {
                          const label = tag.label.trim();
                          if (!label || tag.forceHide) return false;
                          if (['Hide From New', 'Recurring'].includes(label)) return false;
                          return !label.toLowerCase().startsWith('rewards');
                      })
                      .slice(0, 12);
              }
            : skipToken,
    });

    if (searchType !== SearchType.Prediction) return null;

    return (
        <div className="mt-2.5 flex flex-col gap-4">
            <div className="rounded-lg bg-bg px-4 py-3 text-base font-bold text-main">
                <Trans>Search Filter</Trans>
            </div>
            <div className="rounded-lg bg-bg px-4 py-5">
                {topics.length ? (
                    <section>
                        <h2 className="text-base font-bold text-main">
                            <Trans>Topics</Trans>
                        </h2>
                        <div className="mt-5 flex flex-wrap gap-3">
                            {topics.map((topic) => (
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
                <section className={classNames({ 'mt-7': topics.length > 0 })}>
                    <h2 className="text-base font-bold text-main">
                        <Trans>Event Status</Trans>
                    </h2>
                    <div className="mt-4 flex flex-col gap-1">
                        {STATUS_OPTIONS.map((option) => (
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
