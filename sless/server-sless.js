const net = require('net');
const { WebSocketServer } = require('ws');
const WebSocket = require('ws');
const slessTool = require('./sless-tools');

let uuid = '';

let i = 100000;
let appLog = slessTool.logFactory(i,'INFO');

function onConnection(ws){
    let log = slessTool.logFactory(++i,'INFO');
    log('INFO', "on connection");
    if(!uuid){
        log('ERROR', "uuid is unset!");
        ws.send(Buffer.from('Time:' + new Date()));
        ws.close();
        return;
    }
    ws.once('message', msg => {
        let opts = slessTool.fromSlessHeader(msg)
        log(`on message: ${msg.length} ${uuid} ${opts.uuid} ${opts.targetHost} ${opts.targetPort} ${opts.timestamp}`);
        if(opts.uuid !== uuid || opts.timestamp < Date.now() - 1000*60){
            ws.send(Buffer.from('Time:' + new Date()));
            return;
        }
        log('connect check success');
        const duplex = WebSocket.createWebSocketStream(ws);
        net.connect({ host: opts.targetHost, port: opts.targetPort }, function () {
            ws.send([0,0]);
            this.once('error', err=>{
                log('ERROR', `CLIENT TO WS ERROR: ${err.code}: ${err.message}\r\n${err}`);
                duplex.end();duplex.destroy();
            });
            duplex.once('error', err=>{
                log('ERROR', `WS TO CLIENT ERROR: ${err.code}: ${err.message}\r\n${err}`);
                this.end();this.destroy();
            });
            duplex.pipe(this);
            this.pipe(duplex);
        }).on('error', err=>{
            log('ERROR', `CONN TO SERVER ERROR> ${opts.targetHost}:${opts.targetPort} : ${err.code}: ${err.message}\r\n${err}`);
        });
    }).on('error', err=>{
        log('ERROR', `WSS ERROR: ${err.code}: ${err.message}\r\n${err}`);
    });
}

module.exports = (server, _uuid) => {
    uuid = _uuid
    const wss = new WebSocketServer({
        server
    });
 
    wss.on('connection', onConnection);
    appLog('INFO', "App Web Socket Server is running!");
    return wss;
}