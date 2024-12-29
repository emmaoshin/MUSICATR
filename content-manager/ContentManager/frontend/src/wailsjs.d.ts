interface Window {
    go: {
        main: {
            RelayHandler: {
                GetSavedRelays(): Promise<string[]>;
                AddRelay(url: string): Promise<void>;
                RemoveRelay(url: string): Promise<void>;
                ConnectRelay(url: string): Promise<void>;
                SendNote(privateKey: string, message: string): Promise<string>;
            }
        }
    }
} 