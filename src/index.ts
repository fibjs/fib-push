import Link, { LinkedNode } from './link';

type MsgPayloadDataType = any;
interface DataFilterFunction {
    (input: any): boolean
}

type ChannelNameType = string;
type ChannelTimestampType = Date | number;

interface ConnectedChannelLink extends Link<WebSocketLike> {}
interface ConnectedChannelNode extends LinkedNode<WebSocketLike> {
    /**
     * filter data in message.data before this 
     * websocket-like object call `send(message.data.json)`
     */
    filter: DataFilterFunction
}

type IdleChannelLink = Link<Channel>

interface FibPushMessage {
    /**
     * time when message generated
     */
    timestamp: Date;
    /**
     * message data
     */
    data: MsgPayloadDataType;
    /**
     * corresponding data
     * 
     * @field timestamp: {number}; time when message generated
     * @field data: {MsgPayloadDataType}; data taken by message
     * @field ch: {ChannelNameType}; related channel's name
     */
    json: string // JsonfiedMessagePayload;
}

/* websocket like :start */
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
    send?: {
        (json: FibPushMessage['json']): void
    };

    /**
     * callback when websoket-like object close.
     */
    onclose?: Function;

    /**
     * registered channel
     */
    _ons?: {
        [registeredConnectedChannelNodeName: string]: ConnectedChannelNode
    }
}
/* websocket like :end */

type FibPushStatus = { [channelName: string]: WebSocketLike[] }

interface Channel {
    name: ChannelNameType;
    /**
     * **connection pool** of this channel
     */
    conns: Link<WebSocketLike>;
    /**
     * **message queue** of this channel
     */
    msgs: Link<FibPushMessage>;
    idle_node?: LinkedNode;
    start_timestamp: number;
    /**
     * add one WebSocketLike object to channel
     */
    on(ws: WebSocketLike, timestamp: ChannelTimestampType, filter?: DataFilterFunction): ConnectedChannelNode
    /**
     * remove WebSocketLike(s) object from channel
     */
    off(node: LinkedNode<WebSocketLike>): void
    /**
     * transform data to Jsonfied FibPushMessage Object, add 
     * jsonified-message with time and original data to 
     * this channel's message queue, then push 
     * jsonified-message to every node in channel's 
     * connection pool.
     */
    post(data: MsgPayloadDataType[] | MsgPayloadDataType): void

    // get connection information as one channel_name-indexed dict, equivlant to `channel.conns.toJSON()`
    status(): WebSocketLike[]
    /**
     * lock channel to prevent data input
     */
    lock(): void
    /**
     * unlock one locked channel
     */
    unlock(): void
}

const chs: Record<string, Channel> = {};
const idles: IdleChannelLink = new Link<Channel>();
let idle_limit: number = 100;
let msg_limit: number = 100;

function noOp() {}

function check_websocket_like_obj(ws: WebSocketLike) {
    if (typeof ws.send !== 'function') {
        ws.send = noOp;
        console.warn(`invalid websoket-like object, it should always have function-type 'send' field, it has been automaticlly correct by empty function`)
    }
}

/**
 * 
 * @class Channel 
 */
