export interface ENSRecord {
    name: string;
    address: string;
    registrant: string;
    owner: string;
    resolver: string;
    registrant_time: string;
    expiration_time: string;
    token_id: string;
    text_records: Record<string, string>;
}
