#!/usr/bin/env node
import net from 'net';

let activeService = null;
let ips = []
let htmlHeader = 'HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n';

function getKeyInfo(data, header_key){
    if(!data) return [null,null];

    data = data.toString().split('\n');
    if(!data.length) return [null, null];
    
    let remoteIp = data.filter(line => line && line.toLowerCase().startsWith(header_key))[0];
    remoteIp = remoteIp?.split(':')[1]?.trim();
    return [data[0], remoteIp || null];
}

function handle_ws(socket, websocket_port, data){
    const client = new net.Socket();
    client.connect(websocket_port, '127.0.0.1', () => {
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

function handle_auth(socket, socket_auth_path, services, ip){
    ip && ips.indexOf(ip) == '-1' && ips.push(ip);
    socket.write(htmlHeader
        +'<html>'
            +'</body>'
            +`<h3>Active: ${activeService}</h3>`
            +`<h3>IP:${ip}</h3>`
            +`<p>history: ${ips.join(',')}</p>`
            +'<h3>Registered</h3>'
            +'<ul>'
            +services.map(one=>`<li><a href="${socket_auth_path}?${one}">${one}</a></li>`).join('')
            +'</ul>'
            +'<body>'
        +'</html>\r\n\r\n');
    socket.end();
}


function handle_switch(socket, path, socket_auth_path, services){
    let service = path.substring(socket_auth_path.length+1);
    if(services.indexOf(service) == -1){
        activeService = null;
        socket.write(htmlHeader + '<h1>Target service not exists</h1>\r\n\r\n');
        socket.end();
        return;
    }
    activeService = service;
    socket.write(htmlHeader 
        +'<html>'
            +'</body>'
            +`<h2>Switch to service: ${service}</h2>`
            +`<script>setTimeout(()=>window.location.href='/', 1000)</script>`
            +'<body>'
        +'</html>\r\n\r\n');
    socket.end();
    return;
}

function init( config, ws_tool){
    const socket_port = config.socket_port;
    const socket_auth_path = config.socket_auth_path;
    const socket_ip_key = config.socket_ip_key;
    console.log('[TCP]init by ', config);

    const server = net.createServer((socket) => {
        console.log('[TCP]client connected');
        
        socket.once('data', function(data) {
            let [firstLine, ip] = getKeyInfo(data, socket_ip_key)
            console.log('[SK]comming', ip, firstLine);

            let method, path;
            if(!!firstLine){
                [method, path] = firstLine.split(' ');
            }
            if(path == config.socket_ctl_path){
                return handle_ws(socket, config.websocket_port, data);
            }
            if(path == socket_auth_path){
                return handle_auth(socket, socket_auth_path, ws_tool.getService(), ip);
            }
            if(path.indexOf(socket_auth_path+'?') == 0){
                return handle_switch(socket, path, socket_auth_path, ws_tool.getService());
            }
            if(activeService == null){
                socket.write(htmlHeader+'Need to select service first\r\n\r\n');
                socket.end();
                return;
            }
            if(ips.indexOf(ip) == -1){
                socket.write(htmlHeader+'Backend is not preparing\r\n\r\n');
                socket.end();
                return;
            }

            console.log('[SK]notice open');
            ws_tool.openSocket(activeService)
                .then(ws_socket=>{
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
                    socket.write(htmlHeader+err);
                    socket.end()
                })
        });
    });
    
    server.on('error', (err) => {
        console.error('[TCP]Server error:', err.message);
    });
    server.listen(socket_port, () => {
        console.log(`[TCP]TCP server is running on port ${socket_port}`);
    });
}

export default {
    init
}