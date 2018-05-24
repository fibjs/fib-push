const test = require('test');
test.setup();

const coroutine = require('coroutine');
const push = require('..');

push.config({
    idle_limit: 10,
    msg_limit: 10
});

function noop() {}

describe("push", () => {
    it("on/off", () => {
        var ws = {
            send: noop,
            value: 1024
        };

        var ws1 = {
            send: noop,
            value: 1025
        };

        var ws2 = {
            send: noop,
            value: 1025
        };

        push.on("aaa", ws);
        assert.deepEqual(push.status().aaa, [ws]);

        push.on("aaa", ws1);
        assert.deepEqual(push.status().aaa, [ws, ws1]);

        push.on("aaa", ws2);
        assert.deepEqual(push.status().aaa, [ws, ws1, ws2]);

        push.off("aaa", ws1);
        assert.deepEqual(push.status().aaa, [ws, ws2]);

        push.off("aaa", ws2);
        assert.deepEqual(push.status().aaa, [ws]);

        ws.onclose();
        assert.deepEqual(push.status().aaa, []);
    });

    it("post", () => {
        var r = [];
        var ws = {
            send: m => r.push(m)
        };

        push.on("aaa", ws);
        push.post("aaa", {
            a: 100,
            b: 200
        });

        assert.deepEqual(JSON.parse(r[0]).data, {
            a: 100,
            b: 200
        });

        push.post("aaa", {
            a: 200
        });

        assert.deepEqual(JSON.parse(r[1]).data, {
            a: 200
        });
    });

    it("post by filter", () => {
        var r = [];
        var ws = {
            send: m => {
                if (JSON.parse(m).data)
                    r.push(m)
            }
        };

        let filter1 = function (d) {
            return d.a == 200;
        }

        push.on("bbb", ws, new Date(), filter1);
        push.post("bbb", {
            a: 100,
            b: 200
        });
        assert.equal(r.length, 0);

        push.post("bbb", {
            a: 200,
            b: 300
        });

        assert.equal(r.length, 1);
        assert.deepEqual(JSON.parse(r[0]).data, {
            a: 200,
            b: 300
        });

        let filter2 = function (d) {
            return d.b == 200;
        }

        push.on("ccc", ws, new Date(), filter2);
        push.post("bbb", {
            a: 100,
            b: 200
        });
        assert.equal(r.length, 1);

        push.post("ccc", {
            a: 300,
            b: 200
        });
        assert.equal(r.length, 2);
        assert.deepEqual(JSON.parse(r[1]).data, {
            a: 300,
            b: 200
        });

    });

    it("post empty channel", () => {
        push.post("aaa1", {
            a: 100,
            b: 200
        });

        var r = [];
        var ws = {
            send: m => r.push(m)
        };

        push.on("aaa1", ws, 0);
        assert.equal(r.length, 2);
        assert.strictEqual(JSON.parse(r[0]).data, undefined);
        assert.property(JSON.parse(r[0]), "timestamp");
    });

    it("post limit", () => {
        var ws = {
            send: m => {}
        };

        push.on("aaa2", ws, 0);
        for (var i = 0; i < 100; i++)
            push.post("aaa2", {
                a: i
            });

        var r = [];
        var ws1 = {
            send: m => r.push(m)
        };

        push.on("aaa2", ws1, 0);

        assert.equal(r.length, 11);
        assert.strictEqual(JSON.parse(r[0]).data, undefined);
        assert.property(JSON.parse(r[0]), "timestamp");

        for (var i = 1; i < 11; i++)
            assert.strictEqual(JSON.parse(r[i]).data.a, i + 89);
    });

    it("idle limit", () => {
        var ws = {
            send: m => {}
        };

        var chs = Object.keys(push.status());
        for (var i = 0; i < 100; i++)
            push.on(`idle_${i}`, ws);
        ws.onclose();
        var chs1 = Object.keys(push.status());

        assert.deepEqual(chs1.slice(chs.length), [
            "idle_90",
            "idle_91",
            "idle_92",
            "idle_93",
            "idle_94",
            "idle_95",
            "idle_96",
            "idle_97",
            "idle_98",
            "idle_99"
        ]);
    });

    it("lock/unlock", () => {
        var ws = {
            send: m => {}
        };

        push.post(`lock_test`, 1);
        assert.property(push.status(), "lock_test");

        for (var i = 0; i < 100; i++)
            push.post(`lock_${i}`, 1);
        assert.notProperty(push.status(), "lock_test");

        push.lock("lock_test");
        for (var i = 0; i < 100; i++)
            push.post(`lock_${i}`, 1);
        assert.property(push.status(), "lock_test");

        push.unlock("lock_test");
        assert.property(push.status(), "lock_test");
        for (var i = 0; i < 100; i++)
            push.post(`lock_${i}`, 1);
        assert.notProperty(push.status(), "lock_test");

        push.lock("lock_test");
        assert.property(push.status(), "lock_test");

        push.on(`lock_test`, ws);
        for (var i = 0; i < 100; i++)
            push.post(`lock_${i}`, 1);
        assert.property(push.status(), "lock_test");

        push.unlock("lock_test");
        for (var i = 0; i < 100; i++)
            push.post(`lock_${i}`, 1);
        assert.property(push.status(), "lock_test");

        ws.onclose();
        for (var i = 0; i < 100; i++)
            push.post(`lock_${i}`, 1);
        assert.notProperty(push.status(), "lock_test");
    });

    it("double on", () => {
        var ws = {
            send: m => {}
        };

        push.on(`test_111`, ws);
        assert.throws(() => {
            push.on(`test_111`, ws);
        });
    });

    it("post empty message by different case", () => {
        var r = [];
        var ws = {
            send: m => r.push(m)
        };

        push.on("aaa3", ws, 0);
        assert.equal(r.length, 1);
        assert.strictEqual(JSON.parse(r[0]).data, undefined);
        assert.property(JSON.parse(r[0]), "timestamp");
        push.off("aaa3", ws);

        var s = JSON.parse(r[0]).timestamp;

        r = [];
        var t = Date.now();
        for (var i = 0; i < 5; i++) {
            coroutine.sleep(1);
            push.post("aaa3", {
                a: i
            });
        }
            
        push.on("aaa3", ws, t);
        assert.equal(r.length, 5);
        assert.equal(JSON.parse(r[0]).timestamp > s, true);
        push.off("aaa3", ws);

        r = [];
        for (var i = 0; i < 15; i++) {
            coroutine.sleep(1);
            push.post("aaa3", {
                a: i
            });
        }
        push.on("aaa3", ws, t);
        assert.equal(r.length, 11);
        assert.strictEqual(JSON.parse(r[0]).data, undefined);
        assert.property(JSON.parse(r[0]), "timestamp");
        assert.equal(JSON.parse(r[0]).timestamp, JSON.parse(r[1]).timestamp);
        push.off("aaa3", ws);

        coroutine.sleep(1);
        r = [];
        t = Date.now();
        push.on("aaa3", ws, t);
        assert.equal(r, 0);
    });
});

test.run(console.DEBUG);