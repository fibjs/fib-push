/// <reference path="basic.d.ts" />

declare module "fib-push" {    
    module _FibPush {
        /**
         * link channel and connection_node.
         * 
         * find channel by channel_name, check if `ws._ons` exists,
         * then call `channel.on(ws._ons)`.
         */
        export function on(channel_name: string, ws: WebSocketLike, timestamp: number, filter?: DataFilterFunction): void
        /**
         * unlink channel and connection_node.
         * 
         * find channel by channel_name, check if `ws._ons` exists,
         * then call `channel.off(ws._ons)`.
         */
        export function off(channel_name: string, ws: WebSocketLike): void
        /**
         * post data to channel's message queue, then broadcast message
         * to all connections.
         * 
         * find channel by channel_name, then call `channel.post(data)`
         */ 
        export function post(channel_name: string, data: MsgPayloadDataType): void
        /**
         * get all status of channels and response with hash.
         */
        export function status(): FibPushStatus
        /**
         * configure module's global options, includes: 
         * 
         * - `options.idle_limit` MAX COUNT of idle connection.
         * - `options.msg_limit` MAX COUNT of message
         */
        export function config(options: FibPushOptions): void
    }

    export = _FibPush;
}
