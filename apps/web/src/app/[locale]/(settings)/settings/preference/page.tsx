'use client';

import { ExploreSwitchType } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';

import { SettingsSection } from '@/app/[locale]/(settings)/components/Section.js';
import { Switch } from '@/components/Switch/index.js';
import { useExploreDataSwitchConfig } from '@/hooks/useExploreDataSwitchConfig.js';

export default function PreferencePage() {
    const { loading, status, toggleSwitch } = useExploreDataSwitchConfig(ExploreSwitchType.TruthSocial);

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
                        disabled={loading}
                        checked={status}
                        loading={loading}
                        onChange={() => {
                            toggleSwitch(!status);
                        }}
                        className="group inline-flex h-[22px] w-11 items-center rounded-full bg-second transition data-[checked]:bg-highlight dark:bg-bg data-[checked]:dark:bg-highlight"
                    />
                </div>
            </div>
        </SettingsSection>
    );
}
