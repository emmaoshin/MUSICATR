import "websocket-polyfill";
import {
    relayInit,
    generatePrivateKey,
    getPublicKey,
    type Relay,
    type Event as NostrEvent,
    SimplePool,
    nip19,
    finishEvent
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

export class NostrService {
    private pool: SimplePool;
    private currentRelay: Relay | null;

    constructor() {
        this.pool = new SimplePool();
        this.currentRelay = null;
    }

    /**
     * Connects to the specified relay URLs and returns an array of relay connections.
     * @param relayUrls Array of relay URLs to connect to.
     * @returns A promise resolving to an array of relays.
     */
    async connect(relayUrls: string[]) {
        console.log('Connecting to relays:', relayUrls);
        try {
            const relays = await Promise.all(
                relayUrls.map(async (url) => {
                    const relay = relayInit(url);
                    await relay.connect();
                    
                    relay.on('connect', () => {
                        console.log(`Connected to relay: ${url}`);
                    });

                    relay.on('error', () => {
                        console.error(`Relay error (${url})`);
                    });

                    relay.on('notice', () => {
                        console.log(`Relay notice (${url})`);
                    });

                    return relay;
                })
            );
            this.currentRelay = relays[0];
            return relays;
        } catch (error) {
            console.error('Error connecting to relays:', error);
            throw error;
        }
    }

    /**
     * Gets the current relay connection.
     * @returns The current relay or null if not connected.
     */
    getCurrentRelay(): Relay | null {
        return this.currentRelay;
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
     * Creates and signs a new NOSTR event.
     * @param kind The kind of the event.
     * @param privateKey The private key of the creator.
     * @param content The content of the event.
     * @param tags Additional tags for the event.
     * @returns The created and signed event.
     */
    async createAndSignEvent(kind: number, privateKey: string, content: string, tags: string[][]): Promise<Event> {
        try {
            const hexKey = this.validateAndFormatKey(privateKey);
            const publicKey = getPublicKey(hexKey);
            
            const event = this.createEvent(kind, publicKey, content, tags);
            const signedEvent = finishEvent(event, hexKey);
            
            return signedEvent as Event;
        } catch (err) {
            console.error('Error creating event:', err);
            throw err;
        }
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
     * Subscribes to events from the current relay based on the provided filters.
     * @param filters Array of filters to apply to the subscription.
     * @returns A subscription object that emits events.
     */
    async subscribeToEvents(filters: { kinds?: number[], limit?: number, since?: number, until?: number, authors?: string[] }[]) {
        if (!this.currentRelay) {
            throw new Error('No relay connected');
        }

        const sub = this.currentRelay.sub(filters);

        sub.on('event', (event: Event) => {
            console.log('Received event:', event);
        });

        sub.on('eose', () => {
            console.log('End of stored events');
        });

        return sub;
    }

    /**
     * Unsubscribes from a subscription.
     * @param sub The subscription to unsubscribe from.
     */
    unsubscribe(sub: any) {
        if (sub) {
            sub.unsub();
        }
    }
}
