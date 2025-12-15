import { Trans } from '@lingui/react/macro';

import { SquareButton } from '@/app/(whiteboard)/components/Signup/SquareButton.js';
import { Modal } from '@/components/Modal.js';
import { PageRoute } from '@/constants/enum.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { FireflyAccountSVG } from '@/modals/CreateFireflyAccountGuideModal/FireflyAccountSVG.js';

interface Props {
    ref: React.Ref<SingletonModalRefCreator>;
}

export function CreateFireflyAccountGuideModal({ ref }: Props) {
    const [open, dispatch] = useSingletonModal(ref);

    return (
        <Modal disableBackdropClose open={open} onClose={() => dispatch?.close()}>
            <div>
                <div className="relative flex max-h-[75vh] w-[90vw] max-w-[512px] flex-col gap-5 rounded-md bg-white p-3 text-medium text-lightMain shadow-popover transition-all md:gap-10 md:rounded-3xl md:p-8">
                    <div className="shrink-0">
                        <h2 className="text-2xl font-bold !leading-[29px] text-lightTextMain">
                            <Trans>Create your Firefly Profile</Trans>
                        </h2>
                        <p className="mt-2 text-lg tracking-tight text-[#6b6b6b]">
                            <Trans>One Firefly account manages all your social accounts</Trans>
                        </p>
                    </div>
                    <div className="flex min-h-0 flex-1 justify-center">
                        <FireflyAccountSVG className="max-h-[350px] max-w-[286px]" />
                    </div>
                    <div className="h-12 w-full shrink-0 text-center">
                        <SquareButton
                            colorMode="dark"
                            onClick={() => {
                                dispatch?.close();
                                location.href = PageRoute.Signup;
                            }}
                        >
                            <span className="text-base font-medium text-white">
                                <Trans>Let’s go!</Trans>
                            </span>
                        </SquareButton>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

export const CreateFireflyAccountGuideModalRef = new SingletonModal<void, void>();
