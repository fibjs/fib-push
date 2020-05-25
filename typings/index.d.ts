import { LinkedNode } from './link';
declare type MsgPayloadDataType = any;
interface DataFilterFunction {
    (input: any): boolean;
}
interface ConnectedChannelNode extends LinkedNode<WebSocketLike> {
    /**
     * filter data in message.data before this
     * websocket-like object call `send(message.data.json)`
     */
    filter: DataFilterFunction;
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
     *
     * @field timestamp: {number}; time when message generated
     * @field data: {MsgPayloadDataType}; data taken by message
     * @field ch: {ChannelNameType}; related channel's name
     */
    json: string;
}
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
        (json: FibPushMessage['json']): void;
    };
    /**
     * callback when websoket-like object close.
     */
    onclose?: Function;
    /**
     * registered channel
     */
    _ons?: {
        [registeredConnectedChannelNodeName: string]: ConnectedChannelNode;
    };
}
declare type FibPushStatus = {
    [channelName: string]: WebSocketLike[];
};
declare let idle_limit: number;
declare let msg_limit: number;
/**
 * link channel and connection_node.
 *
 * find channel by channel_name, check if `ws._ons` exists,
 * then call `channel.on(ws._ons)`.
 */
export declare const on: (ch: string, ws: WebSocketLike, timestamp: number, filter?: DataFilterFunction) => any;
/**
 * unlink channel and connection_node.
 *
 * find channel by channel_name, check if `ws._ons` exists,
 * then call `channel.off(ws._ons)`.
 */
export declare const off: (ch: string, ws: WebSocketLike) => any;
/**
 * post data to channel's message queue, then broadcast message
 * to all connections.
 *
 * find channel by channel_name, then call `channel.post(data)`
 */
export declare const post: (ch: string, data?: MsgPayloadDataType) => void;
/**
 * @description lock one channel
 * @param ch channel to lock
 */
export declare const lock: (ch: string) => void;
/**
 * @description unlock one channel
 * @param ch channel to unlock
 */
export declare const unlock: (ch: string) => void;
/**
 * get all status of channels and response with hash.
 */
export declare const status: () => FibPushStatus;
/**
 * configure module's global options, includes:
 *
 * - `options.idle_limit` MAX COUNT of idle connection.
 * - `options.msg_limit` MAX COUNT of message
 */
export declare const config: (opts: {
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
}) => void;
export {};
