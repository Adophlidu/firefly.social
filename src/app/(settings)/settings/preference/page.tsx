'use client';

import { Trans } from '@lingui/react/macro';

import { SettingsSection } from '@/app/(settings)/components/Section.js';
import { Switch } from '@/components/Switch/index.js';
import { useToggleEnableTruthSocial } from '@/hooks/useToggleEnableTruthSocial.js';

export default function PreferencePage() {
    const { enable, mutation, isMutating } = useToggleEnableTruthSocial();

    return (
        <SettingsSection title={<Trans>Content preference</Trans>}>
            <div className="relative w-full">
                <div className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">
                    <div className="min-w-0 flex-1 truncate">
                        <p className="text-base font-bold text-main">
                            <Trans>Truth Social</Trans>
                        </p>
                        <p className="mt-1 text-medium text-second">
                            <Trans>Posts from Trump on Truth Social (Explore, profile)</Trans>
                        </p>
                    </div>
                    <Switch
                        disabled={isMutating}
                        checked={enable}
                        loading={isMutating}
                        onChange={() => {
                            mutation.mutate();
                        }}
                    />
                </div>
            </div>
        </SettingsSection>
    );
}
