# Drumie WebSocket Implementation Guide

## Overview

SDK for real-time WebSocket communication with Drumie in the browser.

## Understand the Integration Flow

Client  
→ Fetch connection token  
   (Include `channels` field: a list of channels the user is allowed to subscribe to)  

→ Open WebSocket connection  

→ Fetch subscribe token  
   (Subscription is only allowed if the requested channel is included in the original `channels` list)  

→ Subscribe to channel(s)

## Install

SDK can be installed via `npm`:

```bash
npm install drumie
```

And then in your project:

```javascript
import Drumie from 'drumie';
```

In browser, you can import SDK from CDN:

```html
<script src="https://unpkg.com/drumie@latest/dist/drumie.js"></script>
```

Or

```html
<script src="https://cdn.jsdelivr.net/gh/drumie/drumie@master/dist/drumie.js"></script>
```

And then in your project:

```javascript
const Drumie = new Drumie(...);
```

## Quick start

[Examples](https://github.com/drumie/drumie/tree/master/examples)

The basic usage example may look like this:

```javascript
const prefix = "wss://***.com"
const apiPrefix = "https://***.com/api"
const connectionString = `${prefix}/connect`
let connectionToken
let drumie
const getConnectToken = (channel) => {
  return async () => {
    try {
      const res = await fetch(`${apiPrefix}/connect-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: "1",
          name: "John Doe",
          channels: channel
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch token");
      }

      const data = await res.json();
      connectionToken = data.token
      return data.token;
    } catch (err) {
      console.error("Error fetching token:", err);
      throw err;
    }
  }
}

const getSubscribeToken = (channel) => {
  return async () => {
    try {
      const res = await fetch(`${apiPrefix}/subscribe-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: connectionToken,
          channel: channel
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch token");
      }

      const data = await res.json();
      return data.token;
    } catch (err) {
      console.error("Error fetching token:", err);
      throw err;
    }
  }
}

const channels = [
  {
    name: "channel",
    token: getSubscribeToken("channel"),
    callbacks: {
      subscribing: (ctx) => console.log("subscribing to channel", ctx),
      subscribed: (ctx) => console.log("Subscribed to channel", ctx),
      join: (ctx) => console.log("User joined channel", ctx),
      leave: (ctx) => console.log("User left channel", ctx),
      listen: (ctx) => console.log("listen in channel", ctx)
    }
  },
]

drumie = new Drumie(connectionString, {
  connecting: (ctx) => console.log(`connecting: ${ctx.code}, ${ctx.reason}`),
  connected: (ctx) => console.log(`connected over ${ctx.transport}`),
  disconnected: (ctx) => console.log(`disconnected: ${ctx.code}, ${ctx.reason}`),
  token: getConnectToken("*"),
}, channels);

drumie.subscribe()
```

## Channel Configuration

The application supports multiple channels with individual token authentication:

### Channel Structure
```javascript
{
  name: "channel",
  token: async () => {
    // Fetch subscribe token
  },
  callbacks: {
    subscribing: (ctx) => console.log("subscribing", ctx),
    subscribed: (ctx) => console.log("Subscribed", ctx),
    join: (ctx) => console.log("User joined", ctx),
    leave: (ctx) => console.log("User left", ctx),
    listen: (ctx) => console.log("listen", ctx)
  }
}
```

## Authentication & Authorization

### Connection Token
The main connection token is obtained from:
```text
POST https://***.com/api/connect-token
```

**Request Body:**
```text
{
  "id": "1",              
  "name": "John Doe",     
  "channels": "*"      
  // optional: you can add other custom fields if needed
}
```

- The fields id, name, and channels are required.
- You can also include additional optional fields as needed for your use case.

**`channels` options:**
- `"channel"` - Access to `channel` channel only
- `"customer admin"` - Access to `customer` and `admin` channels only
- `"*"` - Access to all channels

### Channel Subscription Tokens
Individual channel tokens are fetched from:
```text
POST https://***.com/api/subscribe-token
```

**Request Body:**
```json
{
  "token": "connection_token",
  "channel": "channel_name"
}
```

### Subscribe to Channels
```javascript
drumie.subscribe()
```

### Get Specific Channel
```javascript
const channel = drumie.getChannel("channel")
```

### Receive messages from a specific channel.
```javascript
{
  name: "channel",
  token: async () => {
    // Fetch subscribe token
  },
  // Receive messages from a specific channel.
  callbacks: {
    listen: (ctx) => console.log("listen", ctx)
  }
}
```

### Client Publish Messages
```javascript
// Simple message
channel.publish(`publish`)

// Object message (commented example)
channel.publish({
    message: `publish`
})
```

### Remove/Leave Channel
```javascript
// Remove channel from drumie instance
drumie.removeChannel(drumie.getChannel("channel"))

// Unsubscribe from specific channel
channel.unsubscribe()
```

### List Active Channels
```javascript
console.log(drumie.channels())
```

## Cleanup

```javascript
channel.unsubscribe() // Leave specific channel
drumie.disconnect() // Disconnect from WebSocket
```

## Security Considerations

- Ensure that your backend securely calls https://***.com/api/connect-token to obtain a connection token, instead of exposing this logic directly in the client.

## Usage in React Components

The Drumie WebSocket client is initialized in a `useEffect` hook to ensure proper lifecycle management and cleanup when the component unmounts.

```javascript
useEffect(() => {
  // Drumie initialization and setup
  return () => {
    // Cleanup operations
    channel.unsubscribe() // Leave specific channel
    drumie.disconnect() // Disconnect from WebSocket
  }
}, [])
```

## API:

**Publish: Send a message to all users in a channel**

```bash
curl --header "X-API-Key: <API_KEY>" --request POST --data '{"channel": "channel_name", "data": "hello"}' https://***.com/api/websocket/publish
```

```bash
curl --header "X-API-Key: <API_KEY>" --request POST --data '{"channel": "channel_name", "data": {"text": "hello"}}' https://***.com/api/websocket/publish
```

**Presence: Get the list of users currently connected in a channel**

```bash
curl --header "X-API-Key: <API_KEY>" --request POST --data '{"channel": "channel_name"}' https://***.com/api/websocket/presence
```

**Channel stats: Get the number of users connected in one or more channels**

```bash
curl --header "X-API-Key: <API_KEY>" --request POST --data '{"channel": "*"}' https://***.com/api/websocket/channels
```

```bash
curl --header "X-API-Key: <API_KEY>" --request POST --data '{"channel": "admin"}' https://***.com/api/websocket/channels
```

```bash
curl --header "X-API-Key: <API_KEY>" --request POST --data '{"channel": "admin*"}' https://***.com/api/websocket/channels
```

**History: Retrieve message history of a channel**

Each message returned includes an `offset`, which indicates its position in the channel’s message history, and an `epoch`, a unique identifier used for retrieving messages from a specific point in time (e.g., for pagination or syncing purposes). You can also use the `reverse` option to retrieve messages in reverse chronological order (from newest to oldest).

```bash
curl --header "X-API-Key: <API_KEY>" --request POST --data '{"channel": "channel_name", "limit": 1}' https://***.com/api/websocket/history
```

```bash
curl --header "X-API-Key: <API_KEY>" --request POST --data '{"channel": "channel_name", "limit": 1, "reverse": true}' https://***.com/api/websocket/history
```

```bash
curl --header "X-API-Key: <API_KEY>" --request POST --data '{"channel": "channel_name", "limit": 1, "reverse": true, "since": { "offset": 1, "epoch": "JzIo" } }' https://***.com/api/websocket/history
```