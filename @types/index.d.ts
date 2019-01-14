declare namespace FibPushNS {
    type MsgPayloadDataType = any;
    type DataFilterFunction = Function;

    /* channel :start */
    type ChannelNameType = string;
    type ChannelTimestampType = Date | number;
    type ChannelEventFilter = DataFilterFunction;
    interface ChannelHash { [chName: string]: Channel }

    interface Channel {
        name: ChannelNameType;
        /**
         * **connection pool** of this channel
         */
        conns: Link<WsConnection>;
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
        off(node: LinkedNode<WsConnection>): void
        /**
         * transform data to Jsonfied FibPushMessage Object, add 
         * jsonified-message with time and original data to 
         * this channel's message queue, then push 
         * jsonified-message to every node in channel's 
         * connection pool.
         */
        post(data: MsgPayloadDataType[] | MsgPayloadDataType): void
        // get connection information as one channel_name-indexed dict, equivlant to `channel.conns.toJSON()`
        status(): WsConnection[]

        /**
         * lock channel to prevent data input
         */
        lock(): void
        /**
         * unlock one locked channel
         */
        unlock(): void
    }
    interface ConnectedChannelNodeHash {
        [channelName: string]: ConnectedChannelNode
    }
    interface ConnectedChannelLink extends Link<WsConnection> {}
    interface ConnectedChannelNode extends LinkedNode<WsConnection> {
        /**
         * filter data in message.data before this 
         * websocket-like object call `send(message.data.json)`
         */
        filter?: DataFilterFunction
    }

    type IdleChannelLink = Link<Channel>
    /* channel :end */

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
         */
        json: JsonfiedMessage // JsonfiedMessagePayload;
    }

    type JsonfiedMessage = string;

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
        send?(json: JsonfiedMessage): void;

        /**
         * callback when websoket-like object close.
         */
        onclose?(): void;

        /**
         * registered channel
         */
        _ons?: { [registeredConnectedChannelNodeName: string]: ConnectedChannelNode }
    }
    interface WsConnection extends WebSocketLike { }
    /* websocket like :end */

    /* linked node :start */
    interface LinkedNode<T = any> {
        data: T;
        next?: LinkedNode;
        prev?: LinkedNode;
    }

    class Link<DT = any> {
        private _head?: LinkedNode<DT>;
        private _tail?: LinkedNode<DT>;
        private _count: number;

        head(): LinkedNode<DT>;
        tail(): LinkedNode<DT>;
        count(): number;
        addHead(data: any): LinkedNode<DT>;
        addTail(data: any): LinkedNode<DT>;
        remove(node: LinkedNode<DT>): number;
        toJSON(): DT[];
    }
    /* linked node :end */

    type FibPushStatus = { [channelName: string]: WsConnection[] }

    interface FibPushOptions {
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
    }

    interface ExportModule {
        /**
         * link channel and connection_node.
         * 
         * find channel by channel_name, check if `ws._ons` exists,
         * then call `channel.on(ws._ons)`.
         */
        on(channel_name: string, ws: FibPushNS.WebSocketLike, timestamp: number, filter?: FibPushNS.DataFilterFunction): void
        /**
         * unlink channel and connection_node.
         * 
         * find channel by channel_name, check if `ws._ons` exists,
         * then call `channel.off(ws._ons)`.
         */
        off(channel_name: string, ws: FibPushNS.WebSocketLike): void
        /**
         * post data to channel's message queue, then broadcast message
         * to all connections.
         * 
         * find channel by channel_name, then call `channel.post(data)`
         */ 
        post(channel_name: string, data: FibPushNS.MsgPayloadDataType): void
        /**
         * get all status of channels and response with hash.
         */
        status(): FibPushNS.FibPushStatus
        /**
         * configure module's global options, includes: 
         * 
         * - `options.idle_limit` MAX COUNT of idle connection.
         * - `options.msg_limit` MAX COUNT of message
         */
        config(options: FibPushNS.FibPushOptions): void
    }
}

declare module "fib-push" {    
    const mod: FibPushNS.ExportModule

    export = mod;
}
