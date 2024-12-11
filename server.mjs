import wss_tool from './websocket-server.mjs'
import sks from './socket-server.mjs'

const config = {
    socket_port: process.env.SOCKET_PORT,
    socket_auth_path: process.env.SOCKET_AUTH_PATH,
    socket_ctl_path: process.env.SOCKET_CTL_PATH,
    socket_ip_key: process.env.SOCKET_IP_KEY,

    websocket_token: process.env.WEBSOCKET_TOKEN
}

new Promise((resolve, reject)=>{
    if(Object.keys(config).filter(key=>!config[key]).length){
        console.error('[WARN] Missing Env config, try local config-server.mjs')
        return resolve(import('./config-'+(process.argv[2] || 'server')+'.mjs'));
    }else{
        resolve({default:config});
    }
}).then(config=>{
    config = config.default;
    if(Object.keys(config).filter(key=>!config[key]).length){
        console.log('config is not fullfilled, exist now', config)
        return;
    }
    
    wss_tool.wss = wss_tool.init(config.websocket_token)
    sks.init(config, wss_tool)
})
