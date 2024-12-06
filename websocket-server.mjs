#!/usr/bin/env node
import {WebSocketServer, createWebSocketStream} from 'ws';

function init(port, register_token){
    console.log('[WS]init by ', port, register_token);
    if(!port || !register_token)
        return console.log('[WS]args error');

    const wss = new WebSocketServer({ port: port });

    wss.on('connection', (ws, req) => {
        let x_token = req.headers['x-token'];
        let x_type = req.headers['x-type'];
        console.log('[WS]connect', x_token, x_type);
        
        if(register_token !== x_token){
            console.log('[WS]token is valid:', x_token, register_token);
            ws.send('ERR token is valid');
            ws.close();
            return;
        }

        console.log('[WS]using type', x_type);
        if(x_type == 'ctl'){
            return handle_ctl(ws);
        }
        if(x_type == 'data'){
            return handle_data(ws);
        }

        console.log('[WS]type is not supported', x_type);
        ws.send('ERR type is not supported');
        ws.close();
    });

    wss.on('listening', () => {
        console.log(`[WS] server is running on port ${port}`);
    });
};

let ctrlWs = null;
const cbMap = {}

function handle_ctl(ws){
    ws.on('close', () => {
        console.log('[WS-CTL]Client disconnected');
    });

    ws.on('error', (error) => {
        console.error('[WS-CTL]WebSocket error:', error.message);
    });

    ctrlWs = ws;
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

function openSocket(){
    return new Promise((resolve, reject) => {
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

export default {
    init, openSocket
}
