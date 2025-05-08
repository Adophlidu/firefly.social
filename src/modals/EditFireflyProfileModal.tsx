import { Dialog } from '@headlessui/react';
import { delay } from '@masknet/kit';
import { useQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import { useMemo, useState } from 'react';

import { EditFireflyProfileRouter } from '@/components/EditFireflyProfile/EditFireflyProfileRouter.js';
import { CloseButton } from '@/components/IconButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Modal } from '@/components/Modal.js';
import { Source } from '@/constants/enum.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { AllConnections, FireflyAccountProfile } from '@/providers/types/Firefly.js';

export interface EditFireflyProfileModalOpenProps {
    profile?: FireflyAccountProfile | null;
    connections?: AllConnections;
}

interface Props {
    ref: React.Ref<SingletonModalRefCreator<EditFireflyProfileModalOpenProps>>;
}

function EditFireflyProfileModalContent({
    connections,
    profile,
    onClose,
}: Pick<EditFireflyProfileModalOpenProps, 'connections' | 'profile'> & { onClose: () => void }) {
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
                    <LoadingIcon />
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

export function EditFireflyProfileModal({ ref }: Props) {
    const [profile, setProfile] = useState<FireflyAccountProfile | undefined>(undefined);
    const [connections, setConnections] = useState<AllConnections | undefined>(undefined);
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
            if (props.profile) setProfile(props.profile ?? undefined);
            setConnections(props.connections);
        },
        onClose: async () => {
            await delay(200);
            setConnections(undefined);
            setProfile(undefined);
        },
    });

    return (
        <Modal open={open} onClose={() => dispatch?.close()} dialogPanelClassName="flex-col">
            <div className="relative flex w-[100vw] flex-grow flex-col overflow-auto bg-lightBottom shadow-popover transition-all dark:bg-darkBottom dark:text-gray-950 md:h-auto md:max-h-[800px] md:w-[455px] md:rounded-xl lg:flex-grow-0">
                <EditFireflyProfileModalContent
                    profile={profile}
                    connections={connections}
                    onClose={() => dispatch?.close()}
                />
            </div>
        </Modal>
    );
}
