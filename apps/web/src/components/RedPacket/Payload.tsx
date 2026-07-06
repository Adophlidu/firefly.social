import { AmountProgressText } from '@/components/RedPacket/AmountProgressText.js';
import { AuthorText } from '@/components/RedPacket/AuthorText.js';
import { MessageText } from '@/components/RedPacket/MessageText.js';
import { PayloadContainer } from '@/components/RedPacket/PayloadContainer.js';
import type { ThemeGroupSettings } from '@/providers/types/FireflyRedPacket.js';
import { UsageType } from '@/types/rp.js';

interface PayloadProps {
    theme: ThemeGroupSettings;
    amount: string; // bigint in str
    from?: string;
    message: string;
    token: {
        type: 'fungible';
        symbol: string;
        decimals?: number;
    };
}

export function RedPacketPayload({ amount, token, theme, from, message }: PayloadProps) {
    return (
        <PayloadContainer theme={theme}>
            <div style={{ display: 'flex', flexDirection: 'column', rowGap: 8, maxWidth: '50%' }}>
                <MessageText theme={theme} message={message} />
                <AuthorText theme={theme} usage={UsageType.Cover} from={from} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', rowGap: 8 }}>
                <AmountProgressText theme={theme} amount={amount} token={token} />
            </div>
        </PayloadContainer>
    );
}
