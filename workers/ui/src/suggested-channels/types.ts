import type { SocialSource } from '@dimensiondev/enums';
import type { FireflyChannel } from '@dimensiondev/workers-shared/types/firefly.js';

export type { FireflyChannel };

export type SuggestedChannel = FireflyChannel & { source: SocialSource };
