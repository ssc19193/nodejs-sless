const path = require('path');
const file = require('fs');

const configFile = path.join(__dirname, '../../sless-client-config.js');
if(file.existsSync(configFile)){
    module.exports = require(configFile);
}else{
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
                WebSocketSeverPort: 8848,
                WebSocketSeverTls: false,
                uuid : '623a5a8e-1cd7-4301-bd26'
            }
        }
    }
}
