import React, { useState, useEffect } from 'react';
import { NostrService } from './lib/NostrService';

const nostrService = new NostrService();

const SendNote = () => {
    const [relayURL, setRelayURL] = useState('');
    const [savedRelays, setSavedRelays] = useState<string[]>([]);
    const [privateKey, setPrivateKey] = useState('');
    const [message, setMessage] = useState('');
    const [response, setResponse] = useState('');
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
    const [error, setError] = useState<string | null>(null);
    const [receivedNotes, setReceivedNotes] = useState<any[]>([]);
    const [subscription, setSubscription] = useState<any>(null);


    useEffect(() => {
        // Initialize with default relay
        setSavedRelays(['wss://ammetronics.com']);
        return () => {
            // Cleanup subscription when component unmounts
            if (subscription) {
                nostrService.unsubscribe(subscription);
            }
        };

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
        if (url === relayURL) {
            setRelayURL('');
            setConnectionStatus('disconnected');
            if (subscription) {
                nostrService.unsubscribe(subscription);
                setSubscription(null);
            }

        }
    };

    const connectRelay = async (url: string) => {
        try {
            setConnectionStatus('connecting');
            const relays = await nostrService.connect([url]);
            if (relays.length > 0) {
                setRelayURL(url);
                setConnectionStatus('connected');
                // Start subscribing to notes
                subscribeToNotes();

            }
        } catch (err: any) {
            setConnectionStatus('disconnected');
            setError('Failed to connect relay: ' + (err.message || err));
        }
    };

    const subscribeToNotes = async () => {
        try {
            if (subscription) {
                nostrService.unsubscribe(subscription);
            }

            const sub = await nostrService.subscribeToEvents([
                {
                    kinds: [1], // Text notes
                    limit: 20,  // Last 20 notes
                }
            ]);

            sub.on('event', (event: any) => {
                setReceivedNotes(prev => [event, ...prev].slice(0, 20));
            });

            setSubscription(sub);
        } catch (err: any) {
            setError('Error subscribing to notes: ' + (err.message || err));
        }
    };
    
    const sendNote = async () => {
        if (!relayURL) {
            setError('Please connect to a relay first!');
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
            // Create and sign the event
            const event = await nostrService.createAndSignEvent(1, privateKey, message, []);
            
            // Publish the event using the current relay

            if (nostrService.getCurrentRelay()) {
                await nostrService.getCurrentRelay().publish(event);
                setResponse(`Published: ${event.id}`);
                setMessage(''); // Clear message after successful send
            } else {
                throw new Error('No relay connected');
            }
        } catch (err: any) {
            setError('Error sending note: ' + (err.message || err));
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">NOSTR Notes</h1>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
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
                        className="flex-1 px-4 py-2 rounded border"
                    />
                    <button 
                        onClick={addRelay}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Add Relay
                    </button>
                </div>
                <div className="flex flex-col gap-2">
                    {savedRelays.map((url) => (
                        <div key={url} className={`flex items-center gap-4 p-4 rounded ${url === relayURL ? 'bg-blue-50' : 'bg-gray-50'}`}>
                            <span className="flex-1 text-left">{url}</span>
                            <button 
                                onClick={() => connectRelay(url)}
                                disabled={connectionStatus === 'connecting' || (url === relayURL && connectionStatus === 'connected')}
                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
                            >
                                {url === relayURL ? connectionStatus : 'Connect'}
                            </button>
                            <button 
                                onClick={() => removeRelay(url)}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
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
                    className="w-full px-4 py-2 mb-4 rounded border"
                />
                <textarea
                    placeholder="Message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-2 mb-4 rounded border h-32"
                />
                <button 
                    onClick={sendNote}
                    disabled={connectionStatus !== 'connected'}
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    Send Note
                </button>
            </div>
            
            {response && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {response}
                </div>
            )}

            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Received Notes</h3>
                <div className="space-y-4">
                    {receivedNotes.map((note, index) => (
                        <div key={note.id} className="bg-gray-50 p-4 rounded">
                            <div className="text-sm text-gray-500 mb-2">
                                From: {note.pubkey.slice(0, 8)}...
                                {' | '}
                                {formatDate(note.created_at)}
                            </div>
                            <div className="whitespace-pre-wrap">{note.content}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SendNote;
