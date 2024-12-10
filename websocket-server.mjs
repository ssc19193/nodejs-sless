#!/usr/bin/env node
import {WebSocketServer, createWebSocketStream} from 'ws';

function init(websocket_port, websocket_token){
    console.log('[WS]init by ', websocket_port, websocket_token);
    const wss = new WebSocketServer({ port: websocket_port });

    wss.on('connection', (ws, req) => {
        let x_token = req.headers['x-token'];
        let x_type = req.headers['x-type'];
        let x_data = req.headers['x-data'];
        console.log('[WS]connect', x_token, x_type, x_data);
        
        if(websocket_token !== x_token){
            console.log('[WS]token is valid:', x_token, websocket_token);
            ws.send('ERR token is valid');
            ws.close();
            return;
        }

        if(x_type == 'ctl'){
            return handle_ctl(ws, x_data);
        }
        if(x_type == 'data'){
            return handle_data(ws);
        }

        console.log('[WS]type is not supported', x_type);
        ws.send('ERR type is not supported');
        ws.close();
    });

    wss.on('listening', () => {
        console.log(`[WS] server is running on port ${websocket_port}`);
    });
};

let ctrlWsMap = {};
const cbMap = {}

function handle_ctl(ws, data){
    ws.on('close', () => {
        ws.__service_key && delete ctrlWsMap[ws.__service_key];
        console.log('[WS-CTL]Client disconnected',ws.__service_key);
    });

    ws.on('error', (error) => {
        ws.__service_key && delete ctrlWsMap[ws.__service_key];
        console.error('[WS-CTL]WebSocket error:', ws.__service_key, error.message);
    });
    
    ws.on('pong', ()=>{
        ws.__last_time = Date.now();
    })

    if(ctrlWsMap[data]){
        ctrlWsMap[data].__service_key = null;
        ctrlWsMap[data].close();
    }
    ctrlWsMap[data] = ws;
    ctrlWsMap[data].__last_time = Date.now();
    ctrlWsMap[data].__service_key = data;
}

function handle_data(ws){
    ws.on('close', () => {
        console.log('[WS-DATA]Client disconnected');
    });

    ws.on('error', (error) => {
        console.error('[WS-DATA]WebSocket error:', error.message);
    });

    ws.once('message', (message) => {
        console.log('[WS-DATA]Received message => %s', message);

        let [method, idx] = message.toString().split(' ');
        if(method == 'DATA'){
            if(cbMap[idx]){
                console.log('[WS-DATA]OPENDED', idx);
                ws.send('OK');

                ws.on('close', () => {
                    console.log('[WS-DATA]CLOSED', idx);
                    ws.__socket?.end();
                });
                ws.on('error', (e) => {
                    console.log('[WS-DATA]ERROR', idx, e);
                    ws.__socket?.end();
                });

                let ws_socket = createWebSocketStream(ws);
                cbMap[idx].resolve(ws_socket);
            }else{
                console.log('[WS-DATA]callback of idx not exists', idx);
                ws.send('ERR callback of idx not exists');
                ws.close();
            }
            return;
        }

        console.log('[WS-DATA]method is not supported', method);
        ws.send('ERR method is not supported');
        ws.close();
    });
}

let idx = 1;

function openSocket(service){
    return new Promise((resolve, reject) => {
        let ctrlWs = ctrlWsMap[service];
        if(!ctrlWs){
            console.log('[WS]backend is not ready');
            return reject('backend is not ready');
        }
        let _idx = idx++;

        console.log('[WS]notice open', _idx);
        ctrlWs.send(`OPEN ${_idx}`);
        cbMap[''+_idx] = {resolve, reject};
    });
}

let checkInterval = 1000 * 5;

setInterval(()=>{
    let services = Object.keys(ctrlWsMap);
    for(let service of services){
        let ctrlWs = ctrlWsMap[service];
        if(!ctrlWs) return;

        if(ctrlWs.__last_time && ctrlWs.__last_time < Date.now() - checkInterval*2){
            console.log('[WS-CTL]control websocket offline', ctrlWs.__last_time, Date.now());
            delete ctrlWsMap[service];
        }
        ctrlWs.ping();
    }
}, checkInterval);

function getService(){
    return Object.keys(ctrlWsMap);
}

export default {
    init, openSocket, getService
}
