import React, { useState, useEffect } from 'react';
import { NostrService, type PublishStatus } from './lib/NostrService';

const nostrService = new NostrService();

const SendNote = () => {
    const [relayURL, setRelayURL] = useState('');
    const [savedRelays, setSavedRelays] = useState<string[]>([]);
    const [privateKey, setPrivateKey] = useState('');
    const [message, setMessage] = useState('');
    const [response, setResponse] = useState('');
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
    const [error, setError] = useState<string | null>(null);
    const [connectedRelays, setConnectedRelays] = useState<string[]>([]);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishStatus, setPublishStatus] = useState<PublishStatus[]>([]);

    useEffect(() => {
        // Initialize with default relay
        setSavedRelays(['wss://ammetronics.com']);
    }, []);

    const addRelay = async () => {
        if (!relayURL.startsWith('wss://')) {
            setError('Relay URL must start with wss://');
            return;
        }
        if (!savedRelays.includes(relayURL)) {
            setSavedRelays([...savedRelays, relayURL]);
            setRelayURL('');
        }
    };

    const removeRelay = async (url: string) => {
        setSavedRelays(savedRelays.filter(r => r !== url));
        setConnectedRelays(connectedRelays.filter(r => r !== url));
        if (url === relayURL) {
            setRelayURL('');
            setConnectionStatus('disconnected');
        }
    };

    const connectRelay = async (url: string) => {
        try {
            setConnectionStatus('connecting');
            setError(null);
            
            const relays = await nostrService.connect([url]);
            if (relays.length > 0) {
                setConnectedRelays([...connectedRelays, url]);
                setRelayURL(url);
                setConnectionStatus('connected');
            }
        } catch (err: any) {
            setConnectionStatus('disconnected');
            setError('Failed to connect relay: ' + (err.message || err));
        }
    };

    const sendNote = async () => {
        if (connectedRelays.length === 0) {
            setError('Please connect to at least one relay first!');
            return;
        }
        if (!privateKey) {
            setError('Please enter your private key!');
            return;
        }
        if (!message) {
            setError('Please enter a message!');
            return;
        }

        try {
            setIsPublishing(true);
            setError(null);
            setPublishStatus([]);

            // Create and sign the event
            const event = await nostrService.createAndSignEvent(1, privateKey, message, [
                ['client', 'NostrContentManager'],
                ['created_at', Math.floor(Date.now() / 1000).toString()]
            ]);
            
            // Publish to all connected relays
            const results = await nostrService.publishToRelays(event, connectedRelays);
            setPublishStatus(results);

            // Check if at least one relay succeeded
            const anySuccess = results.some(result => result.success);
            if (anySuccess) {
                setResponse(`Published: ${event.id}`);
                setMessage(''); // Clear message after successful send
            } else {
                setError('Failed to publish to any relay');
            }
        } catch (err: any) {
            setError('Error sending note: ' + (err.message || err));
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Send a Note</h1>
            
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Saved Relays</h3>
                <div className="flex gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="New Relay URL (wss://...)"
                        value={relayURL}
                        onChange={(e) => setRelayURL(e.target.value)}
                        className="flex-1 px-4 py-2 rounded"
                    />
                    <button onClick={addRelay}>
                        Add Relay
                    </button>
                </div>
                <div className="flex flex-col gap-2">
                    {savedRelays.map((url) => (
                        <div key={url} className={`flex items-center gap-4 p-4 rounded ${connectedRelays.includes(url) ? 'bg-blue-50' : 'bg-gray-50'}`}>
                            <span className="flex-1 text-left">{url}</span>
                            <button 
                                onClick={() => connectRelay(url)}
                                disabled={connectionStatus === 'connecting' || connectedRelays.includes(url)}
                            >
                                {url === relayURL ? connectionStatus : connectedRelays.includes(url) ? 'Connected' : 'Connect'}
                            </button>
                            <button 
                                onClick={() => removeRelay(url)}
                                className="bg-red-500 hover:bg-red-600"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Send Message</h3>
                <input
                    type="password"
                    placeholder="Private Key (hex or nsec format)"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    className="w-full px-4 py-2 mb-4 rounded"
                />
                <textarea
                    placeholder="Message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-2 mb-4 rounded h-32"
                />
                <button 
                    onClick={sendNote}
                    disabled={isPublishing || connectedRelays.length === 0}
                    className="w-full"
                >
                    {isPublishing ? 'Publishing...' : 'Send Note'}
                </button>
            </div>
            
            {publishStatus.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">Publish Status</h3>
                    {publishStatus.map((status, index) => (
                        <div key={index} className={`p-2 mb-2 rounded ${status.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                            <span className="font-medium">{status.relay}:</span> {status.success ? 'Success' : status.message}
                        </div>
                    ))}
                </div>
            )}
            
            {response && (
                <div className="success-message">
                    <h3 className="font-semibold">Response:</h3>
                    <pre className="mt-2 text-sm">{response}</pre>
                </div>
            )}
        </div>
    );
};

export default SendNote;
