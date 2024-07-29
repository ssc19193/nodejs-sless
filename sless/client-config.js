module.exports = {
    loglevel : 'INFO', // DEBUG
    domains:[
        '*docker.com','*google.com',
    ],
    proxy:{
        proxyServer: '127.0.0.1',
        proxyServerPort: 8081
    },
    sless:{
        active:'v2',
        v2:{
            WebSocketSever: '127.0.0.1', // 填服务器的域名
            WebSocketSeverPort: 8848, // 填服务器的端口
            WebSocketSeverTls: false, // 是否是https的, 影响链接时用wss还是ws
            rejectUnauthorized: true, // 使用wss协议时, 是否验证域名证书
            uuid : 'e3c51479-c0e1-4a19-894b-fddc5bb67556'
        }
    }
}