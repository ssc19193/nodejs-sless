let net = require('net');
let serverPort = 1081;
let proxyServer = '127.0.0.1';
let proxyServerPort = 1080;

net.createServer(function (client) {
    console.log('conn')
    client.once('data', function(data){
        let server = net.createConnection(proxyServerPort, proxyServer);
        server.write(data)
        client.on("data", function (data) { server.write(data); });
        server.on("data", function (data) { client.write(data); });
    });
}).listen(serverPort);

console.log('Proxy server running at localhost:' + local_port);

process.on('uncaughtException', function (err) {
    console.log("\nProcess Error!!!!");
    console.log(err);
});
