#!/usr/bin/env node
import net from 'net';

function getFirstLine(data, maxLength = 200){
    for( let i = 0; i < data.length-1 && i < maxLength; i++ ){
        if( data[i] == 13 && data[i+1] == 10 ){
            return data.subarray(0,i).toString();
        }
    }
    return null;
}

function handle_ws(socket, server_websockt_port, data){
    const client = new net.Socket();
    client.connect(server_websockt_port, '127.0.0.1', () => {
        console.log('[WS-PX]Connected to WS');

        client.pipe(socket).pipe(client)
        client.write(data)
    });

    client.on('close', () => {
        console.log('[WS-PX]Connection closed');
        socket.end();
    });
    client.on('error', (err) => {
        console.error(`[WS-PX]Error: ${err.message}`);
        socket.end();
    });
    
    socket.on('close', () => {
        console.log('[SK-PX]Client close');
        client.end();
    });
    socket.on('end', () => {
        console.log('[SK-PX]Client disconnected');
        client.end();
    });
    socket.on('error', (err) => {
        console.error('[SK-PX]Socket error:', err.message);
        client.end();
    });
}

let activeService = null;

function init(port, server_websocket_path, server_websockt_port,
    server_view_service_path, server_choose_service_path, ws_tool){
    console.log('[TCP]init by ', port, server_websocket_path, server_websockt_port, server_view_service_path, server_choose_service_path);
    if(!port || !server_websocket_path || !server_websockt_port 
        || !server_view_service_path || !server_choose_service_path)
        return console.log('[TCP]args error');

    const server = net.createServer((socket) => {
        console.log('[TCP]client connected');
        
        socket.once('data', function datahand(data) {
            let firstLine = getFirstLine(data);
            console.log('[SK]comming', firstLine);

            let method, path;
            if(!!firstLine){
                [method, path] = firstLine.split(' ');
            }
            if(path == server_websocket_path){
                console.log('[SK]handle_ws');
                return handle_ws(socket, server_websockt_port, data);
            }
            if(path == server_view_service_path){
                console.log('[SK]'+path);
                socket.write('HTTP/1.1 200 OK\r\n\r\n Registered: '
                    +ws_tool.getService().join(',') 
                    + ", Active:" + activeService+'\r\n\r\n');
                socket.end();
                return;
            }
            if(path.indexOf(server_choose_service_path) == 0){
                console.log('[SK]'+path);
                let service = path.substring(server_choose_service_path.length+1);
                let services = ws_tool.getService();
                if(services.indexOf(service) >= 0){
                    activeService = service;
                    socket.write('HTTP/1.1 200 OK\r\n\r\nSwitch to service: '+service+'\r\n\r\n');
                    socket.end();
                    return;
                }else{
                    socket.write('HTTP/1.1 200 OK\r\n\r\nTarget service not exists\r\n\r\n');
                    socket.end();
                    return;
                }
            }
            if(activeService == null){
                socket.write('HTTP/1.1 200 OK\r\n\r\nNeed to select service first\r\n\r\n');
                socket.end();
                return;
            }

            console.log('[SK]openSocket');
            ws_tool.openSocket(activeService)
                .then(ws_socket=>{
                    console.log('[SK-DATA]OPEND');
                    
                    socket.on('close', () => {
                        console.log('[SK-DATA]Client close');
                        ws_socket.end();
                    });
                    socket.on('end', () => {
                        console.log('[SK-DATA]Client disconnected');
                        ws_socket.end();
                    });
                    socket.on('error', (err) => {
                        console.error('[SK-DATA]Socket error:', err.message);
                        ws_socket.end();
                    });

                    ws_socket.pipe(socket).pipe(ws_socket)
                    ws_socket.write(data);
                }).catch(err=>{
                    socket.write('HTTP/1.1 200 OK\r\n\r\n'+err);
                    socket.end()
                })
        });
    });
    
    server.on('error', (err) => {
        console.error('[TCP]Server error:', err.message);
    });
    server.listen(port, () => {
        console.log(`[TCP]TCP server is running on port ${port}`);
    });
}

export default {
    init
}