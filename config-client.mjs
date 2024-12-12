export default {
    socket_https: false, // 服务器是否使用https
    socket_host: 'example.com', // 服务器地址
    socket_port: 80, // 服务器端口
    socket_ctl_path: 'websocket_path', // websocket服务地址

    serivce_name: 'local_server_one', // 服务名称
    websocket_token: 'websocket_token', // websocket注册码
    
    target_host: '192.168.1.1', // 被代理服务地址
    target_port: 80, // 被代理服务端口

    refresh_time: 1000 * 60 * 5, // 刷新Websocket间隔
    retry_time: 1000 * 2, // Websocket错误重试间隔
    sleep_time: '00:00-06:00' // 休眠时间(24小时制),时分，为空则不休眠, eg:01:00-06:00, 23:00-04:00
}