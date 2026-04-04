'use client';

import { Trans } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';

import { Image } from '@/components/Image.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { ProjectItem } from '@/components/ProjectItem.js';
import { useLocale } from '@/helpers/getCookies.js';
import { getTopProjects } from '@/providers/firefly/endpoint/getTopProjects.js';

export function ProjectTrendingList() {
    const locale = useLocale();
    const { data, isFetching } = useSuspenseQuery({
        queryKey: ['explore-projects', locale],
        queryFn: async () => {
            return getTopProjects(locale);
        },
    });

    if (!data.length && isFetching) {
        return <NoResultsFallback />;
    }

    return (
        <div>
            {data.slice(0, 40).map((x) => {
                return <ProjectItem key={x.project_id} project={x} />;
            })}

            <div className="text-secondary flex items-center justify-center gap-x-2 p-6 text-base">
                <Image width={80} height={24} alt="rootdata" src="/image/rootdata.png" />
                <Trans>Top 40 Projects powered by Rootdata</Trans>
            </div>
        </div>
    );
}
