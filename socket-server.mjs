#!/usr/bin/env node
import net from 'net';

let activeService = null;
const ips = []
const htmlHeader = 'HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n';
const wsHeader =  [
    'Sec-WebSocket-Key', 'Upgrade', 'Sec-WebSocket-Version',
     'Sec-WebSocket-Extensions','x-token','x-type','x-data'
    ].map(line=>line.toLowerCase())

function getHtmlResponse(body){
    return htmlHeader +'<html>'
        +'<header>'
            +'<meta name="viewport" content="width=device-width, initial-scale=1">'
        +'</header>'
        +'<body style="text-align:center">'+ body +'</body>'
    +'</html>\r\n\r\n';
}

function getKeyInfo(data, headers){
    if(!data) return [null,null];

    data = data.toString().split('\n');
    if(!data.length) return [null, null];

    let result = {
        firstLine: data[0]
    }
    let headerRepeat = false;
    data.map(line => line?.split(':'))
        .map(line=> [line[0]?.trim()?.toLowerCase(), line[1]?.trim()])
        .filter(line=> !!line[0] && !!line[1])
        .map(line => {
            if(headers.indexOf(line[0]) != -1){
                if(result[line[0]]) headerRepeat = true;
                result[line[0]] = line[1] || null;
            }
        });
    return headerRepeat ? {firstLine: result.firstLine} : result;
}

function handle_auth(socket, socket_auth_path, services, ip){
    ip && ips.indexOf(ip) == '-1' && ips.push(ip);
    socket.write(getHtmlResponse(
        `<h3>Active: ${activeService}</h3>`
        +'<h3>Service</h3>'
        +services.map(one=>`<p><a href="${socket_auth_path}?${one}">${one}</a></p>`).join('')
        +`<h3>IP:${ip}</h3>`
        + ips.map(ip=>`<p>${ip}</p>`).join('')
    ));
    socket.end();
}


function handle_switch(socket, path, socket_auth_path, services){
    let service = path.substring(socket_auth_path.length+1);
    if(services.indexOf(service) == -1){
        activeService = null;
        socket.write(getHtmlResponse('<h1>Target service not exists</h1>'));
        socket.end();
        return;
    }
    activeService = service;
    socket.write(getHtmlResponse( 
        `<h2>Switch to service: ${service}</h2>`
        +`<script>setTimeout(()=>window.location.href='/', 1000)</script>`
    ));
    socket.end();
    return;
}

function init( config, ws_tool){
    const socket_port = config.socket_port;
    const socket_auth_path = config.socket_auth_path;
    const socket_ip_key = config.socket_ip_key;
    console.log('[TCP]init by ', config);

    const emitConnection = ws_tool.wss.emit.bind(ws_tool.wss, 'connection');

    const server = net.createServer((socket) => {
        console.log('[TCP]client connected');
        
        socket.once('data', function(data) {
            let keyInfo = getKeyInfo(data, [socket_ip_key, ...wsHeader])
            let ip = keyInfo[socket_ip_key];
            console.log('[SK]comming', ip, keyInfo.firstLine);

            let method, path;
            if(!!keyInfo.firstLine){
                [method, path] = keyInfo.firstLine.split(' ');
            }
            if(path == config.socket_ctl_path){
                let headers = {}
                for(let key of wsHeader){
                    headers[key] = keyInfo[key] || null;
                }
                return ws_tool.wss.handleUpgrade({
                    method: method,
                    headers:headers,
                }, socket, Buffer.alloc(0), emitConnection);
            }
            if(path == socket_auth_path){
                return handle_auth(socket, socket_auth_path, ws_tool.getService(), ip);
            }
            if(path.indexOf(socket_auth_path+'?') == 0){
                return handle_switch(socket, path, socket_auth_path, ws_tool.getService());
            }
            if(activeService == null){
                socket.write(getHtmlResponse('<p>Need to select service first</p>'));
                socket.end();
                return;
            }
            if(!ip || ips.indexOf(ip) == -1){
                socket.write(getHtmlResponse('<p>Backend is preparing</p>'));
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
        ws_tool.wss.emit.bind(ws_tool.wss, 'error').apply(ws_tool.wss, err);
    });
    server.listen(socket_port, () => {
        console.log(`[TCP]TCP server is running on port ${socket_port}`);
        ws_tool.wss.emit.bind(ws_tool.wss, 'listening').apply(ws_tool.wss);
    });
}

export default {
    init
}