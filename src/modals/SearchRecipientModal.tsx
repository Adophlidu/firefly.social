import { useState } from 'react';

import type { RecipientItemProps } from '@/components/SendTransactionModal/RecipientItem.js';
import { SelectRecipientModalWithQuery } from '@/components/SendTransactionModal/SelectRecipientModalWithQuery.js';
import type { NetworkType } from '@/constants/enum.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';

export interface SearchRecipientModalOpenProps {
    keyword?: string;
    networkType?: NetworkType;
}

type Props = {
    ref: React.Ref<SingletonModalRefCreator<SearchRecipientModalOpenProps | void, RecipientItemProps>>;
};

export function SearchRecipientModal({ ref }: Props) {
    const [keyword, setKeyword] = useState('');
    const [networkType, setNetworkType] = useState<NetworkType | undefined>(undefined);
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen(props) {
            if (props?.keyword) setKeyword(props.keyword);
            if (props?.networkType) setNetworkType(props.networkType);
        },
        onClose() {
            setKeyword('');
        },
    });

    return (
        <SelectRecipientModalWithQuery
            open={open}
            keyword={keyword}
            networkType={networkType}
            onClose={() => dispatch?.abort?.(new Error(`User closed`))}
            onSelect={(item) => dispatch?.close(item)}
        />
    );
}
