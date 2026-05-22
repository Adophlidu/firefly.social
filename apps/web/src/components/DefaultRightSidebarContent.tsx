import { Advertisement } from '@/components/Advertisement/index.js';
import { Calendar } from '@/components/Calendar/Calendar.js';
import { Section } from '@/components/Semantic/Section.js';
import { SuggestedChannels } from '@/components/SuggestedChannels/SuggestedChannels.js';
import { SuggestedFollows } from '@/components/SuggestedFollows/SuggestedFollows.js';
import { WithinDiscover } from '@/components/WithinDiscover.js';

export function DefaultRightSidebarContent() {
    return (
        <>
            <Section title="Advertisement" className="mt-[26px]">
                <Advertisement />
            </Section>
            <WithinDiscover
                otherwise={
                    <>
                        <SuggestedFollows />
                        <SuggestedChannels />
                    </>
                }
            >
                <Section title="Web3 Calendar">
                    <Calendar />
                </Section>
            </WithinDiscover>
        </>
    );
}
