import "websocket-polyfill";
import {
    relayInit,
    generatePrivateKey,
    getPublicKey,
    type Relay,
    type Event as NostrEvent,
    SimplePool,
    nip19,
    finishEvent,
    type Filter
} from "nostr-tools";
import sha256 from "crypto-js/sha256";
import Hex from "crypto-js/enc-hex";

export enum Kind {
    Metadata = 0,
    Text = 1,
    RecommendRelay = 2,
    Contacts = 3,
    EncryptedDirectMessage = 4,
    EventDeletion = 5,
    Reaction = 7,
    ChannelCreation = 40,
    ChannelMetadata = 41,
    ChannelMessage = 42,
    ChannelHideMessage = 43,
    ChannelMuteUser = 44,
}

export type Event = NostrEvent & {
    kind: Kind;
};

export type PublishStatus = {
    success: boolean;
    relay: string;
    message?: string;
};

export class NostrService {
    private pool: SimplePool;
    private relays: Map<string, Relay>;
    private connectionTimeouts: Map<string, NodeJS.Timeout>;
    private readonly TIMEOUT_MS = 5000; // 5 seconds timeout

    constructor() {
        this.pool = new SimplePool();
        this.relays = new Map();
        this.connectionTimeouts = new Map();
    }

    /**
     * Connects to the specified relay URLs and returns an array of relay connections.
     * Includes timeout and retry logic.
     * @param relayUrls Array of relay URLs to connect to.
     * @returns A promise resolving to an array of relays.
     */
    async connect(relayUrls: string[]) {
        console.debug('Connecting to relays:', relayUrls);
        
        const results = await Promise.allSettled(
            relayUrls.map(url => this.connectToRelay(url))
        );

        const successfulRelays = results
            .filter((result): result is PromiseFulfilledResult<Relay> => result.status === 'fulfilled')
            .map(result => result.value);

        if (successfulRelays.length === 0) {
            throw new Error('Failed to connect to any relays');
        }

        return successfulRelays;
    }

