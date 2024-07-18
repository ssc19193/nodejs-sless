let net = require('net');
let seq = 1000000;

net.createServer(function (client) {
    console.log('conn')
    client.once('data', function(data){
        let server = net.createConnection(1080, '127.0.0.1');
        server.write(data)
        client.on("data", function (data) { server.write(data); });
        server.on("data", function (data) { client.write(data); });
    });
}).listen(1081);

console.log('Proxy server running at localhost:' + local_port);

process.on('uncaughtException', function (err) {
    console.log("\nProcess Error!!!!");
    console.log(err);
});
