import { ClubTypeTab } from '@/components/Search/CommunityTypeTab.js';
import { SearchSources } from '@/components/Search/SearchSources.js';
import { SearchTabs } from '@/components/Search/SearchTabs.js';

export default function SubNav() {
    return (
        <>
            <SearchTabs />
            <ClubTypeTab />
            <SearchSources />
        </>
    );
}
