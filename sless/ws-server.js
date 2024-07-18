// 空白的websocket服务
const WebSocket = require('ws');

const port = 40823;
const wss = new WebSocket.Server({ port },()=>{
    console.log('listen:', port);
});
wss.on('connection', ws => {
    console.log("on connection");

    ws.on('message', msg=>{
        console.log('msg:', msg.length, msg.toString());
        ws.send([0,0,0])
    }).on('error', err=>{
        console.log('err:', err);
    });
});
