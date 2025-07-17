import { Trans } from '@lingui/react/macro';

import { SquareButton } from '@/app/(whiteboard)/components/Signup/SquareButton.js';
import { Modal } from '@/components/Modal.js';
import { PageRoute } from '@/constants/enum.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { FireflyAccountSVG } from '@/modals/CreateFireflyAccountGuideModal/FireflyAccountSVG.js';

type Props = {
    ref: React.Ref<SingletonModalRefCreator>;
};

export function CreateFireflyAccountGuideModal({ ref }: Props) {
    const [open, dispatch] = useSingletonModal(ref);

    return (
        <Modal disableBackdropClose open={open} onClose={() => dispatch?.close()}>
            <div>
                <div className="no-scrollbar relative max-h-[75vh] w-[90vw] max-w-[512px] space-y-10 overflow-y-auto rounded-md bg-lightBottom p-8 text-medium text-lightMain shadow-popover transition-all dark:bg-darkBottom md:rounded-3xl">
                    <div>
                        <h2 className="text-2xl font-bold !leading-[29px] text-main">
                            <Trans>Create your Firefly Profile</Trans>
                        </h2>
                        <p className="mt-2 text-lg tracking-tight text-second">
                            <Trans>One Firefly account manages all your social accounts</Trans>
                        </p>
                    </div>
                    <div className="flex justify-center">
                        <FireflyAccountSVG />
                    </div>
                    <SquareButton
                        onClick={() => {
                            dispatch?.close();
                            location.href = PageRoute.Signup;
                        }}
                    >
                        <span className="text-base font-medium text-primaryBottom">
                            <Trans>Let’s go!</Trans>
                        </span>
                    </SquareButton>
                </div>
            </div>
        </Modal>
    );
}
