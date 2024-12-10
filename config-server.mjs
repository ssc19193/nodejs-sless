export default {
    socket_port: 80, // 服务器上socket端口
    socket_auth_path: '/web_auth_path', // 验证url
    socket_ctl_path: '/websocket_path', // websocket服务地址
    socket_ip_key: 'x-forward-for', // header中提供访问者IP的key

    websocket_token: 'websocket_token', // websocket注册码
    websocket_port: 81, // 服务器上websocket端口
}
