import { BetsProfileDetailContent } from '@/components/Bets/BetsProfileDetailContent.js';
import { BetsPlatform } from '@/constants/enum.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props
    extends NextPageProps<{
        address: string;
    }> {}

export default async function OpinionProfilePage(props: Props) {
    const { address } = await props.params;

    return <BetsProfileDetailContent address={address} platform={BetsPlatform.Opinion} />;
}
