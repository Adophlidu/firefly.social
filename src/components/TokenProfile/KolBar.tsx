import { classNames } from '@firefly/utils';
import { Plural, Trans } from '@lingui/react/macro';
import { type HTMLProps, memo } from 'react';

import { Image } from '@/components/Image.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface Props extends HTMLProps<HTMLDivElement> {
    users: Profile[];
    total?: number;
}

export const KolBar = memo<Props>(function KolBar({ users, total = 1, ...rest }) {
    const [theFirst, theSecond, theThird] = users || [];

    if (!users.length) return null;

    const remains = Math.max(users.length, total) - 3;

    return (
        <div
            {...rest}
            className={classNames(
                'flex cursor-pointer items-center gap-2 rounded-lg bg-lightBg px-[6px] py-[5px] text-medium text-main dark:bg-bg',
                rest.className,
            )}
        >
            <span className="inline-flex shrink-0 space-x-[-4px]">
                {users.slice(0, 3).map((profile) => (
                    <Image
                        width={27}
                        height={27}
                        key={profile.profileId}
                        className="box-border size-[27px] rounded-full ring-1 ring-primaryBottom"
                        src={profile.pfp}
                        alt="avatar"
                    />
                ))}
            </span>
            <span className="[&_strong]:font-bold">
                <Trans>
                    <Plural
                        value={users.length}
                        _1={
                            <>
                                <strong>{theFirst.displayName}</strong> on X mentioned this CA
                            </>
                        }
                        _2={
                            <>
                                <strong>{theFirst.displayName}</strong> and <strong>{theSecond?.displayName}</strong> on
                                X mentioned this CA
                            </>
                        }
                        _3={
                            <>
                                <strong>{theFirst.displayName},</strong> <strong>{theSecond?.displayName},</strong> and{' '}
                                <strong>{theThird?.displayName}</strong> on X mentioned this CA
                            </>
                        }
                        _4={
                            <>
                                <strong>{theFirst.displayName},</strong> <strong>{theSecond?.displayName},</strong> and{' '}
                                <strong>{theThird?.displayName}</strong> and another KOL on X mentioned this CA
                            </>
                        }
                        other={
                            <>
                                <strong>{theFirst.displayName},</strong> <strong>{theSecond?.displayName},</strong>{' '}
                                <strong>{theThird?.displayName}</strong> and {remains} other KOLs on X mentioned this CA
                            </>
                        }
                    />
                </Trans>
            </span>
        </div>
    );
});
