'use client';

import SearchIcon from '@dimensiondev/assets/search.svg';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo, useEffect, useMemo, useState } from 'react';

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
    onSelect: (contact: DirectMessageContact) => Promise<void>;
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
    const [selectedContactId, setSelectedContactId] = useState<string>();
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
    const hasProfileSearchError =
        profileSearch.isError &&
        debouncedSearch.trim().length >= 2 &&
        search.trim().toLowerCase() === debouncedSearch.trim().toLowerCase();

    useEffect(() => {
        if (open) return;
        setSearch('');
        setSelectedContactId(undefined);
    }, [open]);

    const handleContactSelect = async (contact: DirectMessageContact) => {
        if (selectedContactId) return;
        setSelectedContactId(contact.id);

        try {
            await onSelect(contact);
        } finally {
            setSelectedContactId(undefined);
        }
    };

    const content = (
        <div className="flex min-h-0 flex-col">
            <div className="px-4 pb-4 pt-1">
                <label className="flex h-10 items-center gap-2 rounded-md border border-line bg-lightBg px-3 text-second transition-colors focus-within:border-fireflyBrand">
                    <SearchIcon width={16} height={16} className="shrink-0" />
                    <input
                        autoFocus
                        type="search"
                        autoComplete="off"
                        spellCheck="false"
                        value={search}
                        aria-label={t`Search by name, handle, ENS or address`}
                        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-main outline-none placeholder:text-second focus:ring-0"
                        placeholder={t`Search by name, handle, ENS or address`}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </label>
            </div>

            <div className="border-b border-line px-4 pb-2">
                <span className="text-xs font-medium text-second">
                    {search ? <Trans>People</Trans> : <Trans>Recent</Trans>}
                </span>
            </div>

            <div className="no-scrollbar max-h-[360px] min-h-20 overflow-y-auto p-2">
                {isSearchingProfiles ? (
                    <div className="space-y-2 p-2">
                        {Array.from({ length: 4 }, (_, index) => (
                            <div key={index} className="h-16 animate-pulse rounded-lg bg-lightBg" />
                        ))}
                    </div>
                ) : hasProfileSearchError ? (
                    <div className="flex flex-col items-center px-6 py-10 text-center">
                        <p className="text-sm font-bold text-main">
                            <Trans>People could not be loaded</Trans>
                        </p>
                        <p className="mt-1 text-xs leading-5 text-second">
                            <Trans>Check your connection and try again.</Trans>
                        </p>
                        <button
                            type="button"
                            className="mt-4 rounded-md bg-main px-4 py-2 text-xs font-bold text-primaryBottom"
                            onClick={() => void profileSearch.refetch()}
                        >
                            <Trans>Retry</Trans>
                        </button>
                    </div>
                ) : filteredContacts.length ? (
                    filteredContacts.map((contact) => (
                        <button
                            key={contact.id}
                            type="button"
                            disabled={Boolean(selectedContactId)}
                            className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-lightBg disabled:cursor-wait disabled:opacity-60"
                            onClick={() => void handleContactSelect(contact)}
                        >
                            <ContactAvatar {...contact} />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-bold text-main">{contact.name}</span>
                                <span className="mt-0.5 block truncate text-xs text-second">{contact.handle}</span>
                            </span>
                        </button>
                    ))
                ) : (
                    <div className="flex flex-col items-center px-6 py-10 text-center">
                        <div className="grid size-12 place-items-center rounded-full bg-lightBg text-second">
                            <SearchIcon width={20} height={20} />
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

            <div className="border-t border-line px-4 py-3 text-center text-xs text-second">
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
                disableDialogClose={false}
                title={<Trans>New message</Trans>}
                className="max-h-[calc(100dvh-32px)] overflow-hidden"
                panelClassName="flex min-h-0 flex-col !p-0 !pt-0"
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
            <div className="flex max-h-[75dvh] min-h-0 flex-col overflow-hidden">
                <ModalTitle title={<Trans>New message</Trans>} onClose={onClose} />
                {content}
            </div>
        </Popover>
    );
});
