import CheckIcon from '@dimensiondev/assets/check.svg';
import CopyIcon from '@dimensiondev/assets/copy-2.svg';
import EyeSlashIcon from '@dimensiondev/assets/eye-slash.svg';
import KeyIcon from '@dimensiondev/assets/key.svg';
import SecurityIcon from '@dimensiondev/assets/security.svg';
import WarningIcon from '@dimensiondev/assets/warning.svg';
import { Trans } from '@lingui/react/macro';
import { useSignMessage } from '@privy-io/react-auth';
import { useState } from 'react';
import { useAsyncFn } from 'react-use';

import {
    DialogOrDrawer,
    DialogOrDrawerContent,
    DialogOrDrawerHeader,
    DialogOrDrawerTitle,
} from '@/components/DialogOrDrawer.js';
import { Button } from '@/components/ui/button.js';
import type { RouteModalProps } from '@/configs/modalRoutes.js';
import { useCopyText } from '@/hooks/useCopyText.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

function ExportPrivateKeyResult({ privateKey }: { privateKey: string }) {
    const [copied, handleCopy] = useCopyText('');
    return (
        <div className="flex h-[252px] flex-col items-center justify-center gap-6">
            <div className="flex items-center gap-2">
                <WarningIcon className="text-danger" width={24} height={24} />
                <p className="text-danger text-sm font-semibold">
                    <Trans>Keep it safe and do not share</Trans>
                </p>
            </div>
            <div
                className="cursor-pointer break-all rounded-2xl border px-6 py-3 text-center text-sm font-semibold"
                onClick={() => handleCopy(privateKey)}
                role="button"
            >
                {privateKey}
            </div>
            <div className="flex cursor-pointer items-center gap-2" onClick={() => handleCopy(privateKey)}>
                {copied ? <CheckIcon width={16} height={16} /> : <CopyIcon width={16} height={16} />}
                <span className="text-second text-sm font-semibold">
                    {copied ? <Trans>Copied</Trans> : <Trans>Copy to clipboard</Trans>}
                </span>
            </div>
        </div>
    );
}

export function ExportKeyModalWrapper({ modalType, open, onClose }: RouteModalProps) {
    const [confirmed, setConfirmed] = useState(false);
    const { signMessage } = useSignMessage();
    const [privateKey, setPrivateKey] = useState('');

    const [{ loading: exporting }, exportPrivateKey] = useAsyncFn(async () => {
        const message = `Export Polymarket Private Key ${Date.now()}`;
        const { signature } = await signMessage(
            { message },
            {
                uiOptions: { showWalletUIs: false },
            },
        );
        const pk = await getFireflyEndpoint().exportPolymarketPrivateKey(message, signature);
        return pk;
    }, [signMessage]);

    return (
        <DialogOrDrawer open={open} onOpenChange={(isOpen) => !isOpen && onClose(modalType)}>
            <DialogOrDrawerContent>
                <div className="flex w-full flex-col">
                    <DialogOrDrawerHeader className="shrink-0 !flex-row">
                        <DialogOrDrawerTitle className="flex justify-start">
                            <Trans>Your Private Key</Trans>
                        </DialogOrDrawerTitle>
                    </DialogOrDrawerHeader>
                    <div className="flex min-h-0 grow flex-col gap-6">
                        {confirmed && !exporting ? (
                            <>
                                <ExportPrivateKeyResult privateKey={privateKey} />
                                <Button
                                    className="font-bold"
                                    onClick={() => onClose(modalType)}
                                    variant="primary"
                                    rounded
                                >
                                    <Trans>Done</Trans>
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col items-center gap-2">
                                    <SecurityIcon width={60} height={60} />
                                    <p className="text-second mt-4">
                                        <Trans>Keep Your Recovery Phrase Safe</Trans>
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <KeyIcon width={24} height={24} className="shrink-0" />
                                            <p className="text-main text-sm font-semibold">
                                                <Trans>Your recovery phrase is like a password, keep it secret.</Trans>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <EyeSlashIcon width={24} height={24} className="shrink-0" />
                                            <p className="text-main text-sm font-semibold">
                                                <Trans>
                                                    If you enter it in another app, it can steal your funds and
                                                    Farcaster account.
                                                </Trans>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <WarningIcon width={24} height={24} className="shrink-0" />
                                            <p className="text-main text-sm font-semibold">
                                                <Trans>
                                                    We do not recommend ever sharing it with any app or person.
                                                </Trans>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    className="font-bold"
                                    onClick={async () => {
                                        setConfirmed(true);
                                        const pk = await exportPrivateKey();
                                        if (pk) setPrivateKey(pk);
                                    }}
                                    variant="danger"
                                    rounded
                                    loading={exporting}
                                    disabled={exporting}
                                >
                                    <Trans>I understand</Trans>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </DialogOrDrawerContent>
        </DialogOrDrawer>
    );
}
