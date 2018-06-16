/// <reference path="../@types/basic.d.ts" />

import Link from './link';

const chs: ChannelHash = {};
const idles: IdleChannelLink = new Link<Channel>();
let idle_limit: number = 100;
let msg_limit: number = 100;

function noop_send() {}

function check_websocket_like_obj(ws: WebSocketLike) {
    if (typeof ws.send !== 'function') {
        ws.send = noop_send;
        console.warn(`invalid websoket-like object, it should always have function-type 'send' field, it has been automaticlly correct by empty function`)
    }
}

/**
 * 
 * @class Channel 
 */
function channel(name: string) {
    const self: Channel = this;
    const conns: ConnectedChannelLink = new Link<WsConnection>();
    const msgs: Link<FibPushMessage> = new Link<FibPushMessage>();
    let idle_node: LinkedNode<Channel>;
    const start_timestamp = new Date();
    let locked: number = 0;
    let miss: boolean = false;

    function toIdle(): void {
        idle_node = idles.addTail(self);
        if (idles.count() > idle_limit) {
            var head = idles.head();
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
    self.on = (ws: WebSocketLike, timestamp: ChannelTimestampType, filter?: ChannelEventFilter): ConnectedChannelNode => {
        check_websocket_like_obj(ws);

        active();

        timestamp = new Date(timestamp);

        var m: LinkedNode<FibPushMessage> = msgs.head();
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
                if (!filter || filter(m.data.data))
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

        let node: ConnectedChannelNode = conns.addTail(ws);
        node.filter = filter;
        return node;
    };

    self.off = (node: ConnectedChannelNode): void => {
        if (conns.remove(node) === 0 && locked === 0)
            toIdle();
    };

    self.post = (data: MsgPayloadDataType): void => {
        if (Array.isArray(data))
            return data.forEach(d => post(d));

        var timestamp: ChannelTimestampType = new Date();
        var json: JsonfiedMessage = JSON.stringify({
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

        var node: ConnectedChannelNode = conns.head();
        while (node !== undefined) {
            if (!node.filter || node.filter(data))
                node.data.send(json);
            node = node.next;
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

    self.status = (): WsConnection[] => {
        return conns.toJSON();
    }
}

export const on = (ch: ChannelNameType|ChannelNameType[], ws: WebSocketLike, timestamp: ChannelTimestampType, filter?: ChannelEventFilter): void => {
    if (Array.isArray(ch))
        return ch.forEach(c => on(c, ws, timestamp, filter));

    var ons = ws._ons;
    if (ons === undefined) {
        ws._ons = ons = {};
        ws.onclose = () => {
            for (var ch in ons)
                off(ch, ws);
        }
    }

    if (ons[ch] !== undefined)
        throw new Error('double on channel ' + ch);

    var cho = chs[ch];
    if (cho === undefined)
        chs[ch] = cho = new channel(ch);

    ons[ch] = cho.on(ws, timestamp, filter);
};

export const off = (ch, ws): void => {
    if (Array.isArray(ch))
        return ch.forEach(c => off(c, ws));

    var ons = ws._ons;
    if (ons !== undefined && ons[ch] !== undefined) {
        chs[ch].off(ons[ch]);
        delete ons[ch];
    }
};

export const post = (ch, data?: any): void => {
    var cho = chs[ch];
    if (cho === undefined)
        chs[ch] = cho = new channel(ch);

    cho.post(data);
};

export const lock = (ch: string): void => {
    var cho = chs[ch];
    if (cho === undefined)
        chs[ch] = cho = new channel(ch);

    cho.lock();
};

export const unlock = (ch: string): void => {
    var cho = chs[ch];
    if (cho === undefined)
        chs[ch] = cho = new channel(ch);

    cho.unlock();
};

export const status = (): FibPushStatus => {
    var r: FibPushStatus = {};
    for (let ch in chs)
        r[ch] = chs[ch].status();
    return r;
};

export const config = (opts: FibPushOptions) => {
    idle_limit = opts.idle_limit || idle_limit;
    msg_limit = opts.msg_limit || msg_limit;
}