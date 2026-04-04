import { SuggestedFollowsSkeleton } from '@/components/SuggestedFollows/SuggestedFollowsSkeleton.js';
import { dynamic } from '@/esm/dynamic.js';

const SuggestedFollowsCard = dynamic(
    () => import('@/components/SuggestedFollows/SuggestedFollowsCard.js').then((x) => x.SuggestedFollowsCard),
    {
        ssr: false,
        loading: () => <SuggestedFollowsSkeleton />,
    },
);

export function SuggestedFollows() {
    return <SuggestedFollowsCard />;
}
