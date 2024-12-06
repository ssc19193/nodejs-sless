import WebSocket, { createWebSocketStream } from 'ws';
import net from 'net';
import config from './config.mjs'

function start(REGISTER_TOKEN, SERVER_WEBSOCKET_URL, CLIENT_SOCKET_HOST, CLIENT_SOCKET_PORT) {
    const wsCtl = new WebSocket(SERVER_WEBSOCKET_URL, {
        headers: {
            'x-token': REGISTER_TOKEN,
            'x-type': 'ctl'
        }
    });

    wsCtl.on('open', function open() {
        console.log('[CTL]Connected to WebSocket server');
    });

    wsCtl.on('close', function close() {
        console.log('[CTL]Disconnected from WebSocket server');
    });

    wsCtl.on('error', function error(err) {
        console.error(`[CTL]WebSocket error: ${err.message}`);
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

        const wsData = new WebSocket(SERVER_WEBSOCKET_URL, {
            headers: {
                'x-token': REGISTER_TOKEN,
                'x-type': 'data'
            }
        });
        wsData.on('open', function open() {
            console.log('[DATA]Connected to WebSocket server');

            const client = new net.Socket();
            client.connect(CLIENT_SOCKET_PORT, CLIENT_SOCKET_HOST, () => {
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
                            console.log('[SOCKET]Connection error', err);
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
}

start(
    config.REGISTER_TOKEN,
    (config.SERVER_HTTPS ? 'wss://' : 'ws://')
    + config.SERVER_SOCKET_HOST + ":" + config.SERVER_SOCKET_PORT
    + config.SERVER_WEBSOCKET_PATH,
    config.CLIENT_SOCKET_HOST,
    config.CLIENT_SOCKET_PORT
)
