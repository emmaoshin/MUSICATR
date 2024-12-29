export {};

declare global {
    interface Window {
        nostr: {
            signEvent: (event: any) => Promise<string>;
            getPublicKey: () => Promise<string>;
        };
    }
}
