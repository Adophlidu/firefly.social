import { safeUnreachable } from '@firefly/utils';
import { Trans } from '@lingui/react/macro';

import { RestrictionType } from '@/constants/enum.js';

interface ReplyRestrictionTextProps {
    type: RestrictionType;
}

export function ReplyRestrictionText({ type }: ReplyRestrictionTextProps) {
    switch (type) {
        case RestrictionType.Everyone:
            return <Trans>Everyone can reply</Trans>;
        case RestrictionType.OnlyPeopleYouFollow:
            return <Trans>Only people you follow</Trans>;
        case RestrictionType.YouFollower:
            return <Trans>Only people who follow you</Trans>;
        case RestrictionType.MentionedProfiles:
            return <Trans>Only people you mention</Trans>;
        case RestrictionType.Nobody:
            return <Trans>No one can reply</Trans>;
        default:
            safeUnreachable(type);
            return null;
    }
}
