import { Tab } from '@headlessui/react';
import { IS_APPLE, IS_SAFARI } from '@lexical/utils';
import { Trans } from '@lingui/react/macro';

import ActiveIcon from '@/assets/snapshot-active.svg';
import { ClickableArea } from '@/components/ClickableArea.js';
import { SnapshotMarkup } from '@/components/Markup/SnapshotMarkup.js';
import { classNames } from '@/helpers/classNames.js';

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
            <ClickableArea className="relative mt-[6px] flex flex-col gap-2 rounded-2xl border border-line bg-bg p-3 text-left text-commonMain">
                <div
                    className={
                        'flex items-center gap-1 self-start rounded-full bg-lightMain px-3 py-[2px] text-sm leading-[18px] text-lightBottom opacity-40'
                    }
                >
                    <ActiveIcon />
                    <span>
                        <Trans>Not Found</Trans>
                    </span>
                </div>
                <h3
                    className={classNames('line-clamp-2 text-left text-[18px] font-bold leading-[20px]', {
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
                    <Tab.Panels className="rounded-b-xl bg-primaryBottom p-4">
                        <Tab.Panel>
                            <SnapshotMarkup className="no-scrollbar overflow-auto text-sm leading-[18px] text-secondary max-md:h-[270px] md:h-[374px]">
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
