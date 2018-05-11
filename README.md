## fib-push

`fib-push` is one global service in a fibjs runtime, which provides duplex communication based on **websocket-like** connect, and manage end-2-end connect & **message queue** with **Channel**. One global service is enough in most cases, so we **don't** support multiple instances of `fib-push` at now.

`fib-push` has so less code that you could learn about its mechanism and usage just by reading source code :)

### Core Concept

- `Channel` is the pivot structure in `fib-push`.
- There is one global `idles` variable for recording idle channel, when new idle channel added as tail, the head one would be delete and removed.
- All message transmission is on json-encoded-format.
- `WebSocketLike` -> `ConnectionNode`.

### Usage

```javascript
const push = require('fib-push');

push.config({
    idle_limit: 10,
    msg_limit: 10
});
var r = [];
var ws = {
    send: m => r.push(m)
};

function filter_data (data) {
    return data.foo === 'bar';
}
// mount one channel named of 'channel_name'
push.on('channel_name', ws, new Date(), filter_data);
push.post('channel_name', { foo: '_bar' })
console.log(r.length) // 0
push.post('channel_name', { foo: 'bar' })
console.log(r.length) // 1

console.log(r[0]) // {"timestamp":"2018-05-11T09:18:05.134Z","ch":"channel_name","data":{"foo":"bar"}}
console.log(JSON.parse(r[0]).data) // {foo: 'bar'}
```

View more useage in this repo's `test/*.js`

---

### Types

#### FibPush

```typescript
type MsgPayloadDataType = any;
type DataFilterFunction = Function;

interface FibPush {
    /**
     * link channel and connection_node.
     * 
     * find channel by channel_name, check if `ws._ons` exists,
     * then call `channel.off(ws._ons)`.
     */
    on(channel_name: string, ws: WebSocketLike, timestamp: number, filter?: DataFilterFunction): void
    /**
     * unlink channel and connection_node.
     * 
     * find channel by channel_name, check if `ws._ons` exists,
     * then call `channel.off(ws._ons)`.
     */
    off(channel_name: string, ws: WebSocketLike): void
    /**
     * post data to channel's message queue, then broadcast message
     * to all connections.
     * 
     * find channel by channel_name, then call `channel.post(data)`
     */ 
    post(channel_name: string, data: MsgPayloadDataType): void
    /**
     * get all status of channels and response with hash.
     */
    status(): object
    /**
     * configure module's global options, includes: 
     * 
     * - `options.idle_limit` MAX COUNT of idle connection.
     * - `options.msg_limit` MAX COUNT of message
     */
    config(options: PushOptions): void
}
interface PushOptions {
    /**
     * If idle_channel count(`idles.length`) get greater than
     * `options.idle_limit` after one new channel becomes idle 
     * and was added as tail to `idles`, the head node of `idles`
     * would be removed
     */
    idle_limit: number;
    /**
     * If message count in one channel get greater than
     * `options.msg_limit` after one new message added as
     * tail to channel's message queue, the head node of this
     * channel's message queue would be removed
     */
    msg_limit: number;
}
```

#### Channel
```typescript
type ChannelNameType = string;

declare var idles: IDLE_CHANNEL;

interface Channel {
    name: ChannelNameType;
    /**
     * **connection pool** of this channel
     */
    conns: Link<ConnectionNode>;
    /**
     * **message queue** of this channel
     */
    msgs: Link<Message>;
    idle_node: LinkedNode | undefined;
    start_timestamp: number;

    /**
     * add one WebSocketLike object to channel
     */
    on(ws: WebSocketLike, timestamp: number, filter?: DataFilterFunction): void
    /**
     * remove WebSocketLike(s) object from channel
     */
    off(node: ConnectionNode): void
    /**
     * transform data to Jsonfied Message Object, add 
     * jsonified-message with time and original data to 
     * this channel's message queue, then push 
     * jsonified-message to every node in channel's 
     * connection pool.
     */
    post(data: any[]|any): void
    // get connection information as one channel_name-indexed dict, equivlant to `channel.conns.toJSON()`
    status(): any
}

type IDLE_CHANNEL = Link<Channel>
```

#### WebSocketLike
```typescript
interface WebSocketLike {
    /**
     * determine how to 'send' data with your websoket-like,
     * always provide this field if you dont use standard 
     * WebSocket Object in fibjs. It would be called when
     * message was broadcast.
     * 
     * notice that the 1st callback param is string, one json-format
     * data payload
     */
    send(json: JsonfiedMessage)?: void;

    /**
     * callback when websoket-like object close.
     */
    onclose()?: void;
}
interface ConnectionNode extends WebSocketLike {
    /**
     * filter data in message.data before this 
     * websocket-like object call `send(message.data.json)`
     */ 
    filter?: DataFilterFunction
}
```

#### Message
```typescript
interface JsonfiedMessagePayload {
    /**
     * time when message generated
     */
    timestamp: number;
    /**
     * data taken by message
     */ 
    data: MsgPayloadDataType;
    /**
     * related channel's name
     * 
     */ 
    ch: ChannelNameType;
}

interface Message {
    /**
     * time when message generated
     */
    timestamp: number;
    /**
     * message data
     */
    data: MsgPayloadDataType;
    /**
     * corresponding data
     */
    json: JsonfiedMessagePayload;
}

type JsonfiedMessage = string;
```

---

[Link]:docs/link.md