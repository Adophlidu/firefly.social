import { useLingui } from '@lingui/react/macro';
import { memo } from 'react';
import { Input, styled, XStack } from 'tamagui';

import { SearchIcon } from '@/icons/SearchIcon';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
}

const InputWrapper = styled(XStack, {
    height: 36,
    alignItems: 'center',
    gap: '$2',
    width: '100%',
    backgroundColor: '$bgSubdued',
    borderWidth: 1,
    borderColor: '$border',
    borderRadius: 18,
    paddingHorizontal: 8,
    flexShrink: 0,
});
const StyledInput = styled(Input, {
    unstyled: true,
    height: '100%',
    flex: 1,
    fontSize: 14,
    color: '$text',
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    outlineStyle: 'none',
    focusStyle: {
        borderWidth: 0,
        outlineWidth: 0,
        outlineStyle: 'none',
        outlineColor: 'transparent',
        boxShadow: 'none',
    },
});

export const SearchInput = memo<SearchInputProps>(function SearchInput({ value, onChange }) {
    const { i18n } = useLingui();
    return (
        <InputWrapper>
            <SearchIcon />
            <StyledInput placeholder={i18n._('rn-ui.search.placeholder')} value={value} onChangeText={onChange} />
        </InputWrapper>
    );
});
