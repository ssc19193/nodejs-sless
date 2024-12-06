import wss_tool from './websocket-server.mjs'
import sks from './socket-server.mjs'

const config = {
    SERVER_WEBSOCKET_PORT: process.env.SERVER_WEBSOCKET_PORT,
    SERVER_WEBSOCKET_PATH: process.env.SERVER_WEBSOCKET_PATH,
    REGISTER_TOKEN: process.env.REGISTER_TOKEN,
    SERVER_SOCKET_PORT: process.env.SERVER_SOCKET_PORT
}

let start = Promise.resolve();
if(!config.SERVER_WEBSOCKET_PORT 
    ||!config.SERVER_WEBSOCKET_PATH 
    ||!config.REGISTER_TOKEN 
    ||!config.SERVER_SOCKET_PORT){
    start = import('./config.mjs').then(local_config=>{
        Object.keys(config).map(key=>{
            config[key] = local_config.default[key]
        })
    })
}

start.then(()=>{
    wss_tool.init(config.SERVER_WEBSOCKET_PORT, 
        config.REGISTER_TOKEN)
        
    sks.init(config.SERVER_SOCKET_PORT,
        config.SERVER_WEBSOCKET_PATH,
        config.SERVER_WEBSOCKET_PORT,
        wss_tool)
})