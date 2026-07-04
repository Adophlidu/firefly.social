import { ExploreType } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';

import { ExploreSourceTabs } from '@/components/Explores/ExploreSourceTabs.js';
import { NoSSR } from '@/components/NoSSR.js';
import { PredictionSourceNav } from '@/components/SourceNav/PredictionSourceNav.js';

interface Props extends LayoutProps<{ explore: string }> {}

export default async function SubNav(props: Props) {
    const explore = (await props.params).explore as ExploreType;

    return (
        <>
            <ExploreSourceTabs explore={explore} />
            <NoSSR>
                {explore === ExploreType.Prediction ? <PredictionSourceNav className="bg-primaryBottom" /> : null}
            </NoSSR>
        </>
    );
}
