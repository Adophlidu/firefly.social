'use client';

import ActiveIcon from '@dimensiondev/assets/snapshot-active.svg';
import { classNames } from '@dimensiondev/utils';
import { Tab } from '@headlessui/react';
import { IS_APPLE, IS_SAFARI } from '@lexical/utils';
import { Trans } from '@lingui/react/macro';

import { ClickableArea } from '@/components/ClickableArea.js';
import { SnapshotMarkup } from '@/components/Markup/SnapshotMarkup.js';

export function SnapshotFallbackContent({ title, body }: { title: string; body: string }) {
    const tabs = [
        {
            label: <Trans>Proposal</Trans>,
            value: 'proposal',
        },
        {
            label: <Trans>Votes</Trans>,
            value: 'votes',
        },
    ] as const;

    return (
        <div className="link-preview">
            <ClickableArea className="border-line bg-bg text-commonMain relative mt-[6px] flex flex-col gap-2 rounded-2xl border p-3 text-left">
                <div
                    className={
                        'bg-lightMain text-lightBottom flex items-center gap-1 self-start rounded-full px-3 py-[2px] text-sm leading-[18px] opacity-40'
                    }
                >
                    <ActiveIcon />
                    <span>
                        <Trans>Not Found</Trans>
                    </span>
                </div>
                <h3
                    className={classNames('line-clamp-2 text-left text-[18px] font-bold leading-5', {
                        'max-h-[40px]': IS_SAFARI && IS_APPLE,
                    })}
                >
                    {title}
                </h3>

                <Tab.Group selectedIndex={0}>
                    <Tab.List className="flex w-full rounded-t-xl bg-none">
                        {tabs.map((x, i) => (
                            <Tab
                                className={classNames(
                                    'flex-1 rounded-t-xl px-4 py-2 text-base font-bold leading-5 outline-none',
                                    {
                                        'text-secondary': i !== 0,
                                        'bg-primaryBottom text-main': i === 0,
                                    },
                                )}
                                key={x.value}
                            >
                                {x.label}
                            </Tab>
                        ))}
                    </Tab.List>
                    <Tab.Panels className="bg-primaryBottom rounded-b-xl p-4">
                        <Tab.Panel>
                            <SnapshotMarkup className="no-scrollbar text-secondary overflow-auto text-sm leading-[18px] max-md:h-[270px] md:h-[374px]">
                                {body}
                            </SnapshotMarkup>
                        </Tab.Panel>
                        <Tab.Panel />
                    </Tab.Panels>
                </Tab.Group>
            </ClickableArea>
        </div>
    );
}
