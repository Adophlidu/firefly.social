'use client';

import SearchIcon from '@dimensiondev/assets/search.svg';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo, useMemo, useState } from 'react';

import { ContactAvatar } from '@/components/DirectMessages/ContactAvatar.js';
import type { DirectMessageContact } from '@/components/DirectMessages/types.js';
import { useDebouncedDmSearch } from '@/components/DirectMessages/useDebouncedDmSearch.js';
import { Modal } from '@/components/Modal.js';
import { ModalTitle } from '@/components/ModalTitle.js';
import { Popover } from '@/components/Popover.js';
import { resolveInitials } from '@/helpers/resolveInitials.js';
import { useDmProfileSearch } from '@/hooks/useDirectMessages.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';

interface NewMessageModalProps {
    account: string;
    contacts: DirectMessageContact[];
    open: boolean;
    onClose: () => void;
    onSelect: (contact: DirectMessageContact) => void;
}

export const NewMessageModal = memo(function NewMessageModal({
    account,
    contacts,
    open,
    onClose,
    onSelect,
}: NewMessageModalProps) {
    const isMedium = useIsMedium();
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebouncedDmSearch(search);
    const profileSearch = useDmProfileSearch(account, debouncedSearch);
    const filteredContacts = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        if (!normalizedSearch) return contacts;

        if (normalizedSearch === debouncedSearch.trim().toLowerCase() && profileSearch.data) {
            return profileSearch.data.map((profile) => {
                const name = profile.name || profile.handle;
                return {
                    id: profile.id,
                    targetUserId: profile.id,
                    name,
                    handle: profile.handle,
                    initials: resolveInitials(name),
                    avatarUrl: profile.avatar ?? undefined,
                };
            });
        }

        return contacts.filter((contact) =>
            `${contact.name} ${contact.handle}`.toLowerCase().includes(normalizedSearch),
        );
    }, [contacts, debouncedSearch, profileSearch.data, search]);
    const isSearchingProfiles =
        profileSearch.isFetching &&
        debouncedSearch.trim().length >= 2 &&
        search.trim().toLowerCase() === debouncedSearch.trim().toLowerCase();

    const content = (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="px-5 pb-4 pt-2">
                <label className="focus-within:ring-fireflyBrand/40 flex h-11 items-center gap-2.5 rounded-2xl bg-lightBg px-3.5 text-second focus-within:ring-1">
                    <SearchIcon width={17} height={17} />
                    <input
                        autoFocus
                        value={search}
                        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-main outline-none placeholder:text-second focus:ring-0"
                        placeholder={t`Search by name, handle, ENS or address`}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </label>
            </div>

            <div className="border-y border-line bg-lightBg px-5 py-2.5">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-second">
                    {search ? <Trans>People</Trans> : <Trans>Recent</Trans>}
                </span>
            </div>

            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-2">
                {isSearchingProfiles ? (
                    <div className="space-y-2 px-2 py-3">
                        {Array.from({ length: 4 }, (_, index) => (
                            <div key={index} className="h-[72px] animate-pulse rounded-[18px] bg-lightBg" />
                        ))}
                    </div>
                ) : filteredContacts.length ? (
                    filteredContacts.map((contact) => (
                        <button
                            key={contact.id}
                            type="button"
                            className="flex w-full items-center gap-3 rounded-[18px] p-3 text-left transition-colors hover:bg-lightBg"
                            onClick={() => onSelect(contact)}
                        >
                            <ContactAvatar {...contact} />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-bold text-main">{contact.name}</span>
                                <span className="mt-0.5 block truncate text-xs text-second">{contact.handle}</span>
                            </span>
                            <span className="rounded-xl border border-line px-3 py-1.5 text-xs font-bold text-main">
                                <Trans>Message</Trans>
                            </span>
                        </button>
                    ))
                ) : (
                    <div className="flex flex-col items-center px-6 py-14 text-center">
                        <div className="grid size-14 place-items-center rounded-[22px] bg-lightBg text-second">
                            <SearchIcon width={22} height={22} />
                        </div>
                        <p className="mt-4 text-sm font-bold text-main">
                            <Trans>No people found</Trans>
                        </p>
                        <p className="mt-1 max-w-64 text-xs leading-5 text-second">
                            <Trans>Try a complete Lens handle, ENS name, or wallet address.</Trans>
                        </p>
                    </div>
                )}
            </div>

            <div className="border-t border-line px-5 py-3 text-center text-[10px] text-second">
                <Trans>Messages are tied to your active Lens account.</Trans>
            </div>
        </div>
    );

    if (isMedium) {
        return (
            <Modal
                open={open}
                size="md"
                enableClose
                title={<Trans>New message</Trans>}
                className="h-[min(640px,88svh)] overflow-hidden"
                panelClassName="flex min-h-0 flex-1 flex-col p-0"
                onClose={onClose}
            >
                {content}
            </Modal>
        );
    }

    return (
        <Popover
            open={open}
            enableOverflow={false}
            dialogPanelClassName="!inset-x-3 !bottom-2 !p-0 !pt-8"
            onClose={onClose}
        >
            <div className="flex h-[min(640px,75dvh)] min-h-0 flex-col overflow-hidden">
                <ModalTitle title={<Trans>New message</Trans>} onClose={onClose} />
                {content}
            </div>
        </Popover>
    );
});
