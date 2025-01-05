import { notFound } from 'next/navigation.js';

import { SourceTabs } from '@/components/SourceTabs/index.js';
import { SourceTab } from '@/components/SourceTabs/SourceTab.js';
import { DISCOVER_SOURCES } from '@/constants/index.js';
import { isDiscoverSource } from '@/helpers/isDiscoverSource.js';
import { resolveDiscoverUrl } from '@/helpers/resolveDiscoverUrl.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import type { NextPageProps } from '@/types/index.js';

interface Props extends NextPageProps<{ source: string }> {}

export default async function Layout(props: Props) {
    const params = await props.params;
    const { children } = props;

    const source = resolveSourceFromUrlNoFallback(params.source);

    if (!source || !isDiscoverSource(source)) {
        notFound();
    }

    return (
        <>
            <SourceTabs>
                {DISCOVER_SOURCES.map((x) => (
                    <SourceTab key={x} href={resolveDiscoverUrl(x)} isActive={x === source}>
                        {resolveSourceName(x)}
                    </SourceTab>
                ))}
            </SourceTabs>
            {children}
        </>
    );
}
