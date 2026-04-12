import { delay } from '@dimensiondev/utils';
import { useState } from 'react';

import { Loading } from '@/components/Loading.js';
import { Modal } from '@/components/Modal.js';
import { dynamic } from '@/esm/dynamic.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { EditFireflyProfileModalRefType } from '@/modals/EditFireflyProfileModal/refs.js';
import type { AllConnections, FireflyAccountProfile } from '@/providers/types/Firefly.js';

interface EditFireflyProfileModalOpenProps {
    profile?: FireflyAccountProfile | null;
    connections?: AllConnections;
}

interface Props {
    ref: React.Ref<EditFireflyProfileModalRefType>;
}

const EditFireflyProfileModalContent = dynamic(
    () =>
        import('@/modals/EditFireflyProfileModal/EditFireflyProfileModalContent.js').then(
            (m) => m.EditFireflyProfileModalContent,
        ),
    {
        ssr: false,
        loading: () => <Loading />,
    },
);

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
            <div className="bg-primaryBottom shadow-popover relative flex w-screen grow flex-col overflow-auto transition-all md:h-auto md:max-h-[800px] md:w-[455px] md:rounded-xl lg:grow-0">
                <EditFireflyProfileModalContent
                    profile={profile}
                    connections={connections}
                    onClose={() => dispatch?.close()}
                />
            </div>
        </Modal>
    );
}
