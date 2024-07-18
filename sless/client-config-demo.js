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
            WebSocketSever: '127.0.0.1',
            WebSocketSeverPort: 8081,
            WebSocketSeverTls: false,
            uuid : '623a5a8e-1cd7-4301-bd26'
        }
    }
}