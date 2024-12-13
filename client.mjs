import WebSocket, { createWebSocketStream } from 'ws';
import net from 'net';

let default_sleep_time = 1000*60*1;
let preWsCtl = null;
function start(config) {
    const websocket_url = (config.socket_https ? 'wss://' : 'ws://') 
                            + config.socket_host + ":" + config.socket_port
                            + config.socket_ctl_path;
    const wsCtl = new WebSocket(websocket_url, {
        headers: {
            'x-token': config.websocket_token,
            'x-type': 'ctl',
            'x-data': config.serivce_name
        }
    });
    wsCtl.__start_time = new Date();

    wsCtl.on('open', function open() {
        console.log('[CTL]Connected to WebSocket server');
        preWsCtl = wsCtl;
        
        reConn(config, config.refresh_time);
    });

    wsCtl.on('close', function close() {
        console.log('[CTL]Disconnected from WebSocket server,' + (new Date() - wsCtl.__start_time)/1000);
        
        preWsCtl == wsCtl && reConn(config, config.retry_time);
    });

    wsCtl.on('error', function error(err) {
        console.error(`[CTL]WebSocket error: ${err.message}, `+ (new Date() - wsCtl.__start_time)/1000);
        
        preWsCtl = wsCtl;
    });

    wsCtl.on('message', function incoming(data) {
        console.log(`[CTL]Received: ${data}`);

        if (data.toString().indexOf('ERR') > -1) {
            return;
        }

        let [method, idx] = data.toString().split(' ');
        if (method !== 'OPEN') {
            console.log(`[CTL]method not supported`);
            return;
        }

        const wsData = new WebSocket(websocket_url, {
            headers: {
                'x-token': config.websocket_token,
                'x-type': 'data'
            }
        });
        wsData.on('open', function open() {
            console.log('[DATA]Connected to WebSocket server');

            const client = new net.Socket();
            client.connect(config.target_port, config.target_host, () => {
                console.log('[CONN]Connected to server');

                wsData.once('message', function incoming(data) {
                    console.log(`[DATA]Received: ${data}`);
                    
                    let [ack, msg] = data.toString().split(' ');
                    if (ack !== 'OK') {
                        console.log(`[DATA]RE CONNECT ERROR ${msg}`);
                        wsData.close();
                        return;
                    } else {
                        let socket = createWebSocketStream(wsData);
                        socket.pipe(client).pipe(socket)

                        socket.on('close', function () {
                            console.log('[SOCKET]Connection closed');
                            wsData.close();
                            client.end();
                        });
                        socket.on('error', function (err) {
                            console.log('[SOCKET]Connection error', err?.message);
                            wsData.close();
                            client.end();
                        });
                    }
                });

                wsData.send('DATA ' + idx)
            });

            client.on('close', () => {
                console.log('[CONN]Connection closed');
                wsData.close();
            });
            client.on('error', (err) => {
                console.error(`[CONN]Error: ${err}`);
                wsData.close();
            });
            wsData.on('close', function () {
                client.end();
            });
            wsData.on('error', function (err) {
                client.end();
            });
        });
        wsData.on('close', function () {
            console.log('[DATA]Connection closed');
        });
        wsData.on('error', function (err) {
            console.error(`[DATA]Error: ${err}`);
        });
    });
    return wsCtl;
}

let preReConnId = null;
function reConn(config, time){
	preReConnId && clearTimeout(preReConnId);
	preReConnId = setTimeout(function(){
        if(config.sleep_time){
            const now = new Date();
            let minutes =now.getHours() * 60 + now.getMinutes();

            if(config.sleep_time[0] > config.sleep_time[1]){
                if( config.sleep_time[0] >= minutes || minutes >= config.sleep_time[1] ){
                    console.log('[CTL]sleeping...', minutes, ...config.sleep_time)
                    return reConn(config, default_sleep_time)
                }
            }else{
                if( config.sleep_time[0] <= minutes && minutes <= config.sleep_time[1] ){
                    console.log('[CTL]sleeping...', minutes, ...config.sleep_time)
                    return reConn(config, default_sleep_time)
                }
            }
        }
		start(config);
	}, time);
}
let config_file = './config-'+(process.argv[2] || 'default')+'.mjs'

import(config_file).then(config=>config.default)
.then(config=>{
    console.log('[CTL]Starting...', config);

    let reg = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/;
    if(config.sleep_time && reg.test(config.sleep_time)){
        config.sleep_time = config.sleep_time.match(reg);
        config.sleep_time = [
            parseInt(config.sleep_time[1]) * 60 + parseInt(config.sleep_time[2]),
            parseInt(config.sleep_time[3]) * 60 + parseInt(config.sleep_time[4])
        ]
    }else{
        config.sleep_time = null;
    }
    start(config); 
})
