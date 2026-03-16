import { EventsList } from '@/app/(event)/events/EventsList.js';
import { Agent } from '@/constants/enum.js';
import { getAgent } from '@/helpers/getAgent.js';

export default async function Page() {
    const agent = await getAgent();
    const isFireflyApp = agent === Agent.FireflyApp;

    return <EventsList isFireflyApp={isFireflyApp} />;
}
