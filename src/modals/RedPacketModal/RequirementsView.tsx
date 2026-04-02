import InfoIcon from '@dimensiondev/assets/info.svg';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { getEnumAsArray } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useRouter } from '@tanstack/react-router';
import { memo, useContext } from 'react';

import { ActionButton } from '@/components/ActionButton.js';
import { REQUIREMENT_ICON_MAP, REQUIREMENT_TITLE_MAP } from '@/modals/RedPacketModal/common.js';
import { RedPacketContext } from '@/modals/RedPacketModal/RedPacketContext.js';
import { RequirementType } from '@/providers/types/FireflyRedPacket.js';

export default memo(function RequirementsView() {
    const { history } = useRouter();
    const { rules, setRules, setRequireCollections, setRequireTokens, token } = useContext(RedPacketContext);

    return (
        <>
            <div className="flex flex-1 flex-col gap-y-4 bg-primaryBottom px-4 py-2">
                <div className="flex gap-x-[6px] rounded-[4px] bg-bg p-3">
                    <InfoIcon width={20} height={20} />
                    <div className="flex flex-col gap-2.5 text-start text-[13px] leading-[18px]">
                        <div>
                            <Trans>You can set one or multiple rules to be eligible to win a Lucky Drop.</Trans>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex max-w-[568px] flex-col gap-2">
                    {getEnumAsArray(RequirementType).map(({ value }) => {
                        const checked = rules.includes(value);
                        const Icon = REQUIREMENT_ICON_MAP[value];
                        const title = REQUIREMENT_TITLE_MAP[value];

                        if (value === RequirementType.NFTHolder) return null;

                        const item = (
                            <div className="flex items-center gap-x-2 px-3 py-1" key={value}>
                                <Icon width={20} height={20} />
                                <div className="flex-1 text-start font-bold">{title}</div>
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    className="size-5 cursor-pointer rounded-[4px] text-highlight"
                                    onChange={(event) => {
                                        const checked = event.currentTarget.checked;
                                        setRules(checked ? [...rules, value] : rules.filter((x) => x !== value));
                                        if (!checked) return;
                                    }}
                                />
                            </div>
                        );

                        if (!checked) return item;
                        return item;
                    })}
                </div>

                <div className="flex justify-end">
                    <div
                        className="cursor-pointer text-base font-bold leading-5 text-highlight"
                        onClick={() => {
                            setRules(EMPTY_LIST);
                            setRequireTokens(EMPTY_LIST);
                            setRequireCollections(EMPTY_LIST);
                        }}
                    >
                        <Trans>Clear all requirements</Trans>
                    </div>
                </div>
            </div>
            <div className="grow" />
            <div className="w-full bg-lightBottom80 p-4 shadow-primary backdrop-blur-lg dark:shadow-primaryDark">
                <ActionButton className="rounded-lg" onClick={() => history.push('/confirm')}>
                    <Trans>Next</Trans>
                </ActionButton>
            </div>
        </>
    );
});
