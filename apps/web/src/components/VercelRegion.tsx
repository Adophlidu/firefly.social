'use client';

import { useEffect } from 'react';

// Storing geo in cookies attaches it to every subsequent request, re-introducing per-visitor
// cookies onto the cookieless traffic this PR keeps CDN-cacheable. localStorage gives the same
// fast-path with zero request-header footprint.
const GEO_STORAGE_KEY = '__ff_geo';
const GEO_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

interface GeoData {
    timezone: string | null;
    city: string | null;
    country: string | null;
    region: string | null;
}

interface GeoResponse {
    data?: GeoData;
}

interface StoredGeo extends GeoData {
    fetchedAt: number;
}

function readStoredGeo(): StoredGeo | null {
    try {
        const raw = localStorage.getItem(GEO_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as StoredGeo;
        if (typeof parsed?.fetchedAt !== 'number') return null;
        return parsed;
    } catch {
        // localStorage can throw in some privacy modes — degrade to fetching.
        return null;
    }
}

function writeStoredGeo(data: GeoData): void {
    try {
        const payload: StoredGeo = { ...data, fetchedAt: Date.now() };
        localStorage.setItem(GEO_STORAGE_KEY, JSON.stringify(payload));
    } catch {
        // Ignore — caching is best-effort.
    }
}

function applyGeo(data: GeoData): void {
    window.VERCEL_IP_TIMEZONE = data.timezone;
    window.VERCEL_IP_CITY = data.city;
    window.VERCEL_IP_COUNTRY = data.country;
    window.VERCEL_IP_REGION = data.region;
}

export function VercelRegion() {
    useEffect(() => {
        // Fast path: reuse a fresh cached blob without a network round-trip. A stored all-null
        // result still counts as a valid cache entry — this prevents refetching on every load in
        // environments without Vercel geo headers (e.g. local dev).
        const stored = readStoredGeo();
        if (stored && Date.now() - stored.fetchedAt < GEO_MAX_AGE) {
            applyGeo(stored);
            return;
        }

        // Telemetry enrichment must never throw — swallow any fetch/parse failure.
        fetch('/api/geo')
            .then((response) => response.json() as Promise<GeoResponse>)
            .then(({ data }) => {
                if (!data) return;
                applyGeo(data);
                writeStoredGeo(data);
            })
            .catch(() => {
                // Ignore — geo is optional telemetry enrichment.
            });
    }, []);

    return null;
}
