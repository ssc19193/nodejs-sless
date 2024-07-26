#!/usr/bin/env node
const expressServer = require('./server-express');
const slessServer = require('./sless/server-sless');
const http = require('http');

var port = process.env.PORT;
var uuid = process.env.UUID;
expressServer.set('port', port);

const server = http.createServer(expressServer);
server.listen(port);

const wss = slessServer(server, uuid);

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
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
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

// setInterval(()=> console.log(new Date().toISOString()), 1000)

