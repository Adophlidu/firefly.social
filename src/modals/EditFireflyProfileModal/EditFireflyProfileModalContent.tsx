import { Dialog } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import { useMemo } from 'react';

import { EditFireflyProfileRouter } from '@/components/EditFireflyProfile/EditFireflyProfileRouter.js';
import { CloseButton } from '@/components/IconButton.js';
import { Loading } from '@/components/Loading.js';
import { Source } from '@/constants/enum.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { type AllConnections, type FireflyAccountProfile } from '@/providers/types/Firefly.js';

export interface EditFireflyProfileModalContentProps {
    profile?: FireflyAccountProfile | null;
    connections?: AllConnections;
    onClose: () => void;
}

export function EditFireflyProfileModalContent({ connections, profile, onClose }: EditFireflyProfileModalContentProps) {
    const identity = useMemo(() => {
        if (!connections) return;
        const sortedConnections = compact([
            ...connections.farcaster.connected.map((x) => ({ source: Source.Farcaster, id: `${x.id}` })),
            ...connections.lens.connected.flatMap((x) => x.lens.map((x) => ({ source: Source.Lens, id: x.id }))),
            ...connections.twitter.connected.map((x) => ({ source: Source.Twitter, id: x.id })),
            ...connections.bsky.connected.map((x) => ({ source: Source.Bsky, id: x.id })),
        ]);
        return sortedConnections[0];
    }, [connections]);

    const { data, isLoading } = useQuery({
        queryKey: ['profile', identity?.source, identity?.id],
        queryFn() {
            if (!identity || !isSocialSource(identity.source)) return;
            return resolveSocialMediaProvider(identity.source).getProfileById(identity.id);
        },
        enabled: !!identity && !profile?.displayName,
    });

    if (isLoading) {
        return (
            <>
                <Dialog.Title as="h3" className="relative h-14 shrink-0 pt-safe">
                    <CloseButton className="absolute left-4 top-1/2 -translate-y-1/2 text-fourMain" onClick={onClose} />
                </Dialog.Title>
                <div className="flex h-[366px] w-full items-center justify-center">
                    <Loading />
                </div>
            </>
        );
    }

    return (
        <EditFireflyProfileRouter
            profile={
                profile ? { ...profile, displayName: (profile?.displayName || data?.displayName) ?? null } : undefined
            }
            onClose={onClose}
        />
    );
}
