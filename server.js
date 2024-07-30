#!/usr/bin/env node
const expressServer = require('./server-express');
const wssServer = require('./sless/server-sless');
const http = require('http');

var port = process.env.PORT || 3000; // 3000 与dockfiler的端口号要一致
var uuid = process.env.UUID;
expressServer.set('port', port);

const server = http.createServer(expressServer);
server.listen(port);

wssServer(server, uuid);

server.on('error', onError);
server.on('listening', onListening);
 
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
    default:
      throw error;
  }
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
    console.log('Listening on ' + bind);
}