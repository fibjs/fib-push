var Link = require('./link');

var chs = {};
var idles = new Link();
var idle_limit = 100;
var msg_limit = 100;

function noop_send() {}

function check_websocket_like_obj(ws) {
    if (typeof ws.send !== 'function') {
        ws.send = noop_send;
        console.warn(`invalid websoket-like object, it should always have function-type 'send' field, it has been automaticlly correct by empty function`)
    }
}

function channel(name) {
    var self = this;
    var conns = new Link();
    var msgs = new Link();
    var idle_node;
    var start_timestamp = new Date();
    var locked = 0;

    function toIdle() {
        idle_node = idles.addTail(self);
        if (idles.count() > idle_limit) {
            var head = idles.head();
            delete chs[head.data.name];
            idles.remove(head);
        }
    }

    function active() {
        if (idle_node) {
            idles.remove(idle_node);
            idle_node = undefined;
        }
    }

    toIdle();

    self.name = name;
    self.on = (ws, timestamp, filter) => {
        check_websocket_like_obj(ws);

        active();

        timestamp = new Date(timestamp);

        var m = msgs.head();
        if (m != undefined) {
            if (m.data.timestamp.getTime() > timestamp.getTime())
                ws.send(JSON.stringify({
                    "timestamp": m.data.timestamp,
                    "ch": name
                }));

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

        let node = conns.addTail(ws);
        node.filter = filter;
        return node;
    };

    self.off = node => {
        if (conns.remove(node) === 0 && locked === 0)
            toIdle();
    };

    self.post = (data) => {
        if (Array.isArray(data))
            return data.forEach(d => post(d));

        var timestamp = new Date();
        var json = JSON.stringify({
            timestamp: timestamp,
            ch: name,
            data: data
        });

        msgs.addTail({
            timestamp: timestamp,
            data: data,
            json: json
        });

        if (msgs.count() > msg_limit)
            msgs.remove(msgs.head());

        var node = conns.head();
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

    self.status = () => {
        return conns.toJSON();
    }
}

exports.on = (ch, ws, timestamp, filter) => {
    if (Array.isArray(ch))
        return ch.forEach(c => exports.on(c, ws, timestamp, filter));

    var ons = ws._ons;
    if (ons === undefined) {
        ws._ons = ons = {};
        ws.onclose = ev => {
            for (var ch in ons)
                exports.off(ch, ws);
        }
    }

    if (ons[ch] !== undefined)
        throw new Error('double on channel ' + ch);

    var cho = chs[ch];
    if (cho === undefined)
        chs[ch] = cho = new channel(ch);

    ons[ch] = cho.on(ws, timestamp, filter);
};

exports.off = (ch, ws) => {
    if (Array.isArray(ch))
        return ch.forEach(c => exports.off(c, ws));

    var ons = ws._ons;
    if (ons !== undefined && ons[ch] !== undefined) {
        chs[ch].off(ons[ch]);
        delete ons[ch];
    }
};

exports.post = (ch, data) => {
    var cho = chs[ch];
    if (cho === undefined)
        chs[ch] = cho = new channel(ch);

    cho.post(data);
};

exports.lock = (ch) => {
    var cho = chs[ch];
    if (cho === undefined)
        chs[ch] = cho = new channel(ch);

    cho.lock();
};

exports.unlock = (ch) => {
    var cho = chs[ch];
    if (cho === undefined)
        chs[ch] = cho = new channel(ch);

    cho.unlock();
};

exports.status = () => {
    var r = {};
    for (ch in chs)
        r[ch] = chs[ch].status();
    return r;
};

exports.config = opts => {
    idle_limit = opts.idle_limit || idle_limit;
    msg_limit = opts.msg_limit || msg_limit;
}