## fib-push

`fib-push` is one global service in a fibjs runtime, which provides duplex communication based on **websocket-like** connection, and manage end-2-end connection & **message queue** with **Channel**. One global service is enough in most cases, so we **don't** support multiple instances of `fib-push` at now.

`fib-push` has so less code that you could learn about its mechanism and usage just by reading source code :)

### Core Concept

- `Channel` is the pivot structure in `fib-push`.
- There is one global `idles` variable for recording idle channel, when new idle channel added as tail, the head one would be delete and removed.
- All message transmission is on json-encoded-format.
- `WebSocketLike` -> `WsConnection`.

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

View more useages in this repo's `test/*.js`

---

### Types

View details in [@types]
---

[Link]:docs/link.md
[@types]:@types/index.d.ts
