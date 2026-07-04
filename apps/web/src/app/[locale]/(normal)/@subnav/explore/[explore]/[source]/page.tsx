import { type ExploreSourceInURL, ExploreType } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';

import { ExploreSourceTabs } from '@/components/Explores/ExploreSourceTabs.js';
import { NoSSR } from '@/components/NoSSR.js';
import { ExploreSourceNav } from '@/components/SourceNav/ExploreSourceNav.js';
import { PredictionSourceNav } from '@/components/SourceNav/PredictionSourceNav.js';

interface Props extends LayoutProps<{ source: string; explore: string }> {}

export default async function SubNav(props: Props) {
    const { source } = await props.params;
    const explore = (await props.params).explore as ExploreType;

    return (
        <>
            <ExploreSourceTabs explore={explore} />
            <NoSSR>
                {explore === ExploreType.Prediction ? (
                    <PredictionSourceNav className="bg-primaryBottom" />
                ) : (
                    <ExploreSourceNav
                        explore={explore}
                        source={source as ExploreSourceInURL}
                        className="bg-primaryBottom"
                    />
                )}
            </NoSSR>
        </>
    );
}
