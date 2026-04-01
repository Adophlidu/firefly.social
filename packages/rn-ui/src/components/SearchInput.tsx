import { memo } from 'react';
import { Input, styled, XStack } from 'tamagui';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
}

const StyledInput = styled(Input, {
    height: 36,
    width: '100%',
    backgroundColor: '#F8F7F9',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 18,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#171717',
});

export const SearchInput = memo<SearchInputProps>(function SearchInput({ value, onChange }) {
    return (
        <XStack alignItems="center" gap="$2" height={36}>
            <StyledInput placeholder="Search" value={value} onChangeText={onChange} />
        </XStack>
    );
});
