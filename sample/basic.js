const fpush = require('../');

ffpush.config({
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
fpush.on('channel_name', ws, new Date(), filter_data);
fpush.post('channel_name', { foo: '_bar' })
console.log(r.length) // 0
fpush.post('channel_name', { foo: 'bar' })
console.log(r.length) // 1

console.log(r[0]) // "{"foo": "bar"}"
console.log(JSON.parse(r[0]).data) // {foo: 'bar'}