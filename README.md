网络访问: 浏览器>公网服务器>websocket转发>内网服务器转发>内网服务
注册服务: 内网服务器>创建websocket>公网服务器

socket监听服务端口A
    目标是websocket地址(自定义)
        将请求转发到websocket监听服务端口B
    其他, 将数据通过websocket链接转发

websocket监听服务端口B
    接受客户端的链接
    有转发数据时通知客户端新建连接
    通过新建的链接将数据发送给客户端

服务端 node server.mjs
客户端 node client.mjs 配置名
    node client.mjs v1 读取 config-v1.mjs