    /**
     * Connects to a single relay with timeout and error handling
     * @param url The relay URL to connect to
     * @returns A promise resolving to a relay connection
     */
    private async connectToRelay(url: string): Promise<Relay> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Connection timeout for relay: ${url}`));
            }, this.TIMEOUT_MS);

            try {
                const relay = relayInit(url);
                
                relay.on('connect', () => {
                    console.debug(`Connected to relay: ${url}`);
                    clearTimeout(timeout);
                    this.relays.set(url, relay);
                    resolve(relay);
                });

                relay.on('error', () => {
                    console.error(`Relay error (${url})`);
                    clearTimeout(timeout);
                    this.relays.delete(url);
                    reject(new Error(`Failed to connect to relay: ${url}`));
                });

                relay.on('notice', (notice) => {
                    console.debug(`Relay notice (${url}):`, notice);
                });

                relay.on('disconnect', () => {
                    console.debug(`Disconnected from relay: ${url}`);
                    this.relays.delete(url);
                });

                relay.connect();
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }

    /**
     * Publishes an event to multiple relays with status tracking
     * @param event The event to publish
     * @param relayUrls The relay URLs to publish to
     * @returns Array of publish statuses
     */
    async publishToRelays(event: Event, relayUrls: string[]): Promise<PublishStatus[]> {
        const publishPromises = relayUrls.map(url => this.publishToRelay(event, url));
        const results = await Promise.allSettled(publishPromises);
        
        return results.map((result, index) => ({
            success: result.status === 'fulfilled' && result.value,
            relay: relayUrls[index],
            message: result.status === 'rejected' ? result.reason.message : undefined
        }));
    }

    /**
     * Publishes an event to a single relay
     * @param event The event to publish
     * @param relayUrl The relay URL to publish to
     * @returns Promise<boolean> indicating success
     */
    private async publishToRelay(event: Event, relayUrl: string): Promise<boolean> {
        const relay = this.relays.get(relayUrl);
        if (!relay) {
            throw new Error(`Not connected to relay: ${relayUrl}`);
        }

        try {
            const pub = relay.publish(event);
            return new Promise((resolve, reject) => {
                pub.on('ok', () => {
                    console.debug(`Event published successfully to ${relayUrl}`);
                    resolve(true);
                });

                pub.on('failed', (reason) => {
                    console.error(`Failed to publish to ${relayUrl}:`, reason);
                    reject(new Error(`Relay rejected event: ${reason}`));
                });

                // Add timeout for publish
                setTimeout(() => {
                    reject(new Error(`Publish timeout for relay: ${relayUrl}`));
                }, this.TIMEOUT_MS);
            });
        } catch (error) {
            console.error(`Error publishing to ${relayUrl}:`, error);
            throw error;
        }
    }

    /**
     * Creates and signs a new NOSTR event with metadata
     * @param kind The kind of the event
     * @param privateKey The private key of the creator
     * @param content The content of the event
     * @param tags Additional tags for the event
     * @returns The created and signed event
     */
    async createAndSignEvent(
        kind: number,
        privateKey: string,
        content: string,
        tags: string[][] = []
    ): Promise<Event> {
        try {
            console.debug('Creating event...');
            const hexKey = this.validateAndFormatKey(privateKey);
            const publicKey = getPublicKey(hexKey);
            
            // Add default tags
            const enrichedTags = [
                ...tags,
                ['client', 'NostrContentManager'],
                ['created_at', Math.floor(Date.now() / 1000).toString()]
            ];
            
            const event = this.createEvent(kind, publicKey, content, enrichedTags);
            console.debug('Signing event...');
            const signedEvent = finishEvent(event, hexKey);
            console.debug('Event created and signed:', signedEvent);
            
            return signedEvent as Event;
        } catch (err) {
            console.error('Error creating event:', err);
            throw err;
        }
    }

    /**
     * Subscribe to events from the relay
     * @param filter The filter to apply to the subscription
     * @returns A subscription object
     */
    subscribe(filter: any) {
        if (!this.currentRelay) {
            throw new Error('No relay connected');
        }

        const sub = this.currentRelay.sub([{
            ...filter,
            since: Math.floor(Date.now() / 1000) - (24 * 60 * 60) // Last 24 hours
        }]);

        return sub;
    }

    /**
     * Generates a private key
     * @returns A new private key
     */
    genPrivateKey(): string {
        return generatePrivateKey();
    }

    /**
     * Validates and formats a private key
     * @param key The key to validate
     * @returns The formatted hex key
     */
    private validateAndFormatKey(key: string): string {
        // Remove whitespace
        key = key.trim();

        try {
            // If it's an nsec key, decode it to hex
            if (key.startsWith('nsec')) {
                const { type, data } = nip19.decode(key);
                if (type === 'nsec') {
                    return data as string;
                }
            }

            // If it's already a hex string, validate it
            const hexRegex = /^[0-9a-fA-F]{64}$/;
            if (hexRegex.test(key)) {
                return key;
            }

            throw new Error('Invalid private key format');
        } catch (err) {
            throw new Error('Invalid private key format. Must be a 64-character hex string or nsec format.');
        }
    }

    /**
     * Generates a public key from a private key.
     * @param privateKey The private key.
     * @returns The corresponding public key.
     */
    genPublicKey(privateKey: string): string {
        const formattedKey = this.validateAndFormatKey(privateKey);
        return getPublicKey(formattedKey);
    }

    /**
     * Creates a new NOSTR event.
     * @param kind The kind of the event.
     * @param publicKey The public key of the creator.
     * @param content The content of the event.
     * @param tags Additional tags for the event.
     * @returns The created event.
     */
    createEvent(kind: number, publicKey: string, content: string, tags: string[][]): Event {
        const event: Event = {
            kind: kind as Kind,
            pubkey: publicKey,
            created_at: Math.floor(Date.now() / 1000),
            content,
            tags,
            id: '',
            sig: ''
        };

        return event;
    }

    /**
     * Adds the signature to a NOSTR event.
     * @param event The event to sign.
     * @param privateKey The private key to sign with.
     * @returns The signed event.
     */
    async signEvent(event: Event, privateKey: string): Promise<Event> {
        const formattedKey = this.validateAndFormatKey(privateKey);
        event.id = this.getEventHash(event);
        event.sig = await window.nostr.signEvent(event, formattedKey);
        console.log("Signed event:", event);
        return event;
    }

    /**
     * Serializes an event into a format suitable for hashing.
     * @param event The event to serialize.
     * @returns The serialized event.
     */
    private serializeEvent(event: Event): string {
        return JSON.stringify([
            0,
            event.pubkey,
            event.created_at,
            event.kind,
            event.tags,
            event.content,
        ]);
    }

    /**
     * Calculates the hash of an event.
     * @param event The event to hash.
     * @returns The hash of the event as a hex string.
     */
    private getEventHash(event: Event): string {
        return sha256(this.serializeEvent(event)).toString(Hex);
    }
}