function channel(
    this: Channel,
    name: string
) {
    const self = this;
    const conns: ConnectedChannelLink = new Link<WebSocketLike>();
    const msgs = new Link<FibPushMessage>();
    let idle_node: LinkedNode<Channel>;
    const start_timestamp = new Date();
    let locked: number = 0;
    let miss: boolean = false;

    function toIdle(): void {
        idle_node = idles.addTail(self);
        if (idles.count() > idle_limit) {
            const head = idles.head();
            delete chs[head.data.name];
            idles.remove(head);
        }
    }

    function active(): void {
        if (idle_node) {
            idles.remove(idle_node);
            idle_node = undefined;
        }
    }

    toIdle();

    self.name = name;
    self.on = (ws, tt, filter?) => {
        check_websocket_like_obj(ws);

        active();

        const timestamp = new Date(tt as any);

        let m = <LinkedNode<FibPushMessage>>msgs.head();
        if (m != undefined) {
            if (m.data.timestamp.getTime() > timestamp.getTime()) {
                if (timestamp.getTime() < start_timestamp.getTime()) {
                    ws.send(JSON.stringify({
                        "timestamp": start_timestamp,
                        "ch": name
                    }));
                } else if (miss) {
                    ws.send(JSON.stringify({
                        "timestamp": m.data.timestamp,
                        "ch": name
                    }));
                }
            }

            while (m !== undefined && m.data.timestamp.getTime() < timestamp.getTime())
                m = m.next;

            while (m !== undefined) {
                if (typeof filter !== 'function' || filter(m.data.data))
                    ws.send(m.data.json);
                m = m.next;
            }
        } else {
            if (start_timestamp.getTime() > timestamp.getTime())
                ws.send(JSON.stringify({
                    "timestamp": start_timestamp,
                    "ch": name
                }));
        }

        const node = <ConnectedChannelNode>conns.addTail(ws);
        node.filter = filter;
        return node;
    };

    self.off = (node): void => {
        if (conns.remove(node) === 0 && locked === 0)
            toIdle();
    };

    self.post = (data: MsgPayloadDataType): void => {
        if (Array.isArray(data))
            return data.forEach(d => post(d));

        const timestamp: ChannelTimestampType = new Date();
        const json: FibPushMessage['json'] = JSON.stringify({
            timestamp: timestamp,
            ch: name,
            data: data
        });

        msgs.addTail({
            timestamp: timestamp,
            data: data,
            json: json
        });

        if (msgs.count() > msg_limit) {
            msgs.remove(msgs.head());
            miss = true
        }

        let node = <ConnectedChannelNode>conns.head();
        while (node !== undefined) {
            if (typeof node.filter !== 'function' || node.filter(data))
                node.data.send(json);
            node = <ConnectedChannelNode>node.next;
        }
    };

    self.lock = function () {
        locked++;
        if (locked == 1)
            active();
    }

    self.unlock = function () {
        locked--;
        if (locked == 0 && conns.count() == 0)
            toIdle();
    }

    self.status = (): WebSocketLike[] => {
        return conns.toJSON();
    }
}

/**
 * link channel and connection_node.
 * 
 * find channel by channel_name, check if `ws._ons` exists,
 * then call `channel.on(ws._ons)`.
 */
export const on = (
    ch: string,
    ws: WebSocketLike,
    timestamp: number,
    filter?: DataFilterFunction
) => {
    if (Array.isArray(ch))
        return ch.forEach(c => on(c, ws, timestamp, filter));

    let ons = ws._ons;
    if (ons === undefined) {
        ws._ons = ons = {};
        ws.onclose = () => {
            for (let ch in ons)
                off(ch, ws);
        }
    }

    if (ons[ch] !== undefined)
        throw new Error('double on channel ' + ch);

    let cho = chs[ch];
    if (cho === undefined)
        chs[ch] = cho = new channel(ch);

    ons[ch] = cho.on(ws, timestamp, filter);
};

/**
 * unlink channel and connection_node.
 * 
 * find channel by channel_name, check if `ws._ons` exists,
 * then call `channel.off(ws._ons)`.
 */
export const off = (ch: string, ws: WebSocketLike) => {
    if (Array.isArray(ch))
        return ch.forEach(c => off(c, ws));

    const ons = ws._ons;
    if (ons !== undefined && ons[ch] !== undefined) {
        chs[ch].off(ons[ch]);
        delete ons[ch];
    }
};

/**
 * post data to channel's message queue, then broadcast message
 * to all connections.
 * 
 * find channel by channel_name, then call `channel.post(data)`
 */ 
export const post = (ch: string, data?: MsgPayloadDataType) => {
    let cho = chs[ch];
    if (cho === undefined)
        chs[ch] = cho = new channel(ch);

    cho.post(data);
};

/**
 * @description lock one channel
 * @param ch channel to lock
 */
export const lock = (ch: string) => {
    let cho = chs[ch];
    if (cho === undefined)
        chs[ch] = cho = new channel(ch);

    cho.lock();
};

/**
 * @description unlock one channel
 * @param ch channel to unlock
 */
export const unlock = (ch: string) => {
    let cho = chs[ch];
    if (cho === undefined)
        chs[ch] = cho = new channel(ch);

    cho.unlock();
};

/**
 * get all status of channels and response with hash.
 */
export const status = () => {
    const r = <FibPushStatus>{};
    for (let ch in chs)
        r[ch] = chs[ch].status();
    return r;
};

/**
 * configure module's global options, includes: 
 * 
 * - `options.idle_limit` MAX COUNT of idle connection.
 * - `options.msg_limit` MAX COUNT of message
 */
export const config = (opts: {
    /**
     * If IdleChannelLink count(`idles.length`) get greater than
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
}) => {
    idle_limit = opts.idle_limit || idle_limit;
    msg_limit = opts.msg_limit || msg_limit;
}
