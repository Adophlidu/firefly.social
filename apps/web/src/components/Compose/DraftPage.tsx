'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useLocation } from '@tanstack/react-router';
import { memo, Suspense, useState } from 'react';
import { useMount } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { DraftList } from '@/components/Compose/DraftList/index.js';
import { ScheduleTaskList } from '@/components/Compose/ScheduleTaskList.js';
import { Loading } from '@/components/Loading.js';
import { captureScheduleTabClickEvent } from '@/providers/telemetry/captureClickEvent.js';

export enum DraftPageTab {
    Draft = 'Draft',
    Scheduled = 'Scheduled',
}

export const DraftPage = memo(function DraftPage() {
    const [currentTab, setCurrentTab] = useState(DraftPageTab.Draft);

    const location = useLocation();

    useMount(() => {
        const search = location.search;
        if (search.tab) setCurrentTab(search.tab);
    });

    return (
        <div className="flex min-h-0 grow flex-col">
            <div className="scrollable-tab border-line flex shrink-0 gap-3 border-b px-4">
                {[
                    {
                        type: DraftPageTab.Draft,
                        title: <Trans>Unsent posts</Trans>,
                    },
                    {
                        type: DraftPageTab.Scheduled,
                        title: <Trans>Scheduled</Trans>,
                    },
                ].map(({ type, title }) => (
                    <div key={type} className="flex flex-1 flex-col">
                        <ClickableButton
                            className={classNames(
                                'flex h-[46px] items-center justify-center whitespace-nowrap px-[14px] font-extrabold transition-all',
                                currentTab === type ? 'text-main' : 'text-third hover:text-main',
                            )}
                            onClick={() => {
                                setCurrentTab(type);
                                if (type === DraftPageTab.Scheduled) {
                                    captureScheduleTabClickEvent();
                                }
                            }}
                        >
                            {title}
                        </ClickableButton>
                        <span
                            className={classNames(
                                'bg-fireflyBrand h-1 w-full rounded-full transition-all',
                                currentTab !== type ? 'hidden' : '',
                            )}
                        />
                    </div>
                ))}
            </div>
            <Suspense fallback={<Loading minHeight={478} />}>
                {currentTab === DraftPageTab.Draft ? <DraftList /> : <ScheduleTaskList />}
            </Suspense>
        </div>
    );
});
