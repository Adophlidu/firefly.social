import { Agent } from '@atproto/api';

import { SessionManager } from '@/providers/bsky/SessionManager.js';

export function createPublicBskyAgent(serviceUrl: string | URL) {
    return new Agent(serviceUrl);
}

// ! This agent is based on profile store
export function createSessionBskyAgent() {
    return new Agent(new SessionManager());
}
