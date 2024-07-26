let net = require('net');
let WebSocket = require('ws');
let slessTool = require('./sless-tools');
let proxyConfig = require('./client-config')

let proxyServer = proxyConfig.proxy.proxyServer;
let proxyServerPort = proxyConfig.proxy.proxyServerPort;

let slessServerOpt = proxyConfig.sless[proxyConfig.sless.active];
let WebSocketSever = slessServerOpt?.WebSocketSever;
let WebSocketSeverPort = slessServerOpt?.WebSocketSeverPort;
let WebSocketSeverTls = slessServerOpt?.WebSocketSeverTls;
let rejectUnauthorized = slessServerOpt?.rejectUnauthorized;

let uuid = Buffer.from(slessServerOpt?.uuid || 'unset');
let i = 1000000;
let connectedMsg = Buffer.from("HTTP/1.1 200 Connection established\r\nConnection: close\r\n\r\n");
let connectAuthFailMsg = Buffer.from("HTTP/1.1 407 Proxy Authentication Required\r\nConnection: close\r\n\r\n");
let noConnectAuthFailMsg = Buffer.from("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
let unreachableMsg = Buffer.from("HTTP/1.1 504 Gateway Timeout\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: 14\r\nConnection: close\r\n\r\nGateway Timeout");

// 504 Gateway Timeout

proxyConfig.domains = proxyConfig.domains.map(v=>{
    if(v.startsWith('*')){
        v = v.substring(1);
        return function(domain){
            return domain.endsWith(v);
        }
    }else{
        return domain => domain == v;
    }
})

function isInProxy(domain){
    return proxyConfig.domains.some(fn=>{
        return fn(domain);
    })
}
function getWsServer(){
    if(WebSocketSeverTls){
        return new WebSocket(`wss://${WebSocketSever}:${WebSocketSeverPort}`,{
            rejectUnauthorized:rejectUnauthorized
        });
    }else{
        return new WebSocket(`ws://${WebSocketSever}:${WebSocketSeverPort}`);
    }
}

let appLog = slessTool.logFactory(i,proxyConfig.loglevel);
net.createServer(client => {
    let log = slessTool.logFactory(++i,proxyConfig.loglevel);
    log('INFO',`TCP Client connect ${client.remoteAddress}:${client.remotePort}`);
    
    client.once('data', data =>{
        let opt = slessTool.readSocket(data);
        if(opt.host == proxyServer &&  opt.port == proxyServerPort){
            log('INFO',`target is current client, close it`);
            client.write(Buffer.from("HTTP/1.1 204 No Content\r\nConnection: close\r\n\r\n"));
            client.end();client.destroy();
            return;
        }
        if(!isInProxy(opt.host)){
            log('INFO',`DERICT ${opt.method} ${opt.host}:${opt.port}`);
            net.createConnection({
                port:opt.port,
                host:opt.host,
                timeout: 3000
            }, function(){
                log('INFO',`DERICT CONNECTED`);

                client.once('error', err=>{
                    log('ERROR',`DIRECT CLIENT ERR:${err.code} - ${err.message}\r\n${err}`);
                    this.end();this.destroy();
                })
                client.once('close', () => {
                    log('INFO',`DIRECT CLIENT CLOSE`);
                    this.end();this.destroy();
                });
                opt.method === 'CONNECT' ?  client.write(connectedMsg) :  this.write(opt.data);
                this.pipe(client).pipe(this);
            }).once('error',err=>{
                log('ERROR',`DIRECT CONNECT ERR:${err.code} - ${err.message}\r\n${err}`);
                client.end();client.destroy();
            });
            return;
        }

        let slessHeader = slessTool.toSlessHeader(uuid, opt.port, Buffer.from(opt.host))
        log('DEBUG',`Full Request:\r\n${opt.data.toString()}`);
        log('INFO',`PROXY ${opt.method} ${opt.host}:${opt.port}`);

        let wss = getWsServer()
        wss.on('error', err=>{
            log('ERROR',`PROXY CONNECT ERR: ${err.code} - ${err.message}\r\n${err}`);
            if(err.message.indexOf('Unexpected server response: 502') != -1){
                client.write(unreachableMsg);
            }else{
                client.write( opt.method === 'CONNECT' ? connectAuthFailMsg : noConnectAuthFailMsg);
            }
            client.end();client.destroy();
        });
        client.once('error', err=>{
            log('ERROR',`PROXY WSS ERR:${err.code} - ${err.message}\r\n${err}`);
            wss.close();
        })
        wss.once('close', () => {
            log('INFO',`PROXY WSS CLOSE`);
            client.end();client.destroy();
        });
        client.once('close', () => {
            log('INFO',`PROXY CLIENT CLOSE`);
            wss.close()
        });
        wss.once('open', () => {
            log('DEBUG',`send sless header:${slessHeader.toString()}`);
            wss.send(slessHeader);
        });
        wss.once('message', replyData=>{
            log('INFO',`PROXY CONNECT REPLY:${replyData.length}`);
            if(replyData.length !== 2){
                client.write( opt.method === 'CONNECT' ? connectAuthFailMsg : noConnectAuthFailMsg);
                client.end();client.destroy();
                return;
            }
            log('INFO',`PROXY CONNECTED`);

            const duplex = WebSocket.createWebSocketStream(wss);
            if(opt.method === 'CONNECT'){
                client.write(connectedMsg);
            }else{
                duplex.write(opt.data);
            }
            duplex.once('error', err => {
                log('ERROR',`PROXY DUPLEX ERR:${err.code} - ${err.message}\r\n${err}`);
                client.end();client.destroy();
            });
            duplex.once('close', () => {
                log('INFO',`PROXY DUPLEX CLOSE`);
                client.end();client.destroy();
            });
            client.once('error', err=>{
                duplex.end();duplex.destroy();
            })
            client.once('close', err=>{
                duplex.end();duplex.destroy();
            })
            duplex.pipe(client).pipe(duplex);
            
        });
    });
}).listen({ host: proxyServer, port: proxyServerPort }, () => {
    if(!slessServerOpt){
        appLog('ERROR',`active profile is not exists: ${proxyConfig.sless.active} not in [${Object.keys(proxyConfig.sless)}]`);
        process.exit(1)
    }
    appLog('INFO',`TCP Server start ${proxyServer}:${proxyServerPort} to ${WebSocketSever}:${WebSocketSeverPort}`);
    let wss = getWsServer();
    appLog('INFO',`trying ${wss._url}`);
    wss.once('open', () => {
        appLog('INFO',`${WebSocketSever}:${WebSocketSeverPort} is available.`);
        wss.close();
    });
    wss.once('error', err => {
        appLog('ERROR',`${WebSocketSever}:${WebSocketSeverPort} is unavailable: ${err.code} ${err.message}\r\n${err}`);
    });
});
