import { delay } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useState } from 'react';

import { Loading } from '@/components/Loading.js';
import { Modal } from '@/components/Modal.js';
import { dynamic } from '@/esm/dynamic.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { EditFireflyProfileModalRefType } from '@/modals/EditFireflyProfileModal/refs.js';
import type { AllConnections, FireflyAccountProfile } from '@/providers/types/Firefly.js';

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
        <Modal
            open={open}
            onClose={() => dispatch?.close()}
            title={<Trans>Edit Profile</Trans>}
            enableClose
            className="w-screen md:w-[455px]"
            dialogPanelClassName="flex-col"
            panelClassName="flex flex-col overflow-auto !px-4 !pb-4 pt-0 md:max-h-[800px]"
        >
            <EditFireflyProfileModalContent
                profile={profile}
                connections={connections}
                onClose={() => dispatch?.close()}
            />
        </Modal>
    );
}
