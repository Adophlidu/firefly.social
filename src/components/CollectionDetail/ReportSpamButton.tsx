'use client';

import ReportSpamIcon from '@/assets/report-spam.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { useReportSpamNFT } from '@/hooks/useReportSpamNFT.js';

export function ReportSpamButton(props: { collectionId: string }) {
    const { collectionId } = props;
    const [, reportSpamNFT] = useReportSpamNFT();
    return (
        <ClickableButton className="ml-auto cursor-pointer text-lightMain" onClick={() => reportSpamNFT(collectionId)}>
            <ReportSpamIcon className="size-6" />
        </ClickableButton>
    );
}
