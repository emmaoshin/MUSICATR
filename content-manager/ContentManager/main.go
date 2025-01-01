package main

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/nbd-wtf/go-nostr"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

type RelayHandler struct {
	relay       *nostr.Relay
	SavedRelays []string
	configPath  string
}

func NewRelayHandler() *RelayHandler {
	handler := &RelayHandler{
		SavedRelays: []string{"wss://ammetronics.com"},
		configPath:  "relays.json",
	}
	handler.LoadRelays()
	return handler
}

func (r *RelayHandler) LoadRelays() error {
	data, err := os.ReadFile(r.configPath)
	if err != nil {
		if os.IsNotExist(err) {
			return r.SaveRelays() // Save default relays if file doesn't exist
		}
		return err
	}
	return json.Unmarshal(data, &r.SavedRelays)
}

func (r *RelayHandler) SaveRelays() error {
	data, err := json.Marshal(r.SavedRelays)
	if err != nil {
		return err
	}
	return os.WriteFile(r.configPath, data, 0644)
}

func (r *RelayHandler) AddRelay(url string) error {
	// Check if relay already exists
	for _, relay := range r.SavedRelays {
		if relay == url {
			return nil
		}
	}
	r.SavedRelays = append(r.SavedRelays, url)
	return r.SaveRelays()
}

func (r *RelayHandler) RemoveRelay(url string) error {
	for i, relay := range r.SavedRelays {
		if relay == url {
			r.SavedRelays = append(r.SavedRelays[:i], r.SavedRelays[i+1:]...)
			return r.SaveRelays()
		}
	}
	return nil
}

func (r *RelayHandler) GetSavedRelays() []string {
	return r.SavedRelays
}

func (r *RelayHandler) ConnectRelay(url string) error {
	relay, err := nostr.RelayConnect(context.Background(), url)
	if err != nil {
		return err
	}
	r.relay = relay
	return nil
}

func (r *RelayHandler) SubscribeToRelay(filters []map[string]interface{}) ([]nostr.Event, error) {
	if r.relay == nil {
		return nil, fmt.Errorf("no relay connected")
	}

	// Convert the filters from map to nostr.Filter
	var nostrFilters []nostr.Filter
	for _, f := range filters {
		filter := nostr.Filter{}
		if kinds, ok := f["kinds"].([]interface{}); ok {
			for _, k := range kinds {
				if kind, ok := k.(float64); ok {
					filter.Kinds = append(filter.Kinds, int(kind))
				}
			}
		}
		if limit, ok := f["limit"].(float64); ok {
			filter.Limit = int(limit)
		}
		if since, ok := f["since"].(float64); ok {
			ts := nostr.Timestamp(since)
			filter.Since = &ts
		}
		if until, ok := f["until"].(float64); ok {
			ts := nostr.Timestamp(until)
			filter.Until = &ts
		}
		if authors, ok := f["authors"].([]interface{}); ok {
			for _, a := range authors {
				if author, ok := a.(string); ok {
					filter.Authors = append(filter.Authors, author)
				}
			}
		}
		nostrFilters = append(nostrFilters, filter)
	}

	// Create subscription
	sub, err := r.relay.Subscribe(context.Background(), nostrFilters)
	if err != nil {
		return nil, fmt.Errorf("error subscribing to relay: %v", err)
	}

	// Collect events for 2 seconds
	events := make([]nostr.Event, 0)
	timeout := time.After(2 * time.Second)

	for {
		select {
		case ev := <-sub.Events:
			events = append(events, *ev)
		case <-timeout:
			sub.Unsub()
			return events, nil
		}
	}
}

func (r *RelayHandler) SendNote(privateKey, message string) (string, error) {
	// Clean up the private key
	privateKey = strings.TrimSpace(privateKey)

	// Try to decode as bech32 if it starts with nsec
	if strings.HasPrefix(privateKey, "nsec") {
		decoded, err := nostr.GetPublicKey(privateKey)
		if err != nil {
			return "", fmt.Errorf("invalid nsec format: %v", err)
		}
		privateKey = decoded
	}

	// Generate public key from private key
	pub, err := nostr.GetPublicKey(privateKey)
	if err != nil {
		return "", fmt.Errorf("error getting public key: %v", err)
	}

	// Create event
	event := nostr.Event{
		PubKey:    pub,
		CreatedAt: nostr.Timestamp(time.Now().Unix()),
		Kind:      1,
		Tags:      []nostr.Tag{},
		Content:   message,
	}

	// Sign event
	err = event.Sign(privateKey)
	if err != nil {
		return "", fmt.Errorf("error signing event: %v", err)
	}

	// Verify event before publishing
	ok, err := event.CheckSignature()
	if err != nil {
		return "", fmt.Errorf("error checking signature: %v", err)
	}
	if !ok {
		return "", fmt.Errorf("invalid signature")
	}

	// Publish event
	err = r.relay.Publish(context.Background(), event)
	if err != nil {
		return "", fmt.Errorf("error publishing event: %v", err)
	}

	return fmt.Sprintf("Published: %v", event.ID), nil
}

func main() {
	relayHandler := NewRelayHandler()

	err := wails.Run(&options.App{
		Title:  "Content Manager",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		Bind: []interface{}{
			relayHandler,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
