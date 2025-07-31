# Drumie WebSocket Implementation Guide

## Overview

This documentation covers the implementation of Drumie WebSocket client in a Next.js React application for real-time communication with multiple channels.

## Configuration

### Base URLs
```javascript
const prefix = "ws://norsetreasure.test"
const apiPrefix = "http://norsetreasure.test/api"
const connectionString = `${prefix}/connect`
```

## Channel Configuration

The application supports multiple channels with individual token authentication:

### Channel Structure
```javascript
{
  name: "channel_name",
  token: async () => {
    // Token fetching logic
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

### Available Channels

#### Customer Channel
- **Name**: `customer`
- **Purpose**: Customer-related real-time communications
- **Token Endpoint**: `POST /api/subscribe-token`

#### Nice Channel
- **Name**: `nice`
- **Purpose**: General communications
- **Token Endpoint**: `POST /api/subscribe-token`

## Authentication

### Connection Token
The main connection token is obtained from:
```javascript
POST http://norsetreasure.test/api/connect-token
```

**Request Body:**
```json
{
  "id": "1",
  "name": "John Doe",
  "channels": "*"
}
```

**Channel Access Options:**
- `"customer"` - Access to customer channel only
- `"customer nice"` - Access to customer and nice channels
- `"*"` - Access to all channels

### Channel Subscription Tokens
Individual channel tokens are fetched from:
```javascript
POST http://norsetreasure.test/api/subscribe-token
```

**Request Body:**
```json
{
  "token": "connection_token",
  "channel": "channel_name"
}
```

## Implementation Details

### Drumie Instance Creation
```javascript
drumie = new Drumie(connectionString, {
  connecting: (ctx) => console.log(`connecting: ${ctx.code}, ${ctx.reason}`),
  connected: (ctx) => console.log(`connected over ${ctx.transport}`),
  disconnected: (ctx) => console.log(`disconnected: ${ctx.code}, ${ctx.reason}`),
  token: async () => {
    // Connection token fetching logic
  }
}, channels);
```

### Channel Operations

#### Subscribe to Channels
```javascript
drumie.subscribe()
```

#### Get Specific Channel
```javascript
const customerChannel = drumie.getChannel("customer")
```

#### Publish Messages
```javascript
// Simple message
customerChannel.publish(`auto publish ${count}`)

// Object message (commented example)
// customerChannel.publish({
//     message: "auto publish from client index-mysql-proxy-mode"
// })
```

#### Remove/Leave Channel
```javascript
// Remove channel from drumie instance
drumie.removeChannel(drumie.getChannel("nice"))

// Unsubscribe from specific channel
customerChannel.unsubscribe()
```

#### List Active Channels
```javascript
console.log(drumie.channels())
```

## Auto-Publishing Feature

The implementation includes an automatic message publishing feature:

```javascript
let count = 0
let interval = setInterval(() => {
  count++
  customerChannel.publish(`auto publish ${count}`)
}, 2000)
```

This publishes a message every 2 seconds with an incrementing counter.

## Cleanup

Proper cleanup is implemented in the useEffect return function:

```javascript
return () => {
  customerChannel.unsubscribe() // Leave specific channel
  drumie.disconnect() // Disconnect from WebSocket
}
```

## Error Handling

The implementation includes try-catch blocks for token fetching operations:

```javascript
try {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error("Failed to fetch token");
  }
  const data = await res.json();
  return data.token;
} catch (err) {
  console.error("Error fetching token:", err);
  throw err;
}
```

## Security Considerations

- Implement proper API authentication for token endpoints
- Validate user permissions before issuing tokens
- Use secure connection strings in production (wss://)
- Implement token expiration and refresh mechanisms

## Usage in React Components

The Drumie WebSocket client is initialized in a `useEffect` hook to ensure proper lifecycle management and cleanup when the component unmounts.

```javascript
useEffect(() => {
  // Drumie initialization and setup
  return () => {
    // Cleanup operations
  }
}, [])
